const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Import configurations
const { connectDB, sequelize } = require('./config/database');
const { connectRedis, redisStore } = require('./config/redis');
const logger = require('./utils/logger');

// Import middleware
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { authMiddleware: auth } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const enhancedVideoRoutes = require('./routes/enhancedVideoRoutes');
const livestreamRoutes = require('./routes/livestreams');
const storageRoutes = require('./routes/storage');
const systemConfigRoutes = require('./routes/systemConfig');
const webhooksRoutes = require('./routes/webhooks');
const webhookHandlerRoutes = require('./routes/webhookHandler');
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');
const analyticsRoutes = require('./routes/analytics');
const downloadRoutes = require('./routes/downloads');
const contactRoutes = require('./routes/contact');
const whiteLabelRoutes = require('./routes/whiteLabel');
const enterpriseRoutes = require('./routes/enterprise');
const embedRoutes = require('./routes/embed');
const apiKeyRoutes = require('./routes/apiKeys');
const usageRoutes = require('./routes/usage');
const setupSwagger = require('./middleware/swagger');

// Import services
const bunnyService = require('./services/BunnyService');
const enhancedBunnyService = require('./services/EnhancedBunnyService');
const analyticsService = require('./services/AnalyticsService');
const agoraService = require('./services/AgoraService');

// Import webhook middleware
const { captureRawBody, authenticateWebhook } = require('./middleware/bunnyWebhookAuth');

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.agora.io'],
      connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
      mediaSrc: ["'self'", 'https:', 'blob:'],
      frameSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://hostreamly.com',
      'https://www.hostreamly.com',
      'https://app.hostreamly.com'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024
}));

// Capture raw body for webhook signature verification
app.use(captureRawBody);

// Body parsing middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// HTTP request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  },
  skip: (req, res) => {
    // Skip logging for health checks and static assets
    return req.url === '/health' || req.url.startsWith('/static/');
  }
}));

// Session configuration
app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'hostreamly-session-secret',
  resave: false,
  saveUninitialized: false,
  name: 'hostreamly.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  rolling: true
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url === '/health';
  }
});

