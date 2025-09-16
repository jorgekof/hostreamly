const structuredLogger = require('../utils/structuredLogger');
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError, ServiceUnavailableError } = require('../utils/errors');

/**
 * Standard error codes and messages
 */
const ERROR_CODES = {
  // Authentication & Authorization (1000-1999)
  INVALID_CREDENTIALS: { code: 1001, message: 'Invalid email or password' },
  TOKEN_EXPIRED: { code: 1002, message: 'Authentication token has expired' },
  TOKEN_INVALID: { code: 1003, message: 'Invalid authentication token' },
  TOKEN_MISSING: { code: 1004, message: 'Authentication token is required' },
  INSUFFICIENT_PERMISSIONS: { code: 1005, message: 'Insufficient permissions to access this resource' },
  ACCOUNT_LOCKED: { code: 1006, message: 'Account has been temporarily locked due to multiple failed login attempts' },
  ACCOUNT_DISABLED: { code: 1007, message: 'Account has been disabled' },
  EMAIL_NOT_VERIFIED: { code: 1008, message: 'Email address must be verified before accessing this resource' },
  PASSWORD_RESET_REQUIRED: { code: 1009, message: 'Password reset is required' },
  TWO_FACTOR_REQUIRED: { code: 1010, message: 'Two-factor authentication is required' },
  
  // Validation Errors (2000-2999)
  VALIDATION_FAILED: { code: 2001, message: 'Request validation failed' },
  INVALID_EMAIL: { code: 2002, message: 'Invalid email address format' },
  INVALID_PASSWORD: { code: 2003, message: 'Password does not meet security requirements' },
  INVALID_FILE_TYPE: { code: 2004, message: 'Invalid file type' },
  FILE_TOO_LARGE: { code: 2005, message: 'File size exceeds maximum limit' },
  INVALID_VIDEO_FORMAT: { code: 2006, message: 'Invalid video format' },
  INVALID_IMAGE_FORMAT: { code: 2007, message: 'Invalid image format' },
  MISSING_REQUIRED_FIELD: { code: 2008, message: 'Required field is missing' },
  INVALID_FIELD_VALUE: { code: 2009, message: 'Invalid field value' },
  INVALID_DATE_FORMAT: { code: 2010, message: 'Invalid date format' },
  
  // Resource Errors (3000-3999)
  RESOURCE_NOT_FOUND: { code: 3001, message: 'Requested resource not found' },
  USER_NOT_FOUND: { code: 3002, message: 'User not found' },
  VIDEO_NOT_FOUND: { code: 3003, message: 'Video not found' },
  PLAYLIST_NOT_FOUND: { code: 3004, message: 'Playlist not found' },
  COMMENT_NOT_FOUND: { code: 3005, message: 'Comment not found' },
  SUBSCRIPTION_NOT_FOUND: { code: 3006, message: 'Subscription not found' },
  PAYMENT_NOT_FOUND: { code: 3007, message: 'Payment not found' },
  
  // Conflict Errors (4000-4999)
  RESOURCE_ALREADY_EXISTS: { code: 4001, message: 'Resource already exists' },
  EMAIL_ALREADY_EXISTS: { code: 4002, message: 'Email address is already registered' },
  USERNAME_ALREADY_EXISTS: { code: 4003, message: 'Username is already taken' },
  VIDEO_ALREADY_PROCESSING: { code: 4004, message: 'Video is already being processed' },
  SUBSCRIPTION_ALREADY_ACTIVE: { code: 4005, message: 'Subscription is already active' },
  DUPLICATE_OPERATION: { code: 4006, message: 'Duplicate operation detected' },
  
  // Rate Limiting (5000-5999)
  RATE_LIMIT_EXCEEDED: { code: 5001, message: 'Rate limit exceeded. Please try again later' },
  TOO_MANY_REQUESTS: { code: 5002, message: 'Too many requests from this IP address' },
  UPLOAD_LIMIT_EXCEEDED: { code: 5003, message: 'Upload limit exceeded for this time period' },
  API_QUOTA_EXCEEDED: { code: 5004, message: 'API quota exceeded' },
  
  // Payment & Billing (6000-6999)
  PAYMENT_FAILED: { code: 6001, message: 'Payment processing failed' },
  INSUFFICIENT_FUNDS: { code: 6002, message: 'Insufficient funds' },
  PAYMENT_METHOD_INVALID: { code: 6003, message: 'Invalid payment method' },
  SUBSCRIPTION_EXPIRED: { code: 6004, message: 'Subscription has expired' },
  BILLING_ADDRESS_REQUIRED: { code: 6005, message: 'Billing address is required' },
  PAYMENT_DECLINED: { code: 6006, message: 'Payment was declined' },
  
  // Video Processing (7000-7999)
  VIDEO_PROCESSING_FAILED: { code: 7001, message: 'Video processing failed' },
  VIDEO_UPLOAD_FAILED: { code: 7002, message: 'Video upload failed' },
  VIDEO_ENCODING_FAILED: { code: 7003, message: 'Video encoding failed' },
  THUMBNAIL_GENERATION_FAILED: { code: 7004, message: 'Thumbnail generation failed' },
  VIDEO_TOO_LONG: { code: 7005, message: 'Video duration exceeds maximum limit' },
  VIDEO_CORRUPTED: { code: 7006, message: 'Video file is corrupted' },
  
  // External Service Errors (8000-8999)
  CDN_SERVICE_ERROR: { code: 8001, message: 'CDN service is temporarily unavailable' },
  EMAIL_SERVICE_ERROR: { code: 8002, message: 'Email service is temporarily unavailable' },
  PAYMENT_SERVICE_ERROR: { code: 8003, message: 'Payment service is temporarily unavailable' },
  STORAGE_SERVICE_ERROR: { code: 8004, message: 'Storage service is temporarily unavailable' },
  THIRD_PARTY_API_ERROR: { code: 8005, message: 'Third-party service is temporarily unavailable' },
  
  // System Errors (9000-9999)
  INTERNAL_SERVER_ERROR: { code: 9001, message: 'An internal server error occurred' },
  DATABASE_ERROR: { code: 9002, message: 'Database operation failed' },
  CACHE_ERROR: { code: 9003, message: 'Cache operation failed' },
  FILE_SYSTEM_ERROR: { code: 9004, message: 'File system operation failed' },
  NETWORK_ERROR: { code: 9005, message: 'Network operation failed' },
  SERVICE_UNAVAILABLE: { code: 9006, message: 'Service is temporarily unavailable' },
  MAINTENANCE_MODE: { code: 9007, message: 'Service is under maintenance' }
};

