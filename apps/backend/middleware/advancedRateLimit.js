const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const geoip = require('geoip-lite');

// Advanced rate limiting with Redis store
class AdvancedRateLimiter {
  constructor() {
    this.store = new RedisStore({
      sendCommand: (...args) => cache.call(...args),
    });
  }

  // Create adaptive rate limiter based on user tier
  createAdaptiveLimit(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      standardHeaders: true,
      legacyHeaders: false,
      store: this.store,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        if (req.user) {
          return `user:${req.user.id}`;
        }
        return `ip:${this.getClientIP(req)}`;
      },
      max: (req) => {
        // Adaptive limits based on user tier
        if (req.user) {
          switch (req.user.role) {
            case 'enterprise':
              return options.enterpriseLimit || 5000;
            case 'premium':
              return options.premiumLimit || 1000;
            case 'basic':
              return options.basicLimit || 200;
            default:
              return options.freeLimit || 100;
          }
        }
        return options.anonymousLimit || 50;
      },
      message: (req) => {
        const userType = req.user ? req.user.role : 'anonymous';
        return {
          error: 'Rate limit exceeded',
          message: `Too many requests for ${userType} users. Please upgrade your plan or try again later.`,
          type: 'RATE_LIMIT_ERROR',
          userType,
          upgradeUrl: req.user ? '/dashboard/billing' : '/pricing'
        };
      },
      onLimitReached: (req, res, options) => {
        const userInfo = req.user ? {
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : { anonymous: true };

        logger.security('Rate limit exceeded', {
          ...userInfo,
          ip: this.getClientIP(req),
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          country: this.getCountry(req),
          timestamp: new Date().toISOString()
        });
      },
      skip: (req) => {
        // Skip rate limiting for whitelisted IPs
        const ip = this.getClientIP(req);
        const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
        return whitelistedIPs.includes(ip);
      }
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  // Create endpoint-specific rate limiter
  createEndpointLimit(endpoint, options = {}) {
    const endpointConfigs = {
      // Authentication endpoints - very strict
      'auth': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: 'Too many authentication attempts. Please try again later.',
        skipSuccessfulRequests: true
      },
      
      // Password reset - strict
      'password-reset': {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3,
        message: 'Too many password reset attempts. Please try again later.'
      },
      
      // Video upload - moderate
      'upload': {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: (req) => req.user?.role === 'premium' ? 100 : 20,
        message: 'Upload limit exceeded. Consider upgrading your plan.'
      },
      
      // Video streaming - lenient
      'stream': {
        windowMs: 60 * 1000, // 1 minute
        max: 200,
        message: 'Streaming rate limit exceeded. Please try again shortly.'
      },
      
      // Analytics - moderate
      'analytics': {
        windowMs: 60 * 1000, // 1 minute
        max: 60,
        message: 'Analytics rate limit exceeded.'
      },
      
      // Live streaming - strict for creation
      'live-stream': {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: (req) => {
          if (req.method === 'POST') return 5; // Stream creation
          return 100; // Stream access
        },
        message: 'Live streaming limit exceeded.'
      },
      
      // DRM token generation - moderate
      'drm': {
        windowMs: 60 * 1000, // 1 minute
        max: 50,
        message: 'DRM token generation limit exceeded.'
      },
      
      // Webhooks - very lenient
      'webhook': {
        windowMs: 60 * 1000, // 1 minute
        max: 1000,
        message: 'Webhook rate limit exceeded.'
      }
    };

    const config = endpointConfigs[endpoint] || {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Rate limit exceeded.'
    };

    return this.createAdaptiveLimit({ ...config, ...options });
  }

