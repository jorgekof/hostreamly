const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const TwoFactorService = require('../services/twoFactorService');
const User = require('../models/User');
const logger = require('../utils/logger');
const { createSmartRateLimit } = require('../middleware/validation');

const router = express.Router();

// Rate limiting for 2FA operations
const twoFactorLimiter = createSmartRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many 2FA attempts, please try again later',
  prefix: '2fa'
});

const setupLimiter = createSmartRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 setup attempts per hour
  message: 'Too many 2FA setup attempts, please try again later',
  prefix: '2fa_setup'
});

// Validation middleware
const validateToken = [
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Token must be a 6-digit number')
];

const validateBackupCode = [
  body('backupCode')
    .isLength({ min: 8, max: 8 })
    .isAlphanumeric()
    .withMessage('Backup code must be an 8-character alphanumeric string')
];

/**
 * @route   POST /api/2fa/setup
 * @desc    Generate 2FA secret and QR code for setup
 * @access  Private
 */
router.post('/setup', auth, setupLimiter, async (req, res, next) => {
  try {
    const user = req.user;
    
    // Check if 2FA is already enabled
    if (user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '2FA is already enabled for this account'
      });
    }
    
    // Generate secret and QR code
    const secretData = await TwoFactorService.generateSecret(user);
    
    res.json({
      success: true,
      message: '2FA setup initiated',
      data: {
        qrCode: secretData.qrCode,
        manualEntryKey: secretData.manualEntryKey,
        backupCodes: null // Will be generated after verification
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/enable
 * @desc    Enable 2FA after verifying setup token
 * @access  Private
 */
router.post('/enable', auth, twoFactorLimiter, validateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    const { token, secret } = req.body;
    const user = req.user;
    
    // Check if 2FA is already enabled
    if (user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '2FA is already enabled for this account'
      });
    }
    
    // Verify the token with the provided secret
    const isValidToken = TwoFactorService.verifyToken(token, secret);
    
    if (!isValidToken) {
      logger.security('Invalid 2FA setup token', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // Generate backup codes
    const backupCodes = TwoFactorService.generateBackupCodes();
    const hashedBackupCodes = await TwoFactorService.hashBackupCodes(backupCodes);
    
    // Enable 2FA
    await TwoFactorService.enable2FA(user, secret, hashedBackupCodes);
    
    res.json({
      success: true,
      message: '2FA has been successfully enabled',
      data: {
        backupCodes: backupCodes,
        message: 'Please save these backup codes in a secure location. They will not be shown again.'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/verify-login
 * @desc    Complete login after 2FA verification
 * @access  Public (used during login process)
 */
router.post('/verify-login', twoFactorLimiter, validateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    const { token, tempToken } = req.body;
    const { cache } = require('../config/redis');
    const jwt = require('jsonwebtoken');
    
    // Get pending login session
    const pendingSession = await cache.get(`2fa_pending:${tempToken}`);
    if (!pendingSession) {
      return res.status(400).json({
        error: 'Invalid Session',
        message: 'Login session expired or invalid'
      });
    }
    
    // Find user
    const user = await User.findByPk(pendingSession.userId);
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request'
      });
    }
    
    // Verify token
    const isValidToken = TwoFactorService.verifyToken(token, user.two_factor_secret);
    
    if (!isValidToken) {
      logger.security('Invalid 2FA login token', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // Generate tokens
    const generateTokens = (user) => {
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );
      
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      return { accessToken, refreshToken };
    };
    
    // Complete login process
    await user.resetLoginAttempts();
    await user.updateLastLogin(pendingSession.ip);
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Store refresh token
    const refreshExpiry = pendingSession.rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600;
    await cache.set(`refresh_token:${user.id}`, refreshToken, refreshExpiry);
    
    // Clean up pending session
    await cache.del(`2fa_pending:${tempToken}`);
    
    logger.audit('2fa_login_completed', user.id, 'security', {
      email: user.email,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Login completed successfully',
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
 * @route   POST /api/2fa/verify-backup-login
 * @desc    Complete login using backup code
 * @access  Public (used during login process)
 */
router.post('/verify-backup-login', twoFactorLimiter, validateBackupCode, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    const { backupCode, tempToken } = req.body;
    const { cache } = require('../config/redis');
    const jwt = require('jsonwebtoken');
    
    // Get pending login session
    const pendingSession = await cache.get(`2fa_pending:${tempToken}`);
    if (!pendingSession) {
      return res.status(400).json({
        error: 'Invalid Session',
        message: 'Login session expired or invalid'
      });
    }
    
    // Find user
    const user = await User.findByPk(pendingSession.userId);
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request'
      });
    }
    
    // Verify backup code
    const verificationResult = await TwoFactorService.verifyBackupCode(
      backupCode, 
      user.backup_codes
    );
    
    if (!verificationResult.valid) {
      logger.security('Invalid 2FA backup code during login', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid Code',
        message: 'The provided backup code is invalid or already used'
      });
    }
    
    // Update user's backup codes
    await user.update({
      backup_codes: verificationResult.updatedCodes
    });
    
    // Generate tokens
    const generateTokens = (user) => {
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );
      
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      return { accessToken, refreshToken };
    };
    
    // Complete login process
    await user.resetLoginAttempts();
    await user.updateLastLogin(pendingSession.ip);
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Store refresh token
    const refreshExpiry = pendingSession.rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600;
    await cache.set(`refresh_token:${user.id}`, refreshToken, refreshExpiry);
    
    // Clean up pending session
    await cache.del(`2fa_pending:${tempToken}`);
    
    // Check remaining backup codes
    const remainingCodes = TwoFactorService.getUnusedBackupCodesCount(
      verificationResult.updatedCodes
    );
    
    logger.audit('2fa_backup_login_completed', user.id, 'security', {
      email: user.email,
      ip: req.ip,
      remainingCodes
    });
    
    res.json({
      success: true,
      message: 'Login completed successfully with backup code',
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
        },
        warning: remainingCodes <= 2 ? 'You have few backup codes remaining. Consider regenerating them.' : null
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/verify-backup
 * @desc    Verify backup code during login
 * @access  Public (used during login process)
 */
router.post('/verify-backup', twoFactorLimiter, validateBackupCode, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    const { backupCode, userId } = req.body;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request'
      });
    }
    
    // Verify backup code
    const verificationResult = await TwoFactorService.verifyBackupCode(
      backupCode, 
      user.backup_codes
    );
    
    if (!verificationResult.valid) {
      logger.security('Invalid 2FA backup code', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid Code',
        message: 'The provided backup code is invalid or already used'
      });
    }
    
    // Update user's backup codes
    await user.update({
      backup_codes: verificationResult.updatedCodes
    });
    
    // Check remaining backup codes
    const remainingCodes = TwoFactorService.getUnusedBackupCodesCount(
      verificationResult.updatedCodes
    );
    
    logger.audit('2fa_backup_code_used', user.id, 'security', {
      email: user.email,
      ip: req.ip,
      remainingCodes
    });
    
    res.json({
      success: true,
      message: 'Backup code verified successfully',
      data: {
        remainingBackupCodes: remainingCodes,
        warning: remainingCodes <= 2 ? 'You have few backup codes remaining. Consider regenerating them.' : null
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable 2FA for user account
 * @access  Private
 */
router.post('/disable', auth, twoFactorLimiter, validateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    const { token } = req.body;
    const user = req.user;
    
    // Check if 2FA is enabled
    if (!user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '2FA is not enabled for this account'
      });
    }
    
    // Verify current token before disabling
    const isValidToken = TwoFactorService.verifyToken(token, user.two_factor_secret);
    
    if (!isValidToken) {
      logger.security('Invalid 2FA token for disable attempt', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // Disable 2FA
    await TwoFactorService.disable2FA(user);
    
    res.json({
      success: true,
      message: '2FA has been successfully disabled'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/regenerate-backup-codes
 * @desc    Regenerate backup codes
 * @access  Private
 */
router.post('/regenerate-backup-codes', auth, twoFactorLimiter, validateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    const { token } = req.body;
    const user = req.user;
    
    // Check if 2FA is enabled
    if (!user.two_factor_enabled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '2FA is not enabled for this account'
      });
    }
    
    // Verify current token
    const isValidToken = TwoFactorService.verifyToken(token, user.two_factor_secret);
    
    if (!isValidToken) {
      logger.security('Invalid 2FA token for backup code regeneration', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // Regenerate backup codes
    const newBackupCodes = await TwoFactorService.regenerateBackupCodes(user);
    
    res.json({
      success: true,
      message: 'Backup codes have been regenerated',
      data: {
        backupCodes: newBackupCodes,
        message: 'Please save these new backup codes in a secure location. Old codes are no longer valid.'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get('/status', auth, async (req, res, next) => {
  try {
    const user = req.user;
    
    const remainingBackupCodes = user.two_factor_enabled 
      ? TwoFactorService.getUnusedBackupCodesCount(user.backup_codes)
      : 0;
    
    res.json({
      success: true,
      data: {
        enabled: user.two_factor_enabled,
        remainingBackupCodes: remainingBackupCodes,
        setupRequired: !user.two_factor_enabled
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;