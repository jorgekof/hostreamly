/**
 * Custom error classes for the application
 * These provide structured error handling with consistent status codes and messages
 */

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - 400 Bad Request
 * Used for input validation failures, malformed data, etc.
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication error - 401 Unauthorized
 * Used when authentication is required but missing or invalid
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization error - 403 Forbidden
 * Used when user is authenticated but lacks permission for the resource
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not found error - 404 Not Found
 * Used when requested resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict error - 409 Conflict
 * Used when request conflicts with current state (e.g., duplicate resources)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Rate limit error - 429 Too Many Requests
 * Used when rate limiting is triggered
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Service unavailable error - 503 Service Unavailable
 * Used when external services are down or system is under maintenance
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', retryAfter = 300) {
    super(message, 503);
    this.retryAfter = retryAfter;
  }
}

/**
 * External service error - 502 Bad Gateway
 * Used when external API calls fail
 */
class ExternalServiceError extends AppError {
  constructor(service, message, statusCode = 502) {
    super(`${service} service error: ${message}`, statusCode);
    this.service = service;
  }
}

/**
 * Payment error - 402 Payment Required
 * Used for payment-related failures
 */
class PaymentError extends AppError {
  constructor(message = 'Payment required', paymentCode = null) {
    super(message, 402);
    this.paymentCode = paymentCode;
  }
}

/**
 * File processing error - 422 Unprocessable Entity
 * Used when file uploads or processing fails
 */
class FileProcessingError extends AppError {
  constructor(message = 'File processing failed', fileType = null) {
    super(message, 422);
    this.fileType = fileType;
  }
}

/**
 * Database error - 500 Internal Server Error
 * Used for database operation failures
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', operation = null) {
    super(message, 500, false);
    this.operation = operation;
  }
}

/**
 * Cache error - 500 Internal Server Error
 * Used for Redis/cache operation failures
 */
class CacheError extends AppError {
  constructor(message = 'Cache operation failed', operation = null) {
    super(message, 500, false);
    this.operation = operation;
  }
}

/**
 * Network error - 500 Internal Server Error
 * Used for network-related failures
 */
class NetworkError extends AppError {
  constructor(message = 'Network operation failed', code = null) {
    super(message, 500, false);
    this.code = code;
  }
}

/**
 * Video processing error - 422 Unprocessable Entity
 * Used specifically for video upload/processing failures
 */
class VideoProcessingError extends FileProcessingError {
  constructor(message = 'Video processing failed', stage = null) {
    super(message, 'video');
    this.stage = stage; // upload, encoding, thumbnail, etc.
  }
}

/**
 * Subscription error - 402 Payment Required
 * Used for subscription-related issues
 */
class SubscriptionError extends PaymentError {
  constructor(message = 'Subscription required', subscriptionType = null) {
    super(message);
    this.subscriptionType = subscriptionType;
  }
}

/**
 * Quota exceeded error - 429 Too Many Requests
 * Used when user exceeds their quota limits
 */
class QuotaExceededError extends RateLimitError {
  constructor(message = 'Quota exceeded', quotaType = null, resetTime = null) {
    super(message);
    this.quotaType = quotaType; // upload, storage, bandwidth, etc.
    this.resetTime = resetTime;
  }
}

/**
 * Maintenance error - 503 Service Unavailable
 * Used when system is under maintenance
 */
class MaintenanceError extends ServiceUnavailableError {
  constructor(message = 'System under maintenance', estimatedDuration = null) {
    super(message);
    this.estimatedDuration = estimatedDuration;
  }
}

/**
 * Security error - 403 Forbidden
 * Used for security-related violations
 */
class SecurityError extends AuthorizationError {
  constructor(message = 'Security violation detected', violationType = null) {
    super(message);
    this.violationType = violationType; // suspicious_activity, blocked_ip, etc.
  }
}

/**
 * Helper function to create appropriate error based on HTTP status code
 */
const createErrorFromStatus = (statusCode, message, details = {}) => {
  switch (statusCode) {
    case 400:
      return new ValidationError(message, details.errors);
    case 401:
      return new AuthenticationError(message);
    case 402:
      return new PaymentError(message, details.paymentCode);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 422:
      return new FileProcessingError(message, details.fileType);
    case 429:
      return new RateLimitError(message, details.retryAfter);
    case 502:
      return new ExternalServiceError(details.service || 'External', message);
    case 503:
      return new ServiceUnavailableError(message, details.retryAfter);
    default:
      return new AppError(message, statusCode);
  }
};

/**
 * Helper function to check if error is operational (safe to expose to client)
 */
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Helper function to get error category for logging/monitoring
 */
const getErrorCategory = (error) => {
  if (error instanceof ValidationError) return 'validation';
  if (error instanceof AuthenticationError) return 'authentication';
  if (error instanceof AuthorizationError) return 'authorization';
  if (error instanceof NotFoundError) return 'not_found';
  if (error instanceof ConflictError) return 'conflict';
  if (error instanceof RateLimitError) return 'rate_limit';
  if (error instanceof PaymentError) return 'payment';
  if (error instanceof FileProcessingError) return 'file_processing';
  if (error instanceof ExternalServiceError) return 'external_service';
  if (error instanceof DatabaseError) return 'database';
  if (error instanceof CacheError) return 'cache';
  if (error instanceof NetworkError) return 'network';
  if (error instanceof ServiceUnavailableError) return 'service_unavailable';
  return 'system';
};

module.exports = {
  // Base error
  AppError,
  
  // Client errors (4xx)
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  FileProcessingError,
  
  // Server errors (5xx)
  ServiceUnavailableError,
  ExternalServiceError,
  DatabaseError,
  CacheError,
  NetworkError,
  
  // Specialized errors
  VideoProcessingError,
  SubscriptionError,
  QuotaExceededError,
  MaintenanceError,
  SecurityError,
  
  // Helper functions
  createErrorFromStatus,
  isOperationalError,
  getErrorCategory
};