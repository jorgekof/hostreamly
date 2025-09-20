const compression = require('compression');
const structuredLogger = require('../utils/structuredLogger');

/**
 * Advanced compression middleware with intelligent filtering
 * Provides gzip/deflate compression with smart content-type detection
 */

/**
 * Compression configuration
 */
const COMPRESSION_CONFIG = {
  // Compression level (1-9, 6 is default)
  level: 6,
  
  // Minimum response size to compress (in bytes)
  threshold: 1024,
  
  // Memory level (1-9, 8 is default)
  memLevel: 8,
  
  // Window size (9-15, 15 is default)
  windowBits: 15,
  
  // Compression strategy
  strategy: compression.constants.Z_DEFAULT_STRATEGY
};

/**
 * Content types that should be compressed
 */
const COMPRESSIBLE_TYPES = [
  'text/html',
  'text/css',
  'text/javascript',
  'text/xml',
  'text/plain',
  'text/csv',
  'application/javascript',
  'application/json',
  'application/xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/x-javascript',
  'application/x-font-ttf',
  'application/vnd.ms-fontobject',
  'font/opentype',
  'image/svg+xml',
  'image/x-icon',
  'application/octet-stream' // For certain API responses
];

/**
 * Content types that should NOT be compressed
 * (already compressed or binary formats)
 */
const NON_COMPRESSIBLE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'application/zip',
  'application/gzip',
  'application/x-gzip',
  'application/x-compress',
  'application/x-compressed',
  'application/pdf'
];

/**
 * Routes that should always be compressed
 */
const FORCE_COMPRESS_ROUTES = [
  '/api/videos/search',
  '/api/videos',
  '/api/users',
  '/api/playlists',
  '/api/comments'
];

/**
 * Routes that should never be compressed
 */
const NO_COMPRESS_ROUTES = [
  '/api/videos/upload',
  '/api/videos/stream',
  '/api/health/metrics',
  '/api/backup/download'
];

/**
 * Custom filter function to determine if response should be compressed
 */
const shouldCompress = (req, res) => {
  const contentType = res.getHeader('content-type') || '';
  const contentLength = parseInt(res.getHeader('content-length') || '0', 10);
  const route = req.route?.path || req.path;
  
  // Never compress if explicitly disabled
  if (req.headers['x-no-compression'] === 'true') {
    return false;
  }
  
  // Never compress certain routes
  if (NO_COMPRESS_ROUTES.some(noCompressRoute => route.startsWith(noCompressRoute))) {
    return false;
  }
  
  // Always compress certain routes (API responses)
  if (FORCE_COMPRESS_ROUTES.some(forceRoute => route.startsWith(forceRoute))) {
    return true;
  }
  
  // Don't compress small responses
  if (contentLength > 0 && contentLength < COMPRESSION_CONFIG.threshold) {
    return false;
  }
  
  // Don't compress already compressed content
  if (NON_COMPRESSIBLE_TYPES.some(type => contentType.toLowerCase().includes(type))) {
    return false;
  }
  
  // Compress known compressible types
  if (COMPRESSIBLE_TYPES.some(type => contentType.toLowerCase().includes(type))) {
    return true;
  }
  
  // Default compression behavior
  return compression.filter(req, res);
};

/**
 * Enhanced compression middleware with monitoring
 */
