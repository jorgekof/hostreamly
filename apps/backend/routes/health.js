const express = require('express');
const router = express.Router();
const healthMonitorService = require('../services/healthMonitorService');
const { auth: authMiddleware, validateInput, enhancedRateLimit } = require('../middleware/auth');
const structuredLogger = require('../utils/structuredLogger');
const { ForbiddenError } = require('../utils/errors');

/**
 * Middleware to check admin permissions for detailed health info
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  next();
};

/**
 * @route   GET /health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/',
  enhancedRateLimit({ type: 'health_check', maxRequests: 100, windowMs: 60 * 1000 }),
  async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Run basic health checks
      const healthResult = await healthMonitorService.runAllChecks();
      const responseTime = Date.now() - startTime;
      
      // Determine HTTP status based on health
      const httpStatus = healthResult.status === 'healthy' ? 200 : 503;
      
      // Basic health response (no sensitive information)
      const response = {
        status: healthResult.status,
        timestamp: healthResult.timestamp,
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime,
        checks: Object.keys(healthResult.checks).reduce((acc, key) => {
          const check = healthResult.checks[key];
          acc[key] = {
            name: check.name,
            status: check.status,
            critical: check.critical
          };
          return acc;
        }, {})
      };
      
      // Log health check request
      structuredLogger.info('Health check requested', {
        event: 'health_check_request',
        status: healthResult.status,
        responseTime,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(httpStatus).json(response);
      
    } catch (error) {
      structuredLogger.error('Health check failed', {
        event: 'health_check_error',
        error: error.message
      });
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime: process.uptime()
      });
    }
  }
);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with full metrics
 * @access  Admin
 */
router.get('/detailed',
  enhancedRateLimit({ type: 'health_detailed', maxRequests: 30, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const healthReport = await healthMonitorService.getDetailedHealthReport();
      
      structuredLogger.info('Detailed health check requested', {
        event: 'detailed_health_check_request',
        userId: req.user.id,
        status: healthReport.status
      });
      
      const httpStatus = healthReport.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(healthReport);
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /health/metrics
 * @desc    System metrics and performance data
 * @access  Admin
 */
router.get('/metrics',
  enhancedRateLimit({ type: 'health_metrics', maxRequests: 60, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const metrics = healthMonitorService.getMetrics();
      
      // Add additional system metrics
      const systemMetrics = {
        ...metrics,
        system: {
          loadAverage: require('os').loadavg(),
          totalMemory: require('os').totalmem(),
          freeMemory: require('os').freemem(),
          cpuCount: require('os').cpus().length,
          networkInterfaces: Object.keys(require('os').networkInterfaces())
        },
        process: {
          pid: process.pid,
          ppid: process.ppid,
          title: process.title,
          argv: process.argv,
          execPath: process.execPath,
          cwd: process.cwd()
        }
      };
      
      res.json({
        success: true,
        data: systemMetrics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /health/bunny
 * @desc    Bunny CDN specific health and metrics
 * @access  Admin
 */
router.get('/bunny',
  enhancedRateLimit({ type: 'health_bunny', maxRequests: 20, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const bunnyHealth = await healthMonitorService.checks.get('bunny_cdn').check();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          ...bunnyHealth
        }
      });
      
    } catch (error) {
      res.status(503).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route   GET /health/database
 * @desc    Database specific health check
 * @access  Admin
 */
router.get('/database',
  enhancedRateLimit({ type: 'health_database', maxRequests: 30, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const dbHealth = await healthMonitorService.checks.get('database').check();
      
      // Get additional database metrics
      const { sequelize } = require('../models');
      const [connectionCount] = await sequelize.query(
        "SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'"
      );
      
      const [dbSize] = await sequelize.query(
        "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
      );
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          ...dbHealth,
          metrics: {
            activeConnections: connectionCount[0].connections,
            databaseSize: dbSize[0].size
          }
        }
      });
      
    } catch (error) {
      res.status(503).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route   GET /health/redis
 * @desc    Redis specific health check
 * @access  Admin
 */
router.get('/redis',
  enhancedRateLimit({ type: 'health_redis', maxRequests: 30, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const redisHealth = await healthMonitorService.checks.get('redis').check();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          ...redisHealth
        }
      });
      
    } catch (error) {
      res.status(503).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route   POST /health/check/:component
 * @desc    Run specific health check on demand
 * @access  Admin
 */
router.post('/check/:component',
  enhancedRateLimit({ type: 'health_check_component', maxRequests: 10, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  validateInput({
    component: { required: true, type: 'string', enum: ['database', 'redis', 'bunny_cdn', 'filesystem', 'memory', 'external_apis', 'backup_service'] }
  }),
  async (req, res, next) => {
    try {
      const { component } = req.params;
      
      const checkConfig = healthMonitorService.checks.get(component);
      if (!checkConfig) {
        return res.status(400).json({
          success: false,
          error: `Unknown health check component: ${component}`
        });
      }
      
      structuredLogger.info('Manual health check requested', {
        event: 'manual_health_check',
        component,
        userId: req.user.id
      });
      
      const startTime = Date.now();
      const result = await checkConfig.check();
      const duration = Date.now() - startTime;
      
      res.json({
        success: true,
        data: {
          component,
          name: checkConfig.name,
          status: 'healthy',
          duration,
          timestamp: new Date().toISOString(),
          ...result
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      res.status(503).json({
        success: false,
        data: {
          component: req.params.component,
          status: 'unhealthy',
          duration,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  }
);

/**
 * @route   GET /health/history
 * @desc    Get health check history and trends
 * @access  Admin
 */
router.get('/history',
  enhancedRateLimit({ type: 'health_history', maxRequests: 20, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  validateInput({
    hours: { required: false, type: 'number', min: 1, max: 168 }, // Max 1 week
    component: { required: false, type: 'string' }
  }),
  async (req, res, next) => {
    try {
      const { hours = 24, component } = req.query;
      
      // This would typically query a time-series database or log aggregation service
      // For now, return current metrics and suggest implementing proper monitoring
      const metrics = healthMonitorService.getMetrics();
      
      res.json({
        success: true,
        data: {
          message: 'Health history tracking requires time-series database setup',
          suggestion: 'Consider implementing Prometheus + Grafana for detailed metrics',
          currentMetrics: metrics,
          period: `${hours} hours`,
          component: component || 'all'
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /health/alerts
 * @desc    Get current health alerts and warnings
 * @access  Admin
 */
router.get('/alerts',
  enhancedRateLimit({ type: 'health_alerts', maxRequests: 30, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const healthResult = await healthMonitorService.runAllChecks();
      
      const alerts = [];
      const warnings = [];
      
      // Analyze health results for alerts
      Object.entries(healthResult.checks).forEach(([key, check]) => {
        if (check.status === 'unhealthy') {
          const alert = {
            component: key,
            name: check.name,
            severity: check.critical ? 'critical' : 'warning',
            message: check.error || 'Component is unhealthy',
            timestamp: new Date().toISOString()
          };
          
          if (check.critical) {
            alerts.push(alert);
          } else {
            warnings.push(alert);
          }
        }
      });
      
      // Check for performance issues
      const metrics = healthMonitorService.getMetrics();
      if (metrics.memory && metrics.memory.heapUsed / metrics.memory.heapTotal > 0.8) {
        warnings.push({
          component: 'memory',
          name: 'Memory Usage',
          severity: 'warning',
          message: 'High memory usage detected',
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        data: {
          alerts,
          warnings,
          totalAlerts: alerts.length,
          totalWarnings: warnings.length,
          overallStatus: alerts.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'healthy',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;