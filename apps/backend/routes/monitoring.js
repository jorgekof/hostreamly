const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const monitoringService = require('../services/monitoringService');
const { logger } = require('../middleware/logging');
const { asyncHandler } = require('../middleware/errorHandler');
const { cache } = require('../config/redis');
const os = require('os');

const router = express.Router();

/**
 * @route   GET /api/monitoring/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', asyncHandler(async (req, res) => {
  const healthStatus = await monitoringService.runHealthChecks();
  
  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    data: healthStatus
  });
}));

/**
 * @route   GET /api/monitoring/metrics
 * @desc    Get current system metrics
 * @access  Private (Admin only)
 */
router.get('/metrics', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const metrics = monitoringService.getCurrentMetrics();
  const systemInfo = monitoringService.getSystemInfo();
  
  res.json({
    success: true,
    data: {
      metrics,
      system: systemInfo,
      timestamp: Date.now()
    }
  });
}));

/**
 * @route   GET /api/monitoring/metrics/history
 * @desc    Get metrics history
 * @access  Private (Admin only)
 */
router.get('/metrics/history', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { date, hours = 24 } = req.query;
  
  let targetDate = date;
  if (!targetDate) {
    targetDate = new Date().toISOString().split('T')[0];
  }
  
  const history = await monitoringService.getMetricsHistory(targetDate);
  
  // Filter by hours if specified
  const hoursAgo = Date.now() - (hours * 60 * 60 * 1000);
  const filteredHistory = history.filter(metric => metric.timestamp >= hoursAgo);
  
  res.json({
    success: true,
    data: {
      history: filteredHistory,
      date: targetDate,
      hours: parseInt(hours)
    }
  });
}));

/**
 * @route   GET /api/monitoring/alerts
 * @desc    Get recent alerts
 * @access  Private (Admin only)
 */
router.get('/alerts', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  
  const alerts = await monitoringService.getRecentAlerts(parseInt(limit));
  
  res.json({
    success: true,
    data: {
      alerts,
      count: alerts.length
    }
  });
}));

/**
 * @route   GET /api/monitoring/logs
 * @desc    Get recent logs
 * @access  Private (Admin only)
 */
router.get('/logs', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { level = 'info', limit = 100, since } = req.query;
  
  try {
    // This is a simplified implementation
    // In production, you might want to use a log aggregation service
    const logs = await getLogs(level, parseInt(limit), since);
    
    res.json({
      success: true,
      data: {
        logs,
        level,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs'
    });
  }
}));

/**
 * @route   GET /api/monitoring/performance
 * @desc    Get performance metrics
 * @access  Private (Admin only)
 */
router.get('/performance', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { timeframe = '1h' } = req.query;
  
  const performanceData = await getPerformanceMetrics(timeframe);
  
  res.json({
    success: true,
    data: performanceData
  });
}));

/**
 * @route   GET /api/monitoring/database
 * @desc    Get database metrics
 * @access  Private (Admin only)
 */
router.get('/database', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const dbMetrics = await getDatabaseMetrics();
  
  res.json({
    success: true,
    data: dbMetrics
  });
}));

/**
 * @route   GET /api/monitoring/redis
 * @desc    Get Redis metrics
 * @access  Private (Admin only)
 */
router.get('/redis', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const redisInfo = await cache.info();
    const redisStats = parseRedisInfo(redisInfo);
    
    res.json({
      success: true,
      data: redisStats
    });
  } catch (error) {
    logger.error('Error getting Redis metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Redis metrics'
    });
  }
}));

/**
 * @route   POST /api/monitoring/alerts/configure
 * @desc    Configure alert thresholds
 * @access  Private (Admin only)
 */
router.post('/alerts/configure', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { alertType, threshold, enabled } = req.body;
  
  if (!alertType || threshold === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Alert type and threshold are required'
    });
  }
  
  // Update alert configuration
  const alertConfig = {
    type: alertType,
    threshold: parseFloat(threshold),
    enabled: enabled !== false,
    updatedAt: Date.now(),
    updatedBy: req.user.id
  };
  
  await cache.set(`alert_config:${alertType}`, JSON.stringify(alertConfig));
  
  logger.info('Alert configuration updated', {
    alertType,
    threshold,
    enabled,
    userId: req.user.id
  });
  
  res.json({
    success: true,
    message: 'Alert configuration updated',
    data: alertConfig
  });
}));