const createCompressionMiddleware = () => {
  const compressionMiddleware = compression({
    filter: shouldCompress,
    level: COMPRESSION_CONFIG.level,
    threshold: COMPRESSION_CONFIG.threshold,
    memLevel: COMPRESSION_CONFIG.memLevel,
    windowBits: COMPRESSION_CONFIG.windowBits,
    strategy: COMPRESSION_CONFIG.strategy,
    
    // Custom compression function with monitoring
    flush: compression.constants.Z_SYNC_FLUSH
  });
  
  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override res.send to track compression stats
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const originalSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data || '', 'utf8');
      const contentEncoding = res.getHeader('content-encoding');
      const isCompressed = contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('deflate'));
      
      // Log compression stats for monitoring
      if (originalSize > COMPRESSION_CONFIG.threshold) {
        const compressionRatio = isCompressed ? 
          (originalSize - parseInt(res.getHeader('content-length') || originalSize, 10)) / originalSize : 0;
        
        structuredLogger.performance('Response compression stats', {
          event: 'response_compression',
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          originalSize,
          compressedSize: parseInt(res.getHeader('content-length') || originalSize, 10),
          compressionRatio: Math.round(compressionRatio * 100),
          isCompressed,
          contentType: res.getHeader('content-type'),
          responseTime,
          userAgent: req.get('User-Agent')
        });
      }
      
      return originalSend.call(this, data);
    };
    
    // Override res.json to track JSON compression
    res.json = function(obj) {
      const responseTime = Date.now() - startTime;
      const jsonString = JSON.stringify(obj);
      const originalSize = Buffer.byteLength(jsonString, 'utf8');
      
      // Set content type for JSON responses
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'application/json; charset=utf-8');
      }
      
      // Log large JSON responses
      if (originalSize > COMPRESSION_CONFIG.threshold) {
        structuredLogger.performance('Large JSON response', {
          event: 'large_json_response',
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          jsonSize: originalSize,
          responseTime,
          objectKeys: Object.keys(obj || {}).length
        });
      }
      
      return originalJson.call(this, obj);
    };
    
    // Apply compression middleware
    compressionMiddleware(req, res, next);
  };
};

/**
 * Middleware to add compression-related headers
 */
const addCompressionHeaders = (req, res, next) => {
  // Add Vary header for proper caching
  res.setHeader('Vary', 'Accept-Encoding');
  
  // Add cache control for compressed responses
  if (req.method === 'GET' && !res.getHeader('cache-control')) {
    const route = req.route?.path || req.path;
    
    if (route.startsWith('/api/')) {
      // API responses - short cache
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    } else if (route.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
      // Static assets - long cache
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
  
  next();
};

/**
 * Middleware to handle content encoding preferences
 */
const handleEncodingPreferences = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Prefer Brotli if supported (for future enhancement)
  if (acceptEncoding.includes('br')) {
    req.preferredEncoding = 'br';
  } else if (acceptEncoding.includes('gzip')) {
    req.preferredEncoding = 'gzip';
  } else if (acceptEncoding.includes('deflate')) {
    req.preferredEncoding = 'deflate';
  } else {
    req.preferredEncoding = 'identity';
  }
  
  next();
};

/**
 * Response size monitoring middleware
 */
const monitorResponseSize = (req, res, next) => {
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const responseSize = parseInt(res.getHeader('content-length') || '0', 10);
    
    // Log large responses for optimization opportunities
    if (responseSize > 1024 * 1024) { // 1MB
      structuredLogger.performance('Large response detected', {
        event: 'large_response',
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        responseSize,
        contentType: res.getHeader('content-type'),
        isCompressed: !!(res.getHeader('content-encoding')),
        userAgent: req.get('User-Agent')
      });
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Get compression statistics
 */
const getCompressionStats = () => {
  return {
    config: COMPRESSION_CONFIG,
    compressibleTypes: COMPRESSIBLE_TYPES.length,
    nonCompressibleTypes: NON_COMPRESSIBLE_TYPES.length,
    forceCompressRoutes: FORCE_COMPRESS_ROUTES.length,
    noCompressRoutes: NO_COMPRESS_ROUTES.length
  };
};

module.exports = {
  createCompressionMiddleware,
  addCompressionHeaders,
  handleEncodingPreferences,
  monitorResponseSize,
  shouldCompress,
  getCompressionStats,
  COMPRESSION_CONFIG,
  COMPRESSIBLE_TYPES,
  NON_COMPRESSIBLE_TYPES
};