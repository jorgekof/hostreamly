const winston = require('winston');
const path = require('path');
const fs = require('fs');
const monitoringService = require('../services/monitoringService');
const onFinished = require('on-finished');
const onHeaders = require('on-headers');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'hostreamly-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Access logs
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 7,
      tailable: true
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  }));
}

// Structured logger wrapper
const structuredLogger = {
  debug: (message, meta = {}) => logger.debug(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  
  logAuth: (event, userId, meta = {}) => {
    logger.info(`Auth: ${event}`, {
      category: 'auth',
      event,
      userId,
      ...meta
    });
  },
  
  logSecurity: (event, meta = {}) => {
    logger.warn(`Security: ${event}`, {
      category: 'security',
      event,
      ...meta
    });
  },
  
  logBusiness: (event, meta = {}) => {
    logger.info(`Business: ${event}`, {
      category: 'business',
      event,
      ...meta
    });
  },
  
  logPayment: (event, userId, amount, meta = {}) => {
    logger.info(`Payment: ${event}`, {
      category: 'payment',
      event,
      userId,
      amount,
      ...meta
    });
  },
  
  logPerformance: (operation, duration, meta = {}) => {
    logger.info(`Performance: ${operation}`, {
      category: 'performance',
      operation,
      duration,
      ...meta
    });
  },
  
  logRateLimit: (ip, url, meta = {}) => {
    logger.warn('Rate limit exceeded', {
      category: 'rate_limit',
      ip,
      url,
      ...meta
    });
  }
};

/**
 * HTTP request logging middleware
 * Logs all HTTP requests with structured format
 */
const httpLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Skip logging for health checks and static assets
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
  const skipExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
  
  const shouldSkip = skipPaths.some(path => req.url.startsWith(path)) ||
                    skipExtensions.some(ext => req.url.endsWith(ext));
  
  if (shouldSkip) {
    return next();
  }
  
  // Add request ID for tracing
  req.requestId = req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Request-ID', req.requestId);
  
  // Log request start
  structuredLogger.debug('Request started', {
    event: 'request_start',
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    sessionId: req.sessionID,
    contentLength: req.get('Content-Length'),
    contentType: req.get('Content-Type')
  });
  
  // Send metrics to monitoring service
  if (monitoringService) {
    monitoringService.incrementCounter('http_requests_total', {
      method: req.method,
      route: req.route?.path || req.url
    });
  }
  
  // Log when response headers are sent
  onHeaders(res, () => {
    const responseTime = Date.now() - startTime;
    res.responseTime = responseTime;
  });
  
  // Log when response is finished
  onFinished(res, (err, res) => {
    const responseTime = Date.now() - startTime;
    
    const logData = {
      event: 'request_complete',
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.sessionID,
      contentLength: res.get('Content-Length'),
      error: err ? {
        name: err.name,
        message: err.message
      } : undefined
    };
    
    // Determine log level based on status code and response time
    let logLevel = 'info';
    if (res.statusCode >= 500) {
      logLevel = 'error';
    } else if (res.statusCode >= 400) {
      logLevel = 'warn';
    } else if (responseTime > 5000) {
      logLevel = 'warn';
    }
    
    structuredLogger[logLevel]('Request completed', logData);
    
    // Send metrics to monitoring service
    if (monitoringService) {
      monitoringService.recordHistogram('http_request_duration_ms', responseTime, {
        method: req.method,
        status_code: res.statusCode.toString(),
        route: req.route?.path || req.url
      });
      
      monitoringService.incrementCounter('http_responses_total', {
        method: req.method,
        status_code: res.statusCode.toString(),
        route: req.route?.path || req.url
      });
    }
    
    // Log slow requests separately
    if (responseTime > 1000) {
      structuredLogger.logPerformance('slow_request', responseTime, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
      
      // Send slow request alert
      if (monitoringService && responseTime > 5000) {
        monitoringService.incrementCounter('slow_requests_total', {
          method: req.method,
          route: req.route?.path || req.url
        });
      }
    }
  });
  
  next();
};

/**
 * Error logging middleware
 * Logs all errors with full context
 */
const errorLogger = (err, req, res, next) => {
  const errorData = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    sessionId: req.sessionID,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params
  };
  
  // Log different error types appropriately
  if (err.status >= 400 && err.status < 500) {
    // Client errors (4xx)
    structuredLogger.warn(`Client Error: ${err.message}`, {
      event: 'client_error',
      error: {
        name: err.name,
        message: err.message,
        status: err.status,
        code: err.code
      },
      ...errorData
    });
  } else {
    // Server errors (5xx) and other errors
    structuredLogger.error(`Server Error: ${err.message}`, {
      event: 'server_error',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        status: err.status,
        code: err.code
      },
      ...errorData
    });
  }
  
  next(err);
};