/**
 * Map error types to standard error codes
 */
const getErrorCode = (error) => {
  // Check for custom error code first
  if (error.errorCode && ERROR_CODES[error.errorCode]) {
    return ERROR_CODES[error.errorCode];
  }
  
  // Map by error type
  if (error instanceof ValidationError) {
    if (error.message.toLowerCase().includes('email')) {
      return ERROR_CODES.INVALID_EMAIL;
    }
    if (error.message.toLowerCase().includes('password')) {
      return ERROR_CODES.INVALID_PASSWORD;
    }
    return ERROR_CODES.VALIDATION_FAILED;
  }
  
  if (error instanceof AuthenticationError) {
    if (error.message.toLowerCase().includes('expired')) {
      return ERROR_CODES.TOKEN_EXPIRED;
    }
    if (error.message.toLowerCase().includes('invalid')) {
      return ERROR_CODES.TOKEN_INVALID;
    }
    return ERROR_CODES.INVALID_CREDENTIALS;
  }
  
  if (error instanceof AuthorizationError) {
    return ERROR_CODES.INSUFFICIENT_PERMISSIONS;
  }
  
  if (error instanceof NotFoundError) {
    if (error.message.toLowerCase().includes('user')) {
      return ERROR_CODES.USER_NOT_FOUND;
    }
    if (error.message.toLowerCase().includes('video')) {
      return ERROR_CODES.VIDEO_NOT_FOUND;
    }
    return ERROR_CODES.RESOURCE_NOT_FOUND;
  }
  
  if (error instanceof ConflictError) {
    if (error.message.toLowerCase().includes('email')) {
      return ERROR_CODES.EMAIL_ALREADY_EXISTS;
    }
    if (error.message.toLowerCase().includes('username')) {
      return ERROR_CODES.USERNAME_ALREADY_EXISTS;
    }
    return ERROR_CODES.RESOURCE_ALREADY_EXISTS;
  }
  
  if (error instanceof RateLimitError) {
    return ERROR_CODES.RATE_LIMIT_EXCEEDED;
  }
  
  if (error instanceof ServiceUnavailableError) {
    return ERROR_CODES.SERVICE_UNAVAILABLE;
  }
  
  // Database errors
  if (error.name === 'SequelizeValidationError') {
    return ERROR_CODES.VALIDATION_FAILED;
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return ERROR_CODES.RESOURCE_ALREADY_EXISTS;
  }
  
  if (error.name === 'SequelizeDatabaseError') {
    return ERROR_CODES.DATABASE_ERROR;
  }
  
  // Default to internal server error
  return ERROR_CODES.INTERNAL_SERVER_ERROR;
};

