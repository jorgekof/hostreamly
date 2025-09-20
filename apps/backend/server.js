const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./config/database');
const { cache } = require('./config/redis');
const { logger, requestLogger, systemLogger } = require('./middleware/logging');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const healthService = require('./services/healthService');
const backupService = require('./services/backupService');
const monitoringService = require('./services/monitoringService');
const authService = require('./services/authService');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize monitoring service
    await monitoringService.initialize();
    systemLogger.info('Monitoring service initialized');

    // Initialize health monitoring
    await healthService.initialize();
    systemLogger.info('Health monitoring service initialized');

    // Initialize backup service
    await backupService.initialize();
    systemLogger.info('Backup service initialized');

    // Initialize auth service
    await authService.initialize();
    systemLogger.info('Auth service initialized');

    // Start periodic health checks
    setInterval(async () => {
      const healthStatus = await healthService.getHealthStatus();
      if (!healthStatus.healthy) {
        systemLogger.error('Health check failed:', healthStatus);
      }
    }, 30000); // Check every 30 seconds

    // Start periodic monitoring
    setInterval(async () => {
      try {
        await monitoringService.collectMetrics();
        await monitoringService.checkAlerts();
      } catch (error) {
        systemLogger.error('Monitoring collection failed:', error);
      }
    }, 60000); // Check every minute

    // Start periodic backups (every 6 hours)
    setInterval(async () => {
      try {
        await backupService.createBackup();
        systemLogger.info('Scheduled backup completed');
      } catch (error) {
        systemLogger.error('Scheduled backup failed:', error);
      }
    }, 6 * 60 * 60 * 1000);

  } catch (error) {
    systemLogger.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin: [
    'http://154.29.74.169:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://154.29.74.169:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply middlewares in order
app.use(globalLimiter);
app.use(cors(corsOptions));
app.use(compressionMiddleware);
app.use(httpRequestLogger);
app.use(performanceLogger);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos del frontend (dist después del build)
app.use(express.static(path.join(__dirname, '../dist')));

// Datos de ejemplo en memoria
let users = [
    { id: 1, username: 'admin', email: 'admin@hostreamly.com', created_at: new Date() },
    { id: 2, username: 'demo', email: 'demo@hostreamly.com', created_at: new Date() }
];

let videos = [
    { id: 1, user_id: 1, title: 'Video Demo 1', description: 'Primer video de demostración', views: 150 },
    { id: 2, user_id: 2, title: 'Video Demo 2', description: 'Segundo video de demostración', views: 89 }
];

// Import and use route modules
const videosRouter = require('./routes/videos');
const backupRouter = require('./routes/backup');
const healthRouter = require('./routes/health');
const monitoringRouter = require('./routes/monitoring');

// API Routes
app.use('/api/videos', videosRouter);
app.use('/api/backup', backupRouter);
app.use('/api/health', healthRouter);
app.use('/api/monitoring', monitoringRouter);

// API Routes
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { username, email, password } = req.body;
    const newUser = {
        id: users.length + 1,
        username,
        email,
        created_at: new Date()
    };
    users.push(newUser);
    res.json(newUser);
});

app.get('/api/videos', (req, res) => {
    res.json(videos);
});

app.post('/api/videos', (req, res) => {
    const { title, description, user_id } = req.body;
    const newVideo = {
        id: videos.length + 1,
        user_id: user_id || 1,
        title,
        description,
        views: 0,
        created_at: new Date()
    };
    videos.push(newVideo);
    res.json(newVideo);
});

// Health check endpoint (debe estar antes del catch-all)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API 404 handler - solo para rutas que empiecen con /api
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Catch-all handler para SPA - debe servir index.html para todas las rutas no-API
app.get('*', (req, res) => {
    // No aplicar catch-all a rutas de API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Servir index.html para todas las demás rutas (SPA routing)
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middlewares (must be last)
app.use(errorLogger);
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  systemLogger.info('SIGTERM received, shutting down gracefully');
  await healthService.stop();
  await monitoringService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  systemLogger.info('SIGINT received, shutting down gracefully');
  await healthService.stop();
  await monitoringService.stop();
  process.exit(0);
});

// Initialize services and start server
const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    await initializeServices();
    console.log('Services initialized, starting HTTP server...');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor Hostreamly ejecutandose en http://154.29.74.169:${PORT}`);
      console.log(`Health check disponible en http://154.29.74.169:${PORT}/health`);
      console.log(`API disponible en http://154.29.74.169:${PORT}/api`);
      console.log(`Frontend disponible en http://154.29.74.169:${PORT}`);
      if (systemLogger && systemLogger.info) {
        systemLogger.info('Server started successfully');
      } else {
        console.log('Server started successfully');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
