const axios = require('axios');
const { Sequelize } = require('sequelize');
const Redis = require('ioredis');
const structuredLogger = require('../utils/structuredLogger');
const bunnyService = require('./bunnyService');
const backupService = require('./backupService');

class HealthMonitorService {
  constructor() {
    this.checks = new Map();
    this.metrics = {
      uptime: process.uptime(),
      startTime: new Date(),
      lastHealthCheck: null,
      healthCheckCount: 0,
      failedChecks: 0
    };
    
    this.initializeChecks();
    this.startPeriodicChecks();
  }
  
  /**
   * Initialize health check definitions
   */
  initializeChecks() {
    // Database health check
    this.checks.set('database', {
      name: 'Database Connection',
      check: this.checkDatabase.bind(this),
      timeout: 5000,
      critical: true
    });
    
    // Redis health check
    this.checks.set('redis', {
      name: 'Redis Connection',
      check: this.checkRedis.bind(this),
      timeout: 3000,
      critical: true
    });
    
    // Bunny CDN health check
    this.checks.set('bunny_cdn', {
      name: 'Bunny CDN Service',
      check: this.checkBunnyCDN.bind(this),
      timeout: 10000,
      critical: false
    });
    
    // File system health check
    this.checks.set('filesystem', {
      name: 'File System',
      check: this.checkFileSystem.bind(this),
      timeout: 2000,
      critical: true
    });
    
    // Memory usage check
    this.checks.set('memory', {
      name: 'Memory Usage',
      check: this.checkMemoryUsage.bind(this),
      timeout: 1000,
      critical: false
    });
    
    // External API dependencies
    this.checks.set('external_apis', {
      name: 'External APIs',
      check: this.checkExternalAPIs.bind(this),
      timeout: 8000,
      critical: false
    });
    
    // Backup service health
    this.checks.set('backup_service', {
      name: 'Backup Service',
      check: this.checkBackupService.bind(this),
      timeout: 5000,
      critical: false
    });
  }
  
  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        structuredLogger.error('Periodic health check failed', {
          error: error.message,
          event: 'health_check_error'
        });
      }
    }, 30000);
    
    structuredLogger.info('Health monitoring service started', {
      event: 'health_monitor_started',
      checksCount: this.checks.size
    });
  }
  
  /**
   * Run all health checks
   */
  async runAllChecks() {
    const results = {};
    const startTime = Date.now();
    
    this.metrics.healthCheckCount++;
    
    for (const [key, checkConfig] of this.checks) {
      try {
        const checkStartTime = Date.now();
        
        const result = await Promise.race([
          checkConfig.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), checkConfig.timeout)
          )
        ]);
        
        const duration = Date.now() - checkStartTime;
        
        results[key] = {
          name: checkConfig.name,
          status: 'healthy',
          duration,
          critical: checkConfig.critical,
          ...result
        };
        
        structuredLogger.logHealth(key, 'healthy', {
          duration,
          details: result
        });
        
      } catch (error) {
        const duration = Date.now() - checkStartTime;
        
        results[key] = {
          name: checkConfig.name,
          status: 'unhealthy',
          duration,
          critical: checkConfig.critical,
          error: error.message
        };
        
        this.metrics.failedChecks++;
        
        structuredLogger.logHealth(key, 'unhealthy', {
          duration,
          error: error.message,
          critical: checkConfig.critical
        });
        
        if (checkConfig.critical) {
          structuredLogger.error(`Critical health check failed: ${checkConfig.name}`, {
            event: 'critical_health_check_failed',
            check: key,
            error: error.message
          });
        }
      }
    }
    
    const totalDuration = Date.now() - startTime;
    this.metrics.lastHealthCheck = new Date();
    
    // Determine overall health status
    const criticalFailures = Object.values(results)
      .filter(result => result.critical && result.status === 'unhealthy');
    
    const overallStatus = criticalFailures.length > 0 ? 'unhealthy' : 'healthy';
    
    structuredLogger.info('Health check completed', {
      event: 'health_check_completed',
      overallStatus,
      duration: totalDuration,
      checksRun: Object.keys(results).length,
      failedChecks: Object.values(results).filter(r => r.status === 'unhealthy').length,
      criticalFailures: criticalFailures.length
    });
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      checks: results,
      metrics: this.getMetrics()
    };
  }
  
  /**
   * Check database connectivity
   */
  async checkDatabase() {
    const { sequelize } = require('../models');
    
    await sequelize.authenticate();
    
    const [results] = await sequelize.query('SELECT 1 as test');
    
    return {
      connected: true,
      testQuery: results[0].test === 1
    };
  }
  
  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 2000,
      lazyConnect: true
    });
    
    try {
      await redis.connect();
      
      const testKey = `health_check_${Date.now()}`;
      await redis.set(testKey, 'test', 'EX', 10);
      const result = await redis.get(testKey);
      await redis.del(testKey);
      
      const info = await redis.info('memory');
      const memoryUsage = this.parseRedisMemoryInfo(info);
      
      return {
        connected: true,
        testOperation: result === 'test',
        memoryUsage
      };
    } finally {
      redis.disconnect();
    }
  }
  
  /**
   * Check Bunny CDN service
   */
  async checkBunnyCDN() {
    try {
      // Test Bunny CDN API connectivity
      const response = await axios.get('https://api.bunny.net/videolibrary', {
        headers: {
          'AccessKey': process.env.BUNNY_API_KEY
        },
        timeout: 8000
      });
      
      // Get CDN statistics
      const statsResponse = await axios.get(`https://api.bunny.net/statistics`, {
        headers: {
          'AccessKey': process.env.BUNNY_API_KEY
        },
        params: {
          dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0]
        },
        timeout: 8000
      });
      
      return {
        apiConnected: response.status === 200,
        librariesCount: response.data?.length || 0,
        statistics: {
          bandwidth: statsResponse.data?.BandwidthUsedChart || [],
          requests: statsResponse.data?.RequestsServedChart || [],
          cacheHitRate: statsResponse.data?.CacheHitRate || 0
        }
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Bunny CDN API authentication failed');
      }
      throw error;
    }
  }
  
  /**
   * Check file system health
   */
  async checkFileSystem() {
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    // Check temp directory access
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, `health_check_${Date.now()}.tmp`);
    
    try {
      await fs.writeFile(testFile, 'health check test');
      const content = await fs.readFile(testFile, 'utf8');
      await fs.unlink(testFile);
      
      // Get disk usage
      const stats = await fs.stat(tempDir);
      
      return {
        tempDirWritable: content === 'health check test',
        tempDir,
        diskSpace: await this.getDiskUsage()
      };
    } catch (error) {
      // Clean up test file if it exists
      try {
        await fs.unlink(testFile);
      } catch {}
      throw error;
    }
  }
  
  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    const isHealthy = memoryUsagePercent < 90 && heapUsagePercent < 90;
    
    if (!isHealthy) {
      throw new Error(`High memory usage: System ${memoryUsagePercent.toFixed(1)}%, Heap ${heapUsagePercent.toFixed(1)}%`);
    }
    
    return {
      systemMemory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        usagePercent: memoryUsagePercent
      },
      processMemory: {
        ...memUsage,
        heapUsagePercent
      }
    };
  }
  
  /**
   * Check external API dependencies
   */
  async checkExternalAPIs() {
    const checks = [];
    
    // Check payment gateway (if configured)
    if (process.env.STRIPE_SECRET_KEY) {
      checks.push(this.checkStripeAPI());
    }
    
    // Check email service (if configured)
    if (process.env.SENDGRID_API_KEY) {
      checks.push(this.checkSendGridAPI());
    }
    
    const results = await Promise.allSettled(checks);
    
    return {
      totalChecks: checks.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      details: results.map((result, index) => ({
        check: index,
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason.message : undefined
      }))
    };
  }
  
  /**
   * Check backup service health
   */
  async checkBackupService() {
    try {
      const status = await backupService.getBackupStatus();
      
      const lastBackupAge = status.latestBackup ? 
        Date.now() - new Date(status.latestBackup.date).getTime() : null;
      
      // Alert if no backup in last 25 hours (daily backups expected)
      const isHealthy = !lastBackupAge || lastBackupAge < 25 * 60 * 60 * 1000;
      
      if (!isHealthy) {
        throw new Error(`Last backup is too old: ${Math.floor(lastBackupAge / (60 * 60 * 1000))} hours ago`);
      }
      
      return {
        ...status,
        lastBackupAge: lastBackupAge ? Math.floor(lastBackupAge / (60 * 60 * 1000)) : null
      };
    } catch (error) {
      throw new Error(`Backup service check failed: ${error.message}`);
    }
  }
  
  /**
   * Check Stripe API
   */
  async checkStripeAPI() {
    const response = await axios.get('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
      },
      timeout: 5000
    });
    
    return {
      service: 'stripe',
      connected: response.status === 200,
      accountId: response.data.id
    };
  }
  
  /**
   * Check SendGrid API
   */
  async checkSendGridAPI() {
    const response = await axios.get('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
      },
      timeout: 5000
    });
    
    return {
      service: 'sendgrid',
      connected: response.status === 200,
      accountType: response.data.type
    };
  }
  
  /**
   * Get system metrics
   */
  getMetrics() {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      ...this.metrics,
      uptime,
      memory: memUsage,
      cpu: cpuUsage,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }
  
  /**
   * Get detailed health report
   */
  async getDetailedHealthReport() {
    const healthCheck = await this.runAllChecks();
    const metrics = this.getMetrics();
    
    return {
      ...healthCheck,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        environment: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      metrics
    };
  }
  
  /**
   * Parse Redis memory info
   */
  parseRedisMemoryInfo(info) {
    const lines = info.split('\r\n');
    const memoryInfo = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.includes('memory')) {
          memoryInfo[key] = isNaN(value) ? value : parseInt(value);
        }
      }
    }
    
    return memoryInfo;
  }
  
  /**
   * Get disk usage information
   */
  async getDiskUsage() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Use different commands based on platform
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'wmic logicaldisk get size,freespace,caption' : 'df -h /';
      
      const { stdout } = await execAsync(command);
      
      if (isWindows) {
        // Parse Windows output
        const lines = stdout.trim().split('\n').slice(1);
        const diskInfo = lines[0].trim().split(/\s+/);
        return {
          total: parseInt(diskInfo[2]),
          free: parseInt(diskInfo[1]),
          used: parseInt(diskInfo[2]) - parseInt(diskInfo[1])
        };
      } else {
        // Parse Unix output
        const line = stdout.trim().split('\n')[1];
        const parts = line.split(/\s+/);
        return {
          filesystem: parts[0],
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4]
        };
      }
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = new HealthMonitorService();