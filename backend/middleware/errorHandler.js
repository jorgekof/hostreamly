const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message, statusCode = 502) {
    super(`${service} service error: ${message}`, statusCode);
    this.service = service;
    this.name = 'ExternalServiceError';
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Log error details
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  };
  
  // Log based on error type
  if (error.isOperational) {
    logger.warn('Operational Error', errorDetails);
  } else {
    logger.error('System Error', errorDetails);
  }
  
  // Handle specific error types
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    error = new ValidationError('Validation failed', errors);
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    error = new ConflictError(`${field} already exists`);
  }
  
  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = new ValidationError('Invalid reference to related resource');
  }
  
  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    error = new AppError('Database connection failed', 503, false);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }
  
  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('File size too large');
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new ValidationError('Too many files');
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ValidationError('Unexpected file field');
  }
  
  // Express validator errors
  if (err.type === 'entity.parse.failed') {
    error = new ValidationError('Invalid JSON format');
  }
  
  // Redis connection errors
  if (err.code === 'ECONNREFUSED' && err.port === 6379) {
    error = new AppError('Cache service unavailable', 503, false);
  }
  
  // File system errors
  if (err.code === 'ENOENT') {
    error = new NotFoundError('File not found');
  }
  
  if (err.code === 'EACCES') {
    error = new AppError('File access denied', 500, false);
  }
  
  // Network errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
    error = new ExternalServiceError('External', 'Network connection failed');
  }
  
  // Bunny.net API errors
  if (err.response?.config?.baseURL?.includes('bunnycdn.com')) {
    const status = err.response?.status || 502;
    const message = err.response?.data?.message || 'Bunny.net API error';
    error = new ExternalServiceError('Bunny.net', message, status);
  }
  
  // Agora API errors
  if (err.response?.config?.baseURL?.includes('agora.io')) {
    const status = err.response?.status || 502;
    const message = err.response?.data?.message || 'Agora API error';
    error = new ExternalServiceError('Agora', message, status);
  }
  
  // Default to 500 server error
  if (!error.statusCode) {
    error = new AppError('Internal server error', 500, false);
  }
  
  // Prepare error response
  const response = {
    error: error.status || 'error',
    message: error.message
  };
  
  // Add additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.errors || undefined;
  }
  
  // Add validation errors if present
  if (error.errors && Array.isArray(error.errors)) {
    response.errors = error.errors;
  }
  
  // Add service information for external service errors
  if (error.service) {
    response.service = error.service;
  }
  
  // Security logging for authentication/authorization errors
  if (error.statusCode === 401 || error.statusCode === 403) {
    logger.security('Access attempt denied', {
      error: error.message,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }
  
  // Send error response
  res.status(error.statusCode || 500).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise: promise.toString()
  });
  
  // Close server gracefully
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  
  // Close server gracefully
  process.exit(1);
});

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError
};