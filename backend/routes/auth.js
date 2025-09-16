const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware: auth, blacklistToken } = require('../middleware/auth');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const { AppError, ValidationError, AuthenticationError } = require('../middleware/errorHandler');
const { 
  handleValidationErrors: validationHandler, 
  sanitizeHtml, 
  validateSecureUrl,
  createSmartRateLimit 
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting configurations mejoradas
const loginLimiter = createSmartRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 attempts per window
  message: 'Too many login attempts, please try again later',
  prefix: 'login',
  skipAdmin: true
});

const registerLimiter = createSmartRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Más restrictivo para registro
  message: 'Too many registration attempts, please try again later',
  prefix: 'register'
});

const forgotPasswordLimiter = createSmartRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later',
  prefix: 'forgot_password'
});

// Validation middleware mejorada con sanitización XSS
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  sanitizeHtml('username'), // Sanitizar XSS
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('first_name')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name is required and must be less than 50 characters'),
  sanitizeHtml('first_name'), // Sanitizar XSS
  body('last_name')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name is required and must be less than 50 characters'),
  sanitizeHtml('last_name') // Sanitizar XSS
];

const validateLogin = [
  body('login')
    .notEmpty()
    .withMessage('Email or username is required'),
  sanitizeHtml('login'), // Sanitizar XSS
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

// Helper functions
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    is_premium: user.is_premium
  };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
  
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Usar el handler de validación centralizado
const handleValidationErrors = validationHandler;

// Routes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerLimiter, validateRegister, handleValidationErrors, async (req, res, next) => {
  try {
    const { email, username, password, first_name, last_name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email, username);
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ValidationError('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ValidationError('Username already taken');
      }
    }
    
    // Create user
    const user = await User.create({
      email,
      username,
      password,
      first_name,
      last_name,
      verification_token: crypto.randomBytes(32).toString('hex'),
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Store refresh token in Redis
    await cache.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 3600); // 7 days
    
    // Log successful registration
    logger.security('user_registered', 'success', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_verified: user.is_verified,
          is_premium: user.is_premium
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, async (req, res, next) => {
  try {
    const { login, password, remember_me = false } = req.body;
    
    // Find user by email or username
    const user = await User.findByEmailOrUsername(login, login);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.locked_until - Date.now()) / 1000 / 60);
      throw new AuthenticationError(`Account locked. Try again in ${lockTimeRemaining} minutes`);
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      
      logger.security('login_failed', 'warning', {
        userId: user.id,
        email: user.email,
        reason: 'invalid_password',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }
    
    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    await user.updateLastLogin(req.ip, req.get('User-Agent'));
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Store refresh token in Redis with appropriate expiration
    const refreshExpiry = remember_me ? 30 * 24 * 3600 : 7 * 24 * 3600; // 30 days or 7 days
    await cache.set(`refresh_token:${user.id}`, refreshToken, refreshExpiry);
    
    // Log successful login
    logger.security('user_logged_in', 'success', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      rememberMe: remember_me
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          role: user.role,
          is_verified: user.is_verified,
          is_premium: user.is_premium,
          premium_expires_at: user.premium_expires_at,
          storage_used: user.storage_used,
          storage_limit: user.storage_limit,
          bandwidth_used_month: user.bandwidth_used_month,
          bandwidth_limit_month: user.bandwidth_limit_month
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token exists in Redis
    const storedToken = await cache.get(`refresh_token:${decoded.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new AuthenticationError('Invalid refresh token');
    }
    
    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }
    
    // Generate new access token
    const { accessToken } = generateTokens(user);
    
    logger.security('token_refreshed', 'success', {
      userId: user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Invalid or expired refresh token'));
    } else {
      next(error);
    }
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // Blacklist the current access token
    await blacklistToken(req.token);
    
    // Remove refresh token from Redis if provided
    if (refreshToken) {
      await cache.del(`refresh_token:${req.user.id}`);
    }
    
    logger.security('user_logged_out', 'success', {
      userId: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', auth, async (req, res, next) => {
  try {
    // Remove all refresh tokens for this user
    await cache.del(`refresh_token:${req.user.id}`);
    
    // Blacklist current token
    await blacklistToken(req.token);
    
    // Update user's token version to invalidate all existing tokens
    await User.update(
      { token_version: Date.now() },
      { where: { id: req.user.id } }
    );
    
    logger.security('user_logged_out_all_devices', 'success', {
      userId: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, handleValidationErrors, async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpires
    });
    
    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await emailService.sendPasswordResetEmail(user.email, resetUrl);
    
    logger.security('password_reset_requested', 'info', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validateResetPassword, handleValidationErrors, async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
    
    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }
    
    // Update password and clear reset token
    await user.update({
      password,
      password_reset_token: null,
      password_reset_expires: null,
      login_attempts: 0,
      account_locked_until: null
    });
    
    // Invalidate all existing sessions
    await cache.del(`refresh_token:${user.id}`);
    
    logger.security('password_reset_completed', 'success', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post('/change-password', auth, validateChangePassword, handleValidationErrors, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }
    
    // Update password
    await user.update({ password: newPassword });
    
    // Invalidate all existing sessions except current one
    await cache.del(`refresh_token:${user.id}`);
    
    logger.security('password_changed', 'success', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password', 'password_reset_token', 'password_reset_expires', 
                 'verification_token', 'two_factor_secret']
      }
    });
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      throw new ValidationError('Verification token is required');
    }
    
    const user = await User.findOne({
      where: {
        verification_token: token,
        verification_token_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
    
    if (!user) {
      throw new AuthenticationError('Invalid or expired verification token');
    }
    
    await user.update({
      is_verified: true,
      verification_token: null,
      verification_token_expires: null
    });
    
    logger.security('email_verified', 'success', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/resend-verification', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    if (user.is_verified) {
      throw new ValidationError('Email is already verified');
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await user.update({
      verification_token: verificationToken,
      verification_token_expires: verificationExpires
    });
    
    // TODO: Send verification email
    // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    // await emailService.sendVerificationEmail(user.email, verificationUrl);
    
    logger.security('verification_email_resent', 'info', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  sanitizeHtml('name'), // Sanitizar XSS
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  sanitizeHtml('username'), // Sanitizar XSS
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
  sanitizeHtml('bio'), // Sanitizar XSS
  validateSecureUrl('website', { allowHttp: true }).optional(), // Validación segura de URL
  body('location').optional().isLength({ max: 100 }).withMessage('Location must not exceed 100 characters'),
  sanitizeHtml('location'), // Sanitizar XSS
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { name, email, username, bio, website, location, phone } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }
    
    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already in use'
        });
      }
    }
    
    // Update user profile
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    
    await user.update(updateData);
    
    // Return updated user data (excluding sensitive information)
    const updatedUser = await User.findByPk(user.id, {
      attributes: {
        exclude: ['password', 'password_reset_token', 'password_reset_expires', 
                 'verification_token', 'two_factor_secret']
      }
    });
    
    logger.audit('profile_updated', user.id, 'user', {
      userId: user.id,
      email: user.email,
      changes: Object.keys(updateData)
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;