  // Create suspicious activity detector
  createSuspiciousActivityLimit() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 1000, // Very high limit for normal users
      store: this.store,
      keyGenerator: (req) => `suspicious:${this.getClientIP(req)}`,
      skip: (req) => {
        // Check for suspicious patterns
        return !this.isSuspiciousRequest(req);
      },
      max: 10, // Very low limit for suspicious requests
      message: {
        error: 'Suspicious activity detected',
        message: 'Your request has been flagged for review. Please contact support if you believe this is an error.',
        type: 'SECURITY_BLOCK'
      },
      onLimitReached: (req, res, options) => {
        logger.security('Suspicious activity rate limit triggered', {
          ip: this.getClientIP(req),
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          suspiciousReasons: this.getSuspiciousReasons(req),
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Create progressive rate limiter (increases restrictions on repeated violations)
  createProgressiveLimit(options = {}) {
    return async (req, res, next) => {
      const ip = this.getClientIP(req);
      const violationKey = `violations:${ip}`;
      
      try {
        const violations = await cache.get(violationKey) || 0;
        const multiplier = Math.min(Math.pow(2, violations), 16); // Max 16x penalty
        
        const baseLimit = options.baseLimit || 100;
        const adjustedLimit = Math.max(1, Math.floor(baseLimit / multiplier));
        
        const limiter = rateLimit({
          windowMs: options.windowMs || 15 * 60 * 1000,
          max: adjustedLimit,
          store: this.store,
          keyGenerator: () => `progressive:${ip}`,
          message: {
            error: 'Progressive rate limit exceeded',
            message: `Rate limit reduced due to ${violations} previous violations. Current limit: ${adjustedLimit} requests.`,
            violations,
            baseLimit,
            adjustedLimit
          },
          onLimitReached: async (req, res, options) => {
            // Increment violation count
            await cache.setex(violationKey, 24 * 60 * 60, violations + 1); // 24 hour expiry
            
            logger.security('Progressive rate limit violation', {
              ip,
              violations: violations + 1,
              adjustedLimit,
              endpoint: req.originalUrl
            });
          }
        });
        
        limiter(req, res, next);
      } catch (error) {
        logger.error('Progressive rate limiter error:', error);
        next(); // Continue without rate limiting on error
      }
    };
  }

  // Utility methods
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.headers['cf-connecting-ip'] ||
           'unknown';
  }

  getCountry(req) {
    const ip = this.getClientIP(req);
    const geo = geoip.lookup(ip);
    return geo ? geo.country : 'Unknown';
  }

  isSuspiciousRequest(req) {
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    // Check for bot patterns
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /requests/i,
      /postman/i, /insomnia/i
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }
    
    // Check for missing or very short user agent
    if (!userAgent || userAgent.length < 10) {
      return true;
    }
    
    // Check for suspicious request patterns
    const path = req.path.toLowerCase();
    const suspiciousPaths = [
      '/admin', '/.env', '/config', '/backup',
      '/wp-admin', '/phpmyadmin', '/mysql'
    ];
    
    if (suspiciousPaths.some(suspicious => path.includes(suspicious))) {
      return true;
    }
    
    // Check for rapid sequential requests to different endpoints
    // This would require additional tracking logic
    
    return false;
  }

  getSuspiciousReasons(req) {
    const reasons = [];
    const userAgent = req.get('User-Agent') || '';
    
    if (!userAgent) reasons.push('Missing User-Agent');
    if (userAgent.length < 10) reasons.push('Short User-Agent');
    if (/bot|crawler|spider|scraper/i.test(userAgent)) reasons.push('Bot-like User-Agent');
    if (/curl|wget|python|requests/i.test(userAgent)) reasons.push('Automated tool detected');
    
    const path = req.path.toLowerCase();
    if (path.includes('admin')) reasons.push('Admin path access');
    if (path.includes('.env')) reasons.push('Config file access attempt');
    
    return reasons;
  }

  // Create comprehensive rate limiting middleware
  createComprehensiveLimit() {
    return [
      this.createSuspiciousActivityLimit(),
      this.createProgressiveLimit(),
      this.createAdaptiveLimit()
    ];
  }
}

// Export singleton instance
const advancedRateLimiter = new AdvancedRateLimiter();

// Pre-configured limiters for common use cases
const rateLimiters = {
  // General API
  general: advancedRateLimiter.createAdaptiveLimit({
    windowMs: 15 * 60 * 1000,
    freeLimit: 100,
    basicLimit: 200,
    premiumLimit: 1000,
    enterpriseLimit: 5000
  }),
  
  // Authentication
  auth: advancedRateLimiter.createEndpointLimit('auth'),
  
  // Password reset
  passwordReset: advancedRateLimiter.createEndpointLimit('password-reset'),
  
  // Upload
  upload: advancedRateLimiter.createEndpointLimit('upload'),
  
  // Streaming
  stream: advancedRateLimiter.createEndpointLimit('stream'),
  
  // Analytics
  analytics: advancedRateLimiter.createEndpointLimit('analytics'),
  
  // Live streaming
  liveStream: advancedRateLimiter.createEndpointLimit('live-stream'),
  
  // DRM
  drm: advancedRateLimiter.createEndpointLimit('drm'),
  
  // Webhooks
  webhook: advancedRateLimiter.createEndpointLimit('webhook'),
  
  // Comprehensive (includes suspicious activity detection)
  comprehensive: advancedRateLimiter.createComprehensiveLimit(),
  
  // Progressive (increases restrictions on violations)
  progressive: advancedRateLimiter.createProgressiveLimit()
};

module.exports = {
  AdvancedRateLimiter,
  advancedRateLimiter,
  rateLimiters
};