/**
 * Get HTTP status code from error
 */
const getHttpStatus = (error) => {
  if (error.status) return error.status;
  if (error.statusCode) return error.statusCode;
  
  if (error instanceof ValidationError) return 400;
  if (error instanceof AuthenticationError) return 401;
  if (error instanceof AuthorizationError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof RateLimitError) return 429;
  if (error instanceof ServiceUnavailableError) return 503;
  
  // Database errors
  if (error.name === 'SequelizeValidationError') return 400;
  if (error.name === 'SequelizeUniqueConstraintError') return 409;
  if (error.name === 'SequelizeDatabaseError') return 500;
  
  return 500;
};

/**
 * Format validation errors
 */
const formatValidationErrors = (error) => {
  const errors = [];
  
  if (error.name === 'SequelizeValidationError') {
    error.errors.forEach(err => {
      errors.push({
        field: err.path,
        message: err.message,
        value: err.value
      });
    });
  } else if (error.errors && Array.isArray(error.errors)) {
    errors.push(...error.errors);
  } else if (error.details) {
    errors.push(...error.details);
  }
  
  return errors;
};

/**
 * Main error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  const errorCode = getErrorCode(error);
  const httpStatus = getHttpStatus(error);
  const validationErrors = formatValidationErrors(error);
  
  // Create error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode.code,
      message: errorCode.message,
      type: error.constructor.name || 'Error',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  };
  
  // Add validation errors if present
  if (validationErrors.length > 0) {
    errorResponse.error.validation = validationErrors;
  }
  
  // Add additional context for development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.originalMessage = error.message;
  }
  
  // Log error with appropriate level
  const logLevel = httpStatus >= 500 ? 'error' : 'warn';
  const logData = {
    event: 'error_handled',
    requestId: req.requestId,
    errorCode: errorCode.code,
    httpStatus,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  };
  
  if (logLevel === 'error') {
    structuredLogger.error(`Error ${errorCode.code}: ${errorCode.message}`, logData);
  } else {
    structuredLogger.warn(`Warning ${errorCode.code}: ${errorCode.message}`, logData);
  }
  
  // Send error response
  res.status(httpStatus).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`);
  error.errorCode = 'RESOURCE_NOT_FOUND';
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler for express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationError = new ValidationError('Request validation failed');
    validationError.errors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    }));
    validationError.errorCode = 'VALIDATION_FAILED';
    
    return next(validationError);
  }
  
  next();
};

/**
 * Rate limit error handler
 */
const rateLimitErrorHandler = (req, res, next) => {
  const error = new RateLimitError('Rate limit exceeded');
  error.errorCode = 'RATE_LIMIT_EXCEEDED';
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': req.rateLimit?.limit || 'unknown',
    'X-RateLimit-Remaining': req.rateLimit?.remaining || 0,
    'X-RateLimit-Reset': req.rateLimit?.reset || Date.now() + 60000,
    'Retry-After': Math.ceil((req.rateLimit?.reset || Date.now() + 60000 - Date.now()) / 1000)
  });
  
  next(error);
};

/**
 * Database connection error handler
 */
const databaseErrorHandler = (error, req, res, next) => {
  if (error.name && error.name.startsWith('Sequelize')) {
    // Log database error
    structuredLogger.error('Database error occurred', {
      event: 'database_error',
      requestId: req.requestId,
      error: {
        name: error.name,
        message: error.message,
        sql: error.sql
      }
    });
    
    // Don't expose SQL details in production
    if (process.env.NODE_ENV === 'production') {
      delete error.sql;
    }
  }
  
  next(error);
};

/**
 * Unhandled promise rejection handler
 */
process.on('unhandledRejection', (reason, promise) => {
  structuredLogger.error('Unhandled Promise Rejection', {
    event: 'unhandled_rejection',
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  
  // Graceful shutdown
  process.exit(1);
});

/**
 * Uncaught exception handler
 */
process.on('uncaughtException', (error) => {
  structuredLogger.error('Uncaught Exception', {
    event: 'uncaught_exception',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
  
  // Graceful shutdown
  process.exit(1);
});

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleValidationErrors,
  rateLimitErrorHandler,
  databaseErrorHandler,
  ERROR_CODES
};