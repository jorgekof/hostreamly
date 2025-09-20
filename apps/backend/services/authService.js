const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const { Op } = require('sequelize');

// Lazy load models to avoid circular dependencies
let User = null;
let logger = null;

try {
  const models = require('../models');
  User = models.User;
} catch (error) {
  console.log('Models not available yet, will be loaded later');
}

try {
  logger = require('../utils/logger');
} catch (error) {
  logger = console;
}

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    this.lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000; // 15 minutes
    this.initialized = false;
  }

  /**
   * Initialize the auth service
   */
  async initialize() {
    try {
      // Load models if not already loaded
      if (!User) {
        const models = require('../models');
        User = models.User;
      }
      
      // Load logger if not already loaded
      if (!logger || logger === console) {
        try {
          logger = require('../utils/logger');
        } catch (error) {
          logger = console;
        }
      }
      
      this.initialized = true;
      if (logger.info) {
        logger.info('AuthService initialized successfully');
      } else {
        console.log('AuthService initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize AuthService:', error.message);
      // Don't throw error, just log it
    }
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload, expiresIn = this.jwtExpiresIn) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, username, firstName, lastName } = userData;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Validate password strength
      this.validatePasswordStrength(password);

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: false,
        isActive: true,
        loginAttempts: 0,
        metadata: {
          registeredAt: new Date(),
          registrationIP: userData.ip || 'unknown'
        }
      });

      // Generate tokens
      const accessToken = this.generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      });

      const refreshToken = this.generateRefreshToken();

      // Save refresh token
      await user.update({ refreshToken });

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials) {
    const { email, password, twoFactorCode } = credentials;

    try {
      // Find user by email or username
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: email.toLowerCase() },
            { username: email.toLowerCase() }
          ]
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
        throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid credentials');
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          throw new Error('Two-factor authentication code required');
        }

        const isValidCode = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });

        if (!isValidCode) {
          await this.handleFailedLogin(user);
          throw new Error('Invalid two-factor authentication code');
        }
      }

      // Reset login attempts on successful login
      await user.update({
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIP: credentials.ip || 'unknown'
      });

      // Generate tokens
      const accessToken = this.generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      });

      const refreshToken = this.generateRefreshToken();

      // Save refresh token
      await user.update({ refreshToken });

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Handle failed login attempts
   */
  async handleFailedLogin(user) {
    const loginAttempts = user.loginAttempts + 1;
    const updateData = { loginAttempts };

    // Lock account if max attempts reached
    if (loginAttempts >= this.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + this.lockoutTime);
      logger.warn(`Account locked due to failed login attempts: ${user.email}`);
    }

    await user.update(updateData);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const user = await User.findOne({ where: { refreshToken } });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
      const accessToken = this.generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      });

      const newRefreshToken = this.generateRefreshToken();

      // Update refresh token
      await user.update({ refreshToken: newRefreshToken });

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (user) {
        await user.update({ refreshToken: null });
        logger.info(`User logged out: ${user.email}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await user.update({
        password: hashedNewPassword,
        refreshToken: null // Invalidate all sessions
      });

      logger.info(`Password changed for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const secret = speakeasy.generateSecret({
        name: `Hostreamly (${user.email})`,
        issuer: 'Hostreamly'
      });

      await user.update({ twoFactorSecret: secret.base32 });

      return {
        secret: secret.base32,
        qrCode: secret.otpauth_url
      };
    } catch (error) {
      logger.error('2FA setup error:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(userId, token) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.twoFactorSecret) {
        throw new Error('Two-factor setup not found');
      }

      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValidToken) {
        throw new Error('Invalid verification code');
      }

      await user.update({ twoFactorEnabled: true });

      logger.info(`2FA enabled for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('2FA enable error:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(userId, password) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      await user.update({
        twoFactorEnabled: false,
        twoFactorSecret: null
      });

      logger.info(`2FA disabled for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('2FA disable error:', error);
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }

    return true;
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email) {
    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      
      if (!user) {
        throw new Error('User not found');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires
      });

      logger.info(`Password reset token generated for user: ${user.email}`);

      return { resetToken, user };
    } catch (error) {
      logger.error('Password reset token generation error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password and clear reset token
      await user.update({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null // Invalidate all sessions
      });

      logger.info(`Password reset successfully for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();