/**
 * Authentication logging middleware
 * Logs authentication events
 */
const authLogger = (event) => {
  return (req, res, next) => {
    const authData = {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      userId: req.user?.id,
      email: req.user?.email || req.body?.email
    };
    
    switch (event) {
      case 'login_attempt':
        structuredLogger.logAuth('login_attempt', req.body?.email, {
          ...authData,
          loginMethod: req.body?.loginMethod || 'email'
        });
        break;
        
      case 'login_success':
        structuredLogger.logAuth('login_success', req.user?.id, {
          ...authData,
          loginMethod: req.body?.loginMethod || 'email'
        });
        break;
        
      case 'login_failed':
        structuredLogger.logSecurity('login_failed', {
          ...authData,
          reason: req.authFailureReason || 'invalid_credentials',
          email: req.body?.email
        });
        break;
        
      case 'logout':
        structuredLogger.logAuth('logout', req.user?.id, authData);
        break;
        
      case 'token_refresh':
        structuredLogger.logAuth('token_refresh', req.user?.id, authData);
        break;
        
      case 'password_reset_request':
        structuredLogger.logAuth('password_reset_request', req.body?.email, {
          ...authData,
          email: req.body?.email
        });
        break;
        
      case 'password_reset_complete':
        structuredLogger.logAuth('password_reset_complete', req.user?.id, authData);
        break;
        
      case 'account_locked':
        structuredLogger.logSecurity('account_locked', {
          ...authData,
          email: req.body?.email,
          reason: 'too_many_failed_attempts'
        });
        break;
    }
    
    next();
  };
};

/**
 * Rate limiting logging middleware
 * Logs rate limit violations
 */
const rateLimitLogger = (req, res, next) => {
  // This will be called when rate limit is exceeded
  if (res.statusCode === 429) {
    structuredLogger.logRateLimit(req.ip, req.url, {
      requestId: req.requestId,
      method: req.method,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      rateLimitType: req.rateLimitType || 'unknown',
      remainingPoints: req.rateLimitRemaining || 0,
      resetTime: req.rateLimitReset
    });
  }
  
  next();
};

/**
 * Security event logging middleware
 * Logs suspicious activities
 */
const securityLogger = {
  suspiciousActivity: (req, activity, details = {}) => {
    structuredLogger.logSecurity('suspicious_activity', {
      requestId: req.requestId,
      activity,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.url,
      method: req.method,
      ...details
    });
  },
  
  unauthorizedAccess: (req, resource, details = {}) => {
    structuredLogger.logSecurity('unauthorized_access', {
      requestId: req.requestId,
      resource,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.url,
      method: req.method,
      ...details
    });
  },
  
  invalidToken: (req, tokenType, details = {}) => {
    structuredLogger.logSecurity('invalid_token', {
      requestId: req.requestId,
      tokenType,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      ...details
    });
  }
};

/**
 * Business logic logging middleware
 * Logs important business events
 */
const businessLogger = {
  videoUpload: (req, videoData) => {
    structuredLogger.logBusiness('video_upload', {
      requestId: req.requestId,
      userId: req.user?.id,
      videoId: videoData.id,
      title: videoData.title,
      fileSize: videoData.fileSize,
      duration: videoData.duration,
      format: videoData.format
    });
  },
  
  videoView: (req, videoData) => {
    structuredLogger.logBusiness('video_view', {
      requestId: req.requestId,
      userId: req.user?.id,
      videoId: videoData.id,
      title: videoData.title,
      ownerId: videoData.user_id,
      viewCount: videoData.view_count
    });
  },
  
  subscriptionChange: (req, subscriptionData) => {
    structuredLogger.logBusiness('subscription_change', {
      requestId: req.requestId,
      userId: req.user?.id,
      subscriptionId: subscriptionData.id,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      amount: subscriptionData.amount
    });
  },
  
  paymentProcessed: (req, paymentData) => {
    structuredLogger.logPayment('payment_processed', req.user?.id, paymentData.amount, {
      requestId: req.requestId,
      paymentId: paymentData.id,
      method: paymentData.method,
      currency: paymentData.currency,
      status: paymentData.status
    });
  }
};

/**
 * Performance monitoring middleware
 * Logs performance metrics
 */
const performanceLogger = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      structuredLogger.logPerformance(operation, duration, {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    });
    
    next();
  };
};

module.exports = {
  httpLogger,
  errorLogger,
  authLogger,
  rateLimitLogger,
  securityLogger,
  businessLogger,
  performanceLogger,
  logger,
  structuredLogger
};