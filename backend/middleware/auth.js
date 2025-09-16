const jwt = require('jsonwebtoken');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const User = require('../models/User');

// JWT Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token is required'
      });
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      logger.security('Blacklisted token used', {
        token: token.substring(0, 20) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has been revoked'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists in cache first
    let user = await cache.get(`user:${decoded.id}`);
    
    if (!user) {
      // If not in cache, fetch from database
      user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User not found'
        });
      }
      
      // Cache user for 15 minutes
      await cache.set(`user:${decoded.id}`, user, 900);
    }
    
    // Check if user is active
    if (!user.is_active) {
      logger.security('Inactive user attempted access', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }
    
    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has expired'
      });
    }
    
    // Add user and token info to request
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    
    // Log successful authentication
    logger.audit('user_authenticated', user.id, 'auth', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    next();
    
  } catch (error) {
    logger.security('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has expired'
      });
    }
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from cache or database
    let user = await cache.get(`user:${decoded.id}`);
    
    if (!user) {
      user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.is_active) {
        await cache.set(`user:${decoded.id}`, user, 900);
      }
    }
    
    if (user && user.is_active) {
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;
    }
    
    next();
    
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }
    
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.security('Insufficient permissions', {
        userId: req.user.id,
        userRoles,
        requiredRoles,
        endpoint: req.originalUrl,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin', 'super_admin']);

// Premium user middleware
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required'
    });
  }
  
  if (!req.user.is_premium && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Premium required',
      message: 'This feature requires a premium subscription'
    });
  }
  
  next();
};

// Rate limiting by user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const key = `rate_limit:user:${req.user.id}`;
    const current = await cache.incr(key);
    
    if (current === 1) {
      await cache.expire(key, Math.floor(windowMs / 1000));
    }
    
    if (current > maxRequests) {
      logger.security('User rate limit exceeded', {
        userId: req.user.id,
        requests: current,
        limit: maxRequests,
        ip: req.ip
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later'
      });
    }
    
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
      'X-RateLimit-Reset': new Date(Date.now() + windowMs)
    });
    
    next();
  };
};

// Token blacklist function
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await cache.set(`blacklist:${token}`, true, ttl);
      }
    }
  } catch (error) {
    logger.error('Error blacklisting token:', error);
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  requireAdmin,
  requirePremium,
  userRateLimit,
  blacklistToken
};