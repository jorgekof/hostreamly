const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Lazy load dependencies to avoid circular dependencies
let cache = null;
let logger = null;

try {
  const redis = require('../config/redis');
  cache = redis.cache;
} catch (error) {
  console.log('Redis not available yet, will be loaded later');
}

try {
  logger = require('../utils/logger');
} catch (error) {
  logger = console;
}

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeConnections: 0,
      memoryUsage: [],
      cpuUsage: [],
      diskUsage: [],
      networkIO: { rx: 0, tx: 0 },
      lastReset: Date.now()
    };
    
    this.alerts = {
      highMemory: { threshold: 85, active: false },
      highCPU: { threshold: 80, active: false },
      highDisk: { threshold: 90, active: false },
      highErrorRate: { threshold: 5, active: false },
      slowResponse: { threshold: 2000, active: false }
    };
    
    this.healthChecks = new Map();
    this.initialized = false;
    this.isRunning = false;
    this.startMonitoring();
  }

  /**
   * Initialize the monitoring service
   */
  async initialize() {
    try {
      // Load cache if not already loaded
      if (!cache) {
        try {
          const redis = require('../config/redis');
          cache = redis.cache;
        } catch (error) {
          console.log('Redis not available, monitoring will work without caching');
        }
      }
      
      // Load logger if not already loaded
      if (!logger || logger === console) {
        try {
          logger = require('../utils/logger');
        } catch (error) {
          logger = console;
        }
      }
      
      this.initialized = true;
      this.isRunning = true;
      if (logger.info) {
        logger.info('MonitoringService initialized successfully');
      } else {
        console.log('MonitoringService initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize MonitoringService:', error.message);
      // Don't throw error, just log it
    }
  }

  /**
   * Start monitoring system metrics
   */
  startMonitoring() {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Check alerts every minute
    this.alertsInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);

    // Reset metrics every hour
    this.resetInterval = setInterval(() => {
      this.resetMetrics();
    }, 3600000);

    logger.info('Monitoring service started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.alertsInterval) clearInterval(this.alertsInterval);
    if (this.resetInterval) clearInterval(this.resetInterval);
    
    this.isRunning = false;
    logger.info('Monitoring service stopped');
  }

  /**
   * Stop the monitoring service
   */
  async stop() {
    this.isRunning = false;
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
    if (logger.info) {
      logger.info('MonitoringService stopped');
    } else {
      console.log('MonitoringService stopped');
    }
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
      
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        heap: memoryUsage.heapUsed,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        percent: memoryPercent
      });

      // CPU usage
      const cpuUsage = process.cpuUsage();
      const cpuPercent = this.calculateCPUPercent(cpuUsage);
      
      this.metrics.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: cpuPercent
      });

      // Disk usage
      const diskUsage = await this.getDiskUsage();
      this.metrics.diskUsage.push({
        timestamp: Date.now(),
        ...diskUsage
      });

      // Keep only last 100 entries
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }
      if (this.metrics.cpuUsage.length > 100) {
        this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
      }
      if (this.metrics.diskUsage.length > 100) {
        this.metrics.diskUsage = this.metrics.diskUsage.slice(-100);
      }

      // Store metrics in Redis for persistence
      await this.storeMetrics();
      
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Calculate CPU percentage
   */
  calculateCPUPercent(cpuUsage) {
    if (!this.lastCPUUsage) {
      this.lastCPUUsage = cpuUsage;
      return 0;
    }

    const userDiff = cpuUsage.user - this.lastCPUUsage.user;
    const systemDiff = cpuUsage.system - this.lastCPUUsage.system;
    const totalDiff = userDiff + systemDiff;
    
    this.lastCPUUsage = cpuUsage;
    
    // Convert microseconds to percentage (rough estimate)
    return Math.min(100, (totalDiff / 1000000) * 100);
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      // This is a simplified version - in production, use a proper disk usage library
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
        used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        free: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        percent: 50
      };
    } catch (error) {
      logger.error('Error getting disk usage:', error);
      return { total: 0, used: 0, free: 0, percent: 0 };
    }
  }

  /**
   * Store metrics in Redis
   */
  async storeMetrics() {
    try {
      const metricsData = {
        timestamp: Date.now(),
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        activeConnections: this.metrics.activeConnections,
        avgResponseTime: this.getAverageResponseTime(),
        memory: this.metrics.memoryUsage.slice(-1)[0],
        cpu: this.metrics.cpuUsage.slice(-1)[0],
        disk: this.metrics.diskUsage.slice(-1)[0]
      };

      await cache.set('system_metrics', JSON.stringify(metricsData), 3600);
      
      // Store historical data
      const historyKey = `metrics_history:${new Date().toISOString().split('T')[0]}`;
      await cache.lpush(historyKey, JSON.stringify(metricsData));
      await cache.ltrim(historyKey, 0, 1439); // Keep 24 hours of data (1 per minute)
      await cache.expire(historyKey, 86400 * 7); // Expire after 7 days
      
    } catch (error) {
      logger.error('Error storing metrics:', error);
    }
  }

  /**
   * Check for alerts
   */
  async checkAlerts() {
    try {
      const latestMemory = this.metrics.memoryUsage.slice(-1)[0];
      const latestCPU = this.metrics.cpuUsage.slice(-1)[0];
      const latestDisk = this.metrics.diskUsage.slice(-1)[0];
      const errorRate = this.getErrorRate();
      const avgResponseTime = this.getAverageResponseTime();

      // Check memory alert
      if (latestMemory && latestMemory.percent > this.alerts.highMemory.threshold) {
        if (!this.alerts.highMemory.active) {
          this.alerts.highMemory.active = true;
          await this.sendAlert('HIGH_MEMORY', {
            current: latestMemory.percent,
            threshold: this.alerts.highMemory.threshold
          });
        }
      } else {
        this.alerts.highMemory.active = false;
      }

      // Check CPU alert
      if (latestCPU && latestCPU.percent > this.alerts.highCPU.threshold) {
        if (!this.alerts.highCPU.active) {
          this.alerts.highCPU.active = true;
          await this.sendAlert('HIGH_CPU', {
            current: latestCPU.percent,
            threshold: this.alerts.highCPU.threshold
          });
        }
      } else {
        this.alerts.highCPU.active = false;
      }

      // Check disk alert
      if (latestDisk && latestDisk.percent > this.alerts.highDisk.threshold) {
        if (!this.alerts.highDisk.active) {
          this.alerts.highDisk.active = true;
          await this.sendAlert('HIGH_DISK', {
            current: latestDisk.percent,
            threshold: this.alerts.highDisk.threshold
          });
        }
      } else {
        this.alerts.highDisk.active = false;
      }

      // Check error rate alert
      if (errorRate > this.alerts.highErrorRate.threshold) {
        if (!this.alerts.highErrorRate.active) {
          this.alerts.highErrorRate.active = true;
          await this.sendAlert('HIGH_ERROR_RATE', {
            current: errorRate,
            threshold: this.alerts.highErrorRate.threshold
          });
        }
      } else {
        this.alerts.highErrorRate.active = false;
      }

      // Check response time alert
      if (avgResponseTime > this.alerts.slowResponse.threshold) {
        if (!this.alerts.slowResponse.active) {
          this.alerts.slowResponse.active = true;
          await this.sendAlert('SLOW_RESPONSE', {
            current: avgResponseTime,
            threshold: this.alerts.slowResponse.threshold
          });
        }
      } else {
        this.alerts.slowResponse.active = false;
      }

    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }

  /**
   * Send alert
   */
  async sendAlert(type, data) {
    const alert = {
      type,
      timestamp: Date.now(),
      data,
      severity: this.getAlertSeverity(type)
    };

    logger.warn(`ALERT: ${type}`, alert);

    // Store alert in Redis
    await cache.lpush('system_alerts', JSON.stringify(alert));
    await cache.ltrim('system_alerts', 0, 99); // Keep last 100 alerts

    // TODO: Send notification (email, Slack, etc.)
    // await notificationService.sendAlert(alert);
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      HIGH_MEMORY: 'warning',
      HIGH_CPU: 'warning',
      HIGH_DISK: 'critical',
      HIGH_ERROR_RATE: 'critical',
      SLOW_RESPONSE: 'warning'
    };
    return severityMap[type] || 'info';
  }

  /**
   * Record request
   */
  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push({
      timestamp: Date.now(),
      time: responseTime
    });

    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  /**
   * Record error
   */
  recordError(error) {
    this.metrics.errors++;
    logger.error('Request error recorded:', error);
  }

  /**
   * Update active connections
   */
  updateActiveConnections(count) {
    this.metrics.activeConnections = count;
  }

  /**
   * Get average response time
   */
  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    
    const total = this.metrics.responseTime.reduce((sum, item) => sum + item.time, 0);
    return total / this.metrics.responseTime.length;
  }

  /**
   * Get error rate (errors per minute)
   */
  getErrorRate() {
    const timeWindow = 60000; // 1 minute
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    // This is simplified - in a real implementation, you'd track errors with timestamps
    const minutesElapsed = (now - this.metrics.lastReset) / 60000;
    return minutesElapsed > 0 ? this.metrics.errors / minutesElapsed : 0;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics.requests = 0;
    this.metrics.errors = 0;
    this.metrics.responseTime = [];
    this.metrics.lastReset = Date.now();
    
    logger.info('Metrics reset');
  }

  /**
   * Register health check
   */
  registerHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
    logger.info(`Health check registered: ${name}`);
  }

  /**
   * Run health checks
   */
  async runHealthChecks() {
    const results = {};
    let overallStatus = 'healthy';

    for (const [name, checkFunction] of this.healthChecks) {
      try {
        const result = await checkFunction();
        results[name] = {
          status: result.status || 'healthy',
          message: result.message || 'OK',
          timestamp: Date.now(),
          responseTime: result.responseTime || 0
        };

        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: error.message,
          timestamp: Date.now(),
          responseTime: 0
        };
        overallStatus = 'unhealthy';
        logger.error(`Health check failed: ${name}`, error);
      }
    }

    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks: results,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      activeConnections: this.metrics.activeConnections,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      memory: this.metrics.memoryUsage.slice(-1)[0],
      cpu: this.metrics.cpuUsage.slice(-1)[0],
      disk: this.metrics.diskUsage.slice(-1)[0],
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }

  /**
   * Get metrics history
   */
  async getMetricsHistory(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const historyKey = `metrics_history:${targetDate}`;
      
      const history = await cache.lrange(historyKey, 0, -1);
      return history.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Error getting metrics history:', error);
      return [];
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit = 10) {
    try {
      const alerts = await cache.lrange('system_alerts', 0, limit - 1);
      return alerts.map(alert => JSON.parse(alert));
    } catch (error) {
      logger.error('Error getting recent alerts:', error);
      return [];
    }
  }

  /**
   * Get system info
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      hostname: os.hostname()
    };
  }
}

module.exports = new MonitoringService();