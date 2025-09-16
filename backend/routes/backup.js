const express = require('express');
const router = express.Router();
const backupService = require('../services/backupService');
const { auth: authMiddleware, validateInput, enhancedRateLimit } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../utils/logger');
const { ForbiddenError, ValidationError } = require('../utils/errors');

/**
 * Middleware to check admin permissions
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  next();
};

/**
 * @route   POST /api/backup/create
 * @desc    Create manual backup
 * @access  Admin
 */
router.post('/create',
  enhancedRateLimit({ type: 'backup_create', maxRequests: 5, windowMs: 60 * 60 * 1000 }), // 5 per hour
  authMiddleware,
  requireAdmin,
  validateInput({
    type: { required: false, type: 'string', enum: ['daily', 'weekly'] }
  }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { type = 'daily' } = req.body;
      const isWeekly = type === 'weekly';
      
      logger.info('Manual backup initiated', {
        userId: req.user.id,
        type,
        ip: req.ip
      });
      
      const result = await backupService.performFullBackup(isWeekly);
      
      res.json({
        success: true,
        message: 'Backup created successfully',
        data: result
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/backup/list
 * @desc    List available backups
 * @access  Admin
 */
router.get('/list',
  enhancedRateLimit({ type: 'backup_list', maxRequests: 20, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  validateInput({
    type: { required: false, type: 'string', enum: ['all', 'daily', 'weekly'] }
  }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { type = 'all' } = req.query;
      
      const backups = await backupService.listBackups(type);
      
      res.json({
        success: true,
        data: {
          backups,
          total: backups.length,
          filter: type
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/backup/download
 * @desc    Download backup file
 * @access  Admin
 */
router.post('/download',
  enhancedRateLimit({ type: 'backup_download', maxRequests: 10, windowMs: 60 * 60 * 1000 }), // 10 per hour
  authMiddleware,
  requireAdmin,
  validateInput({
    backupKey: { required: true, type: 'string', maxLength: 500 }
  }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { backupKey } = req.body;
      
      if (!backupKey || !backupKey.includes('hostreamly-')) {
        throw new ValidationError('Invalid backup key');
      }
      
      logger.info('Backup download initiated', {
        userId: req.user.id,
        backupKey,
        ip: req.ip
      });
      
      const tempPath = `/tmp/${Date.now()}-${backupKey.split('/').pop()}`;
      await backupService.downloadBackup(backupKey, tempPath);
      
      // Send file and clean up
      res.download(tempPath, (err) => {
        if (err) {
          logger.error('Backup download failed', { error: err.message });
        }
        // Clean up temp file
        require('fs').unlink(tempPath, () => {});
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/backup/restore
 * @desc    Restore database from backup
 * @access  Admin
 */
router.post('/restore',
  enhancedRateLimit({ type: 'backup_restore', maxRequests: 2, windowMs: 60 * 60 * 1000 }), // 2 per hour
  authMiddleware,
  requireAdmin,
  validateInput({
    backupKey: { required: true, type: 'string', maxLength: 500 },
    confirmRestore: { required: true, type: 'boolean' }
  }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { backupKey, confirmRestore } = req.body;
      
      if (!confirmRestore) {
        throw new ValidationError('Restore confirmation required');
      }
      
      if (!backupKey || !backupKey.includes('hostreamly-')) {
        throw new ValidationError('Invalid backup key');
      }
      
      logger.warn('Database restore initiated', {
        userId: req.user.id,
        backupKey,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      // Download backup to temp location
      const tempPath = `/tmp/${Date.now()}-restore-${backupKey.split('/').pop()}`;
      await backupService.downloadBackup(backupKey, tempPath);
      
      // Perform restore
      const result = await backupService.restoreFromBackup(tempPath);
      
      // Clean up temp file
      require('fs').unlink(tempPath, () => {});
      
      logger.info('Database restore completed', {
        userId: req.user.id,
        backupKey,
        success: result.success
      });
      
      res.json({
        success: true,
        message: 'Database restored successfully',
        data: result
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/backup/status
 * @desc    Get backup service status
 * @access  Admin
 */
router.get('/status',
  enhancedRateLimit({ type: 'backup_status', maxRequests: 30, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const status = await backupService.getBackupStatus();
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/backup/cleanup
 * @desc    Clean up old backups
 * @access  Admin
 */
router.post('/cleanup',
  enhancedRateLimit({ type: 'backup_cleanup', maxRequests: 5, windowMs: 60 * 60 * 1000 }), // 5 per hour
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      logger.info('Manual backup cleanup initiated', {
        userId: req.user.id,
        ip: req.ip
      });
      
      const result = await backupService.cleanupOldBackups();
      
      res.json({
        success: true,
        message: 'Backup cleanup completed',
        data: result
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/backup/health
 * @desc    Check backup service health
 * @access  Admin
 */
router.get('/health',
  enhancedRateLimit({ type: 'backup_health', maxRequests: 60, windowMs: 60 * 1000 }),
  authMiddleware,
  requireAdmin,
  async (req, res, next) => {
    try {
      const checks = {
        spacesConnection: false,
        databaseConnection: false,
        backupDirectory: false,
        scheduledJobs: true // Assuming cron jobs are running
      };
      
      // Test Spaces connection
      try {
        await backupService.listBackups();
        checks.spacesConnection = true;
      } catch (error) {
        logger.error('Spaces connection check failed', { error: error.message });
      }
      
      // Test database connection
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const dbConfig = {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'hostreamly',
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD
        };
        
        const testCommand = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --command="SELECT 1;"`;
        const env = { ...process.env, PGPASSWORD: dbConfig.password };
        
        await execAsync(testCommand, { env });
        checks.databaseConnection = true;
      } catch (error) {
        logger.error('Database connection check failed', { error: error.message });
      }
      
      // Check backup directory
      try {
        const fs = require('fs');
        const backupDir = require('path').join(__dirname, '../backups');
        checks.backupDirectory = fs.existsSync(backupDir);
      } catch (error) {
        logger.error('Backup directory check failed', { error: error.message });
      }
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      res.json({
        success: true,
        data: {
          healthy: allHealthy,
          checks,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;