/**
 * @route   GET /api/monitoring/dashboard
 * @desc    Get dashboard data
 * @access  Private (Admin only)
 */
router.get('/dashboard', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const [metrics, alerts, systemInfo, performanceData] = await Promise.all([
    monitoringService.getCurrentMetrics(),
    monitoringService.getRecentAlerts(10),
    monitoringService.getSystemInfo(),
    getPerformanceMetrics('1h')
  ]);
  
  const dashboardData = {
    overview: {
      uptime: systemInfo.uptime,
      requests: metrics.requests,
      errors: metrics.errors,
      activeConnections: metrics.activeConnections,
      errorRate: metrics.errorRate,
      avgResponseTime: metrics.averageResponseTime
    },
    system: {
      memory: metrics.memory,
      cpu: metrics.cpu,
      disk: metrics.disk,
      platform: systemInfo.platform,
      nodeVersion: systemInfo.nodeVersion
    },
    alerts: alerts.filter(alert => alert.severity === 'critical').slice(0, 5),
    performance: performanceData,
    timestamp: Date.now()
  };
  
  res.json({
    success: true,
    data: dashboardData
  });
}));

/**
 * @route   POST /api/monitoring/test-alert
 * @desc    Test alert system
 * @access  Private (Admin only)
 */
router.post('/test-alert', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { alertType = 'TEST_ALERT' } = req.body;
  
  await monitoringService.sendAlert(alertType, {
    message: 'This is a test alert',
    triggeredBy: req.user.id,
    timestamp: Date.now()
  });
  
  logger.info('Test alert sent', {
    alertType,
    userId: req.user.id
  });
  
  res.json({
    success: true,
    message: 'Test alert sent successfully'
  });
}));

// Helper functions

/**
 * Get logs from file system (simplified implementation)
 */
async function getLogs(level, limit, since) {
  // This is a placeholder implementation
  // In production, you'd want to use a proper log aggregation service
  return [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Sample log entry',
      meta: {}
    }
  ];
}

/**
 * Get performance metrics for a given timeframe
 */
async function getPerformanceMetrics(timeframe) {
  const now = Date.now();
  let startTime;
  
  switch (timeframe) {
    case '1h':
      startTime = now - (60 * 60 * 1000);
      break;
    case '6h':
      startTime = now - (6 * 60 * 60 * 1000);
      break;
    case '24h':
      startTime = now - (24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = now - (7 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = now - (60 * 60 * 1000);
  }
  
  // Get metrics from monitoring service
  const metrics = monitoringService.getCurrentMetrics();
  
  return {
    timeframe,
    startTime,
    endTime: now,
    responseTime: {
      avg: metrics.averageResponseTime,
      p95: metrics.averageResponseTime * 1.5, // Placeholder
      p99: metrics.averageResponseTime * 2     // Placeholder
    },
    throughput: {
      requestsPerSecond: metrics.requests / 3600, // Rough estimate
      errorsPerSecond: metrics.errors / 3600
    },
    resources: {
      memory: metrics.memory,
      cpu: metrics.cpu,
      disk: metrics.disk
    }
  };
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics() {
  // This would typically query your database for metrics
  // For now, return placeholder data
  return {
    connections: {
      active: 5,
      idle: 10,
      total: 15
    },
    queries: {
      total: 1000,
      slow: 5,
      failed: 2
    },
    performance: {
      avgQueryTime: 50,
      slowestQuery: 2000
    },
    size: {
      total: '500MB',
      tables: 25,
      indexes: 30
    }
  };
}

/**
 * Parse Redis INFO command output
 */
function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const stats = {};
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      stats[key] = isNaN(value) ? value : parseFloat(value);
    }
  });
  
  return {
    version: stats.redis_version,
    uptime: stats.uptime_in_seconds,
    connections: {
      connected: stats.connected_clients,
      blocked: stats.blocked_clients,
      total: stats.total_connections_received
    },
    memory: {
      used: stats.used_memory,
      peak: stats.used_memory_peak,
      fragmentation: stats.mem_fragmentation_ratio
    },
    stats: {
      commands: stats.total_commands_processed,
      keyspace_hits: stats.keyspace_hits,
      keyspace_misses: stats.keyspace_misses,
      hit_rate: stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses) * 100
    }
  };
}

module.exports = router;