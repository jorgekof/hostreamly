const { body, param, query, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');
const logger = require('../utils/logger');

// Advanced input validation and sanitization middleware
class InputValidator {
  constructor() {
    this.commonPatterns = {
      // Security patterns to block
      sqlInjection: /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      xss: /<script[^>]*>.*?<\/script>/gi,
      pathTraversal: /(\.\.\/|\.\.\\/)/g,
      commandInjection: /(\||&|;|\$|`|>|<)/g,
      ldapInjection: /(\(|\)|\*|\\|\||&)/g
    };
    
    this.suspiciousKeywords = [
      'script', 'javascript', 'vbscript', 'onload', 'onerror',
      'eval', 'expression', 'alert', 'confirm', 'prompt',
      'document.cookie', 'window.location', 'innerHTML',
      'union', 'select', 'insert', 'update', 'delete', 'drop',
      'exec', 'execute', 'sp_', 'xp_', 'cmd', 'powershell'
    ];
  }

  // Comprehensive input sanitization
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Basic HTML sanitization
    if (options.allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: options.allowedAttributes || []
      });
    } else {
      // Strip all HTML
      sanitized = validator.stripLow(sanitized);
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize whitespace
    if (options.normalizeWhitespace !== false) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  }

  // Check for malicious patterns
  detectMaliciousInput(input) {
    if (typeof input !== 'string') {
      return { isMalicious: false, reasons: [] };
    }

    const reasons = [];
    const lowerInput = input.toLowerCase();

    // Check for SQL injection patterns
    if (this.commonPatterns.sqlInjection.test(input)) {
      reasons.push('SQL injection pattern detected');
    }

    // Check for XSS patterns
    if (this.commonPatterns.xss.test(input)) {
      reasons.push('XSS pattern detected');
    }

    // Check for path traversal
    if (this.commonPatterns.pathTraversal.test(input)) {
      reasons.push('Path traversal pattern detected');
    }

    // Check for command injection
    if (this.commonPatterns.commandInjection.test(input)) {
      reasons.push('Command injection pattern detected');
    }

    // Check for suspicious keywords
    for (const keyword of this.suspiciousKeywords) {
      if (lowerInput.includes(keyword)) {
        reasons.push(`Suspicious keyword detected: ${keyword}`);
        break; // Only report first match to avoid spam
      }
    }

    // Check for excessive length (potential DoS)
    if (input.length > 10000) {
      reasons.push('Input length exceeds maximum allowed');
    }

    // Check for unusual character patterns
    const nonAsciiCount = (input.match(/[^\x00-\x7F]/g) || []).length;
    if (nonAsciiCount > input.length * 0.5) {
      reasons.push('High percentage of non-ASCII characters');
    }

    return {
      isMalicious: reasons.length > 0,
      reasons,
      riskScore: Math.min(reasons.length * 25, 100)
    };
  }

  // Create validation middleware
  createValidationMiddleware(validations) {
    return [
      ...validations,
      this.handleValidationErrors.bind(this),
      this.sanitizeAndValidateInput.bind(this)
    ];
  }

  // Handle validation errors
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }));

      logger.security('Input validation failed', {
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        errors: errorDetails,
        timestamp: new Date().toISOString()
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data provided',
        details: errorDetails,
        type: 'VALIDATION_ERROR'
      });
    }

    next();
  }

  // Sanitize and validate all input
  sanitizeAndValidateInput(req, res, next) {
    try {
      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body, { allowHtml: false });
        const bodyValidation = this.validateObject(req.body);
        if (bodyValidation.hasMaliciousInput) {
          return this.handleMaliciousInput(req, res, 'body', bodyValidation);
        }
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = this.sanitizeObject(req.query, { allowHtml: false });
        const queryValidation = this.validateObject(req.query);
        if (queryValidation.hasMaliciousInput) {
          return this.handleMaliciousInput(req, res, 'query', queryValidation);
        }
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = this.sanitizeObject(req.params, { allowHtml: false });
        const paramsValidation = this.validateObject(req.params);
        if (paramsValidation.hasMaliciousInput) {
          return this.handleMaliciousInput(req, res, 'params', paramsValidation);
        }
      }

      next();
    } catch (error) {
      logger.error('Input sanitization error:', error);
      next(); // Continue without sanitization on error
    }
  }

  // Sanitize object recursively
  sanitizeObject(obj, options = {}) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeInput(key, options);
        sanitized[sanitizedKey] = this.sanitizeObject(value, options);
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      return this.sanitizeInput(obj, options);
    }

    return obj;
  }

  // Validate object for malicious content
  validateObject(obj, path = '') {
    const results = {
      hasMaliciousInput: false,
      maliciousFields: [],
      totalRiskScore: 0
    };

    if (obj === null || obj === undefined) {
      return results;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemResults = this.validateObject(item, `${path}[${index}]`);
        if (itemResults.hasMaliciousInput) {
          results.hasMaliciousInput = true;
          results.maliciousFields.push(...itemResults.maliciousFields);
          results.totalRiskScore += itemResults.totalRiskScore;
        }
      });
      return results;
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check key for malicious content
        const keyValidation = this.detectMaliciousInput(key);
        if (keyValidation.isMalicious) {
          results.hasMaliciousInput = true;
          results.maliciousFields.push({
            field: `${currentPath}[key]`,
            reasons: keyValidation.reasons,
            riskScore: keyValidation.riskScore
          });
          results.totalRiskScore += keyValidation.riskScore;
        }

        // Check value recursively
        const valueResults = this.validateObject(value, currentPath);
        if (valueResults.hasMaliciousInput) {
          results.hasMaliciousInput = true;
          results.maliciousFields.push(...valueResults.maliciousFields);
          results.totalRiskScore += valueResults.totalRiskScore;
        }
      }
      return results;
    }

    if (typeof obj === 'string') {
      const validation = this.detectMaliciousInput(obj);
      if (validation.isMalicious) {
        results.hasMaliciousInput = true;
        results.maliciousFields.push({
          field: path,
          reasons: validation.reasons,
          riskScore: validation.riskScore
        });
        results.totalRiskScore += validation.riskScore;
      }
    }

    return results;
  }

  // Handle malicious input detection
  handleMaliciousInput(req, res, location, validation) {
    logger.security('Malicious input detected', {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      location,
      maliciousFields: validation.maliciousFields,
      totalRiskScore: validation.totalRiskScore,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: 'Security Violation',
      message: 'Malicious input detected in request',
      type: 'SECURITY_ERROR',
      riskScore: validation.totalRiskScore
    });
  }
}

// Common validation rules
const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email address is too long'),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'i')
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  // Username validation
  username: body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  // Name validation
  name: (field) => body(field)
    .isLength({ min: 1, max: 50 })
    .withMessage(`${field} must be between 1 and 50 characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${field} can only contain letters, spaces, apostrophes, and hyphens`),

  // UUID validation
  uuid: (field) => param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`),

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Page must be a positive integer between 1 and 10000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // File upload validation
  fileUpload: [
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed')
  ],

  // Search validation
  search: query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
    .withMessage('Search query contains invalid characters')
};

// Export singleton instance and utilities
const inputValidator = new InputValidator();

module.exports = {
  InputValidator,
  inputValidator,
  commonValidations,
  // Convenience methods
  validate: (validations) => inputValidator.createValidationMiddleware(validations),
  sanitize: (options) => inputValidator.sanitizeAndValidateInput.bind(inputValidator)
};