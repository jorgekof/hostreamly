const { validationResult } = require('express-validator');
const xss = require('xss');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Middleware para manejar errores de validación de express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors', {
      errors: errors.array(),
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      message: 'The provided data is invalid',
      details: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Middleware para validar parámetros UUID
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: `${paramName} must be a valid UUID`,
        field: paramName,
        value
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar que el cuerpo de la petición no esté vacío
 */
const requireBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Request body is required'
    });
  }
  next();
};

/**
 * Middleware para sanitizar strings de entrada
 */
const sanitizeStrings = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };
  
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  
  next();
};

/**
 * Sanitización de HTML/XSS
 */
const sanitizeHtml = (field, options = {}) => {
  const { body } = require('express-validator');
  
  return body(field)
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return xss(value, {
          whiteList: options.allowedTags || {}, // No permitir ningún tag HTML por defecto
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style'],
          css: false, // Desactivar CSS inline
          ...options.xssOptions
        });
      }
      return value;
    });
};

/**
 * Validación de URLs seguras
 */
const validateSecureUrl = (field, options = {}) => {
  const { body } = require('express-validator');
  
  return body(field)
    .isURL({
      protocols: options.allowHttp ? ['http', 'https'] : ['https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    })
    .custom(async (url) => {
      try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        
        // Verificar que no sea una IP privada
        if (validator.isIP(hostname)) {
          const isPrivate = validator.isIP(hostname, 4) && 
            (hostname.startsWith('192.168.') || 
             hostname.startsWith('10.') || 
             hostname.startsWith('172.16.') ||
             hostname.startsWith('172.17.') ||
             hostname.startsWith('172.18.') ||
             hostname.startsWith('172.19.') ||
             hostname.startsWith('172.2') ||
             hostname.startsWith('172.30') ||
             hostname.startsWith('172.31.') ||
             hostname === '127.0.0.1' ||
             hostname === 'localhost');
          
          if (isPrivate && !options.allowPrivate) {
            throw new Error('Private IP addresses are not allowed');
          }
        }
        
        // Verificar dominios bloqueados
        const blockedDomains = options.blockedDomains || [];
        if (blockedDomains.some(domain => hostname.includes(domain))) {
          throw new Error('Domain is not allowed');
        }
        
        return true;
      } catch (error) {
        throw new Error(`Invalid URL: ${error.message}`);
      }
    });
};

/**
 * Validación de archivos de video mejorada
 */
const validateVideoFile = (options = {}) => {
  const allowedMimes = options.allowedMimes || [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo', // AVI
    'video/x-ms-wmv',  // WMV
    'video/webm',
    'video/ogg'
  ];
  
  const allowedExtensions = options.allowedExtensions || [
    '.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.wmv', '.webm', '.ogg'
  ];
  
  return (req, file, cb) => {
    try {
      // Verificar MIME type
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid video format. Allowed: ${allowedMimes.join(', ')}`));
      }
      
      // Verificar extensión del archivo
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return cb(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`));
      }
      
      // Verificar nombre del archivo
      const filename = path.basename(file.originalname, fileExtension);
      if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return cb(new Error('Filename contains invalid characters'));
      }
      
      cb(null, true);
    } catch (error) {
      logger.warn('File upload validation failed', {
        filename: file.originalname,
        mimetype: file.mimetype,
        error: error.message
      });
      cb(error);
    }
  };
};

/**
 * Rate limiting inteligente por usuario/IP
 */
const createSmartRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos por defecto
    max: options.max || 100,
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usar ID de usuario si está autenticado, sino IP
      const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
      return `${options.prefix || 'rate_limit'}:${key}`;
    },
    skip: (req) => {
      // Permitir más requests para usuarios premium si está configurado
      if (options.skipPremium && req.user?.is_premium) {
        return true;
      }
      
      // Skip para admins si está configurado
      if (options.skipAdmin && req.user?.role === 'admin') {
        return true;
      }
      
      return false;
    },
    onLimitReached: (req, res, options) => {
      logger.warn('Rate limit exceeded', {
        userId: req.user?.id,
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: options.max,
        windowMs: options.windowMs
      });
    }
  });
};

/**
 * Validación de CSS personalizado
 */
const validateCustomCSS = (field, options = {}) => {
  const { body } = require('express-validator');
  
  return body(field)
    .optional()
    .isLength({ max: options.maxLength || 50000 })
    .withMessage(`CSS must not exceed ${options.maxLength || 50000} characters`)
    .custom((css) => {
      // Verificar propiedades peligrosas
      const dangerousPatterns = [
        /javascript:/i,
        /expression\s*\(/i,
        /behavior\s*:/i,
        /@import/i,
        /url\s*\(\s*["']?data:/i, // Data URLs pueden ser peligrosas
        /-moz-binding/i,
        /vbscript:/i
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(css)) {
          throw new Error('CSS contains potentially dangerous content');
        }
      }
      
      return true;
    });
};

/**
 * Validación de tags mejorada
 */
const validateTags = (field, options = {}) => {
  const { body } = require('express-validator');
  
  const maxTags = options.maxTags || 10;
  const maxTagLength = options.maxTagLength || 50;
  
  return body(field)
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (!Array.isArray(tags)) {
        throw new Error('Tags must be an array');
      }
      
      if (tags.length > maxTags) {
        throw new Error(`Maximum ${maxTags} tags allowed`);
      }
      
      for (const tag of tags) {
        if (typeof tag !== 'string') {
          throw new Error('Each tag must be a string');
        }
        
        if (tag.length === 0 || tag.length > maxTagLength) {
          throw new Error(`Each tag must be between 1 and ${maxTagLength} characters`);
        }
        
        // Verificar caracteres válidos
        if (!/^[a-zA-Z0-9\s._-]+$/.test(tag)) {
          throw new Error('Tags can only contain letters, numbers, spaces, dots, underscores, and hyphens');
        }
      }
      
      // Verificar duplicados (case insensitive)
      const lowerTags = tags.map(tag => tag.toLowerCase());
      const uniqueTags = [...new Set(lowerTags)];
      if (uniqueTags.length !== tags.length) {
        throw new Error('Duplicate tags are not allowed');
      }
      
      return true;
    });
};

module.exports = {
  handleValidationErrors,
  validationHandler: handleValidationErrors, // Alias for consistency
  validateUUID,
  requireBody,
  sanitizeStrings,
  sanitizeHtml,
  validateSecureUrl,
  validateVideoFile,
  createSmartRateLimit,
  validateCustomCSS,
  validateTags
};