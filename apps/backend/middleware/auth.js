const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authService = require('../services/authService');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

/**
 * Enhanced Authentication Middleware
 */
class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Verify JWT token and authenticate user
   */
  authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token required'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = authService.verifyToken(token);
      
      // Get user from database
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refreshToken', 'twoFactorSecret'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked'
        });
      }

      // Attach user to request
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      
      if (error.message === 'Invalid or expired token') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  };

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without authentication
      }

      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refreshToken', 'twoFactorSecret'] }
      });

      if (user && user.isActive && (!user.lockedUntil || user.lockedUntil <= new Date())) {
        req.user = user;
        req.token = token;
      }
      
      next();
    } catch (error) {
      // Continue without authentication on error
      next();
    }
  };

  /**
   * Require specific role(s)
   */
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  };

  /**
   * Require admin role
   */
  requireAdmin = this.requireRole(['admin', 'super_admin']);

  /**
   * Require user to own the resource or be admin
   */
  requireOwnershipOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      const isOwner = req.user.id.toString() === resourceUserId?.toString();
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      next();
    };
  };

  /**
   * Require email verification
   */
  requireEmailVerification = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required'
      });
    }

    next();
  };

  /**
   * Rate limiting for authentication endpoints
   */
  authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for successful requests
      return req.rateLimit?.remaining > 0;
    }
  });

  /**
   * Strict rate limiting for login attempts
   */
  loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 login attempts per windowMs
    message: {
      success: false,
      message: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  });

  /**
   * Password reset rate limiting
   */
  passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: {
      success: false,
      message: 'Too many password reset attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  /**
   * API key authentication
   */
  authenticateApiKey = async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key required'
        });
      }

      // Here you would validate the API key against your database
      // For now, we'll use a simple check
      const validApiKey = process.env.API_KEY;
      
      if (apiKey !== validApiKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }

      // Set a flag to indicate API key authentication
      req.apiKeyAuth = true;
      
      next();
    } catch (error) {
      logger.error('API key authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  };

  /**
   * Webhook authentication
   */
  authenticateWebhook = (secretHeader = 'x-webhook-secret') => {
    return (req, res, next) => {
      try {
        const providedSecret = req.headers[secretHeader.toLowerCase()];
        const expectedSecret = process.env.WEBHOOK_SECRET;
        
        if (!providedSecret || !expectedSecret) {
          return res.status(401).json({
            success: false,
            message: 'Webhook authentication failed'
          });
        }

        if (providedSecret !== expectedSecret) {
          return res.status(401).json({
            success: false,
            message: 'Invalid webhook secret'
          });
        }

        req.webhookAuth = true;
        next();
      } catch (error) {
        logger.error('Webhook authentication error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    };
  };

  /**
   * CORS preflight handler
   */
  handleCors = (req, res, next) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://159.65.98.112',
      'https://159.65.98.112',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  };
}

const authMiddleware = new AuthMiddleware();

// Export individual methods for backward compatibility
module.exports = {
  authMiddleware: authMiddleware.authenticate,
  optionalAuth: authMiddleware.optionalAuth,
  requireRole: authMiddleware.requireRole,
  requireAdmin: authMiddleware.requireAdmin,
  requireOwnershipOrAdmin: authMiddleware.requireOwnershipOrAdmin,
  requireEmailVerification: authMiddleware.requireEmailVerification,
  authRateLimit: authMiddleware.authRateLimit,
  loginRateLimit: authMiddleware.loginRateLimit,
  passwordResetRateLimit: authMiddleware.passwordResetRateLimit,
  authenticateApiKey: authMiddleware.authenticateApiKey,
  authenticateWebhook: authMiddleware.authenticateWebhook,
  handleCors: authMiddleware.handleCors,
  AuthMiddleware
};