const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };
    
    // Add request context if available
    if (meta.req) {
      logEntry.request = {
        method: meta.req.method,
        url: meta.req.url,
        ip: meta.req.ip,
        userAgent: meta.req.get('User-Agent'),
        userId: meta.req.user?.id,
        sessionId: meta.req.sessionID
      };
      delete logEntry.req;
    }
    
    // Add response context if available
    if (meta.res) {
      logEntry.response = {
        statusCode: meta.res.statusCode,
        responseTime: meta.responseTime
      };
      delete logEntry.res;
      delete logEntry.responseTime;
    }
    
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}] ${message}`;
    
    // Add important metadata
    if (meta.userId) logMessage += ` | User: ${meta.userId}`;
    if (meta.ip) logMessage += ` | IP: ${meta.ip}`;
    if (meta.method && meta.url) logMessage += ` | ${meta.method} ${meta.url}`;
    if (meta.statusCode) logMessage += ` | Status: ${meta.statusCode}`;
    if (meta.responseTime) logMessage += ` | ${meta.responseTime}ms`;
    if (meta.error) logMessage += ` | Error: ${meta.error}`;
    
    return logMessage;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'hostreamly-api',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs - separate file for errors only
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
      handleExceptions: true,
      handleRejections: true
    }),
    
    // Combined logs - all levels
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Access logs - HTTP requests
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '50m',
      maxFiles: '7d',
      zippedArchive: true
    }),
    
    // Security logs - authentication, authorization, suspicious activity
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxSize: '10m',
      maxFiles: '90d',
      zippedArchive: true,
      format: winston.format.combine(
        structuredFormat,
        winston.format((info) => {
          // Only log security-related events
          const securityEvents = [
            'login', 'logout', 'failed_login', 'password_reset',
            'account_locked', 'suspicious_activity', 'rate_limit_exceeded',
            'unauthorized_access', 'token_expired', 'invalid_token'
          ];
          
          return securityEvents.some(event => 
            info.message.toLowerCase().includes(event) ||
            info.event?.toLowerCase().includes(event)
          ) ? info : false;
        })()
      )
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Custom logging methods for different contexts
class StructuredLogger {
  constructor(logger) {
    this.logger = logger;
  }
  
  // HTTP request logging
  logRequest(req, res, responseTime) {
    this.logger.http('HTTP Request', {
      req,
      res,
      responseTime,
      event: 'http_request'
    });
  }
  
  // Authentication events
  logAuth(event, userId, details = {}) {
    this.logger.info(`Authentication: ${event}`, {
      event: `auth_${event}`,
      userId,
      ...details
    });
  }
  
  // Security events
  logSecurity(event, details = {}) {
    this.logger.warn(`Security: ${event}`, {
      event: `security_${event}`,
      ...details
    });
  }
  
  // Database operations
  logDatabase(operation, table, details = {}) {
    this.logger.info(`Database: ${operation} on ${table}`, {
      event: 'database_operation',
      operation,
      table,
      ...details
    });
  }
  
  // Video processing events
  logVideoProcessing(event, videoId, details = {}) {
    this.logger.info(`Video Processing: ${event}`, {
      event: 'video_processing',
      videoId,
      processingEvent: event,
      ...details
    });
  }
  
  // Payment events
  logPayment(event, userId, amount, details = {}) {
    this.logger.info(`Payment: ${event}`, {
      event: 'payment',
      userId,
      amount,
      paymentEvent: event,
      ...details
    });
  }
  
  // API rate limiting
  logRateLimit(ip, endpoint, details = {}) {
    this.logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      ...details
    });
  }
  
  // Performance monitoring
  logPerformance(operation, duration, details = {}) {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    
    this.logger[level](`Performance: ${operation}`, {
      event: 'performance',
      operation,
      duration,
      slow: duration > 1000,
      ...details
    });
  }
  
  // Error logging with context
  logError(error, context = {}) {
    this.logger.error(error.message || 'Unknown error', {
      event: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      ...context
    });
  }
  
  // Business logic events
  logBusiness(event, details = {}) {
    this.logger.info(`Business: ${event}`, {
      event: 'business_logic',
      businessEvent: event,
      ...details
    });
  }
  
  // System health events
  logHealth(component, status, details = {}) {
    const level = status === 'healthy' ? 'info' : 'warn';
    
    this.logger[level](`Health Check: ${component} is ${status}`, {
      event: 'health_check',
      component,
      status,
      ...details
    });
  }
  
  // Proxy standard winston methods
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
  
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }
  
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }
  
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }
  
  // Create child logger with additional context
  child(defaultMeta) {
    const childLogger = this.logger.child(defaultMeta);
    return new StructuredLogger(childLogger);
  }
  
  // Get log statistics
  async getLogStats() {
    const stats = {
      logFiles: [],
      totalSize: 0,
      oldestLog: null,
      newestLog: null
    };
    
    try {
      const files = fs.readdirSync(logsDir);
      
      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stat = fs.statSync(filePath);
        
        stats.logFiles.push({
          name: file,
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime
        });
        
        stats.totalSize += stat.size;
        
        if (!stats.oldestLog || stat.birthtime < stats.oldestLog) {
          stats.oldestLog = stat.birthtime;
        }
        
        if (!stats.newestLog || stat.mtime > stats.newestLog) {
          stats.newestLog = stat.mtime;
        }
      }
      
      stats.logFiles.sort((a, b) => b.modified - a.modified);
      
    } catch (error) {
      this.logError(error, { context: 'getLogStats' });
    }
    
    return stats;
  }
}

// Create and export structured logger instance
const structuredLogger = new StructuredLogger(logger);

// Log startup
structuredLogger.info('Structured logger initialized', {
  event: 'logger_initialized',
  logsDirectory: logsDir,
  logLevel: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development'
});

module.exports = structuredLogger;