app.use(globalLimiter);

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('request_completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
    
    // Log slow requests
    if (duration > 5000) {
      logger.performance('slow_request', {
        requestId: req.id,
        method: req.method,
        url: req.url,
        duration,
        userId: req.user?.id
      });
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', asyncHandler(async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
      bunny: 'unknown',
      agora: 'unknown'
    }
  };
  
  try {
    // Check database connection
    await sequelize.authenticate();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Check Redis connection
    const { redis } = require('./config/redis');
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Check Bunny.net API
    await bunnyService.getLibraries();
    health.services.bunny = 'healthy';
  } catch (error) {
    health.services.bunny = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Agora doesn't have a simple health check, so we'll assume it's healthy
  // if the service can be imported without errors
  try {
    health.services.agora = 'healthy';
  } catch (error) {
    health.services.agora = 'unhealthy';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/enhanced-videos', enhancedVideoRoutes);
app.use('/api/livestreams', livestreamRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/system-config', systemConfigRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/webhook-handler', webhookHandlerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/multi-library', require('./routes/multiLibraryRoutes'));
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/usage', usageRoutes);

// Embed and sharing routes (public routes)
app.use('/api/embed', embedRoutes);
app.use('/embed', embedRoutes);
app.use('/watch', embedRoutes);

// Setup Swagger documentation
setupSwagger(app);

// Enhanced Bunny Stream webhook endpoint with authentication
app.post('/webhooks/bunny/enhanced', 
  express.raw({ type: 'application/json' }),
  ...authenticateWebhook,
  asyncHandler(async (req, res) => {
    try {
      const event = JSON.parse(req.body.toString());
      logger.info('Enhanced Bunny webhook received', { event });
      
      // Process webhook event with enhanced service
      switch (event.EventType || event.status) {
        case 'VideoUploaded':
        case 'uploaded':
          await enhancedBunnyService.handleUploadCompletion(
            event.VideoId || event.videoId,
            event.UserId || event.userId,
            event
          );
          break;
        case 'VideoEncoded':
        case 'ready':
          await enhancedBunnyService.handleVideoReady(
            event.VideoId || event.videoId,
            event
          );
          break;
        case 'VideoDeleted':
        case 'deleted':
          await enhancedBunnyService.handleVideoDeleted(
            event.VideoId || event.videoId
          );
          break;
        case 'failed':
          await enhancedBunnyService.handleUploadFailed(
            event.VideoId || event.videoId,
            event.error || 'Upload failed'
          );
          break;
        default:
          logger.warn('Unknown enhanced webhook event', { 
            eventType: event.EventType || event.status 
          });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Enhanced webhook processing failed', { 
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  })
);

// Legacy Bunny webhook endpoint (keep for backward compatibility)
app.post('/webhooks/bunny', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  try {
    const signature = req.headers['bunny-signature'];
    const payload = req.body;
    
    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.BUNNY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      logger.security('webhook_signature_invalid', {
        source: 'bunny',
        signature,
        expectedSignature
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = JSON.parse(payload.toString());
    logger.bunny('webhook_received', 'info', { event });
    
    // Process webhook event
    switch (event.EventType) {
      case 'VideoUploaded':
        // Handle video upload completion
        await bunnyService.handleVideoUploadedWebhook(event);
        break;
      case 'VideoEncoded':
        // Handle video encoding completion
        await bunnyService.handleVideoEncodedWebhook(event);
        break;
      case 'VideoDeleted':
        // Handle video deletion
        await bunnyService.handleVideoDeletedWebhook(event);
        break;
      default:
        logger.bunny('webhook_unknown_event', 'warning', { eventType: event.EventType });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.bunny('webhook_error', 'error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

app.post('/webhooks/agora', express.json(), asyncHandler(async (req, res) => {
  try {
    const event = req.body;
    logger.agora('webhook_received', 'info', { event });
    
    // Process Agora webhook event
    await agoraService.handleWebhook(event);
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.agora('webhook_error', 'error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '1d',
  etag: true,
  lastModified: true
}));

// API documentation (in development)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/docs', (req, res) => {
    res.json({
      message: 'Hostreamly API Documentation',
      version: '1.0.0',
      endpoints: {
        auth: {
          'POST /api/auth/register': 'Register new user',
          'POST /api/auth/login': 'Login user',
          'POST /api/auth/refresh': 'Refresh access token',
          'POST /api/auth/logout': 'Logout user',
          'POST /api/auth/forgot-password': 'Request password reset',
          'POST /api/auth/reset-password': 'Reset password',
          'GET /api/auth/profile': 'Get user profile',
          'PUT /api/auth/profile': 'Update user profile'
        },
        videos: {
          'GET /api/videos': 'Get videos with filtering',
          'POST /api/videos': 'Upload new video',
          'GET /api/videos/popular': 'Get popular videos',
          'GET /api/videos/search': 'Search videos',
          'GET /api/videos/:id': 'Get video by ID',
          'PUT /api/videos/:id': 'Update video',
          'DELETE /api/videos/:id': 'Delete video',
          'POST /api/videos/:id/like': 'Like/unlike video',
          'GET /api/videos/:id/analytics': 'Get video analytics'
        },
        livestreams: {
          'GET /api/livestreams': 'Get live streams',
          'POST /api/livestreams': 'Create new stream',
          'GET /api/livestreams/popular': 'Get popular streams',
          'GET /api/livestreams/search': 'Search streams',
          'GET /api/livestreams/:id': 'Get stream by ID',
          'POST /api/livestreams/:id/join': 'Join stream',
          'POST /api/livestreams/:id/leave': 'Leave stream',
          'POST /api/livestreams/:id/start': 'Start stream',
          'POST /api/livestreams/:id/end': 'End stream',
          'PUT /api/livestreams/:id': 'Update stream',
          'DELETE /api/livestreams/:id': 'Delete stream'
        }
      }
    });
  });
}

// Proxy for Bunny.net CDN (optional, for additional caching/processing)
if (process.env.BUNNY_CDN_PROXY === 'true') {
  app.use('/cdn', createProxyMiddleware({
    target: `https://${process.env.BUNNY_CDN_HOSTNAME}`,
    changeOrigin: true,
    pathRewrite: {
      '^/cdn': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.bunny('cdn_proxy_request', 'info', {
        originalUrl: req.originalUrl,
        targetUrl: proxyReq.path
      });
    },
    onError: (err, req, res) => {
      logger.bunny('cdn_proxy_error', 'error', {
        error: err.message,
        url: req.url
      });
      res.status(502).json({ error: 'CDN proxy error' });
    }
  }));
}

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    // Close database connections
    await sequelize.close();
    logger.info('Database connections closed');
    
    // Close Redis connections
    const { redis } = require('./config/redis');
    await redis.quit();
    logger.info('Redis connections closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await sequelize.close();
    const { redis } = require('./config/redis');
    await redis.quit();
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;