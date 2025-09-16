const AWS = require('aws-sdk');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const logger = require('../utils/logger');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    // Configure DigitalOcean Spaces (S3-compatible)
    this.spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');
    this.s3 = new AWS.S3({
      endpoint: this.spacesEndpoint,
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
      region: process.env.DO_SPACES_REGION || 'nyc3'
    });
    
    this.bucketName = process.env.DO_SPACES_BUCKET || 'hostreamly-backups';
    this.backupDir = path.join(__dirname, '../backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    this.initializeScheduledBackups();
  }
  
  /**
   * Initialize scheduled backup jobs
   */
  initializeScheduledBackups() {
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.performFullBackup();
        logger.info('Scheduled daily backup completed successfully');
      } catch (error) {
        logger.error('Scheduled daily backup failed', { error: error.message });
      }
    });
    
    // Weekly full backup on Sundays at 1 AM
    cron.schedule('0 1 * * 0', async () => {
      try {
        await this.performFullBackup(true);
        logger.info('Scheduled weekly full backup completed successfully');
      } catch (error) {
        logger.error('Scheduled weekly full backup failed', { error: error.message });
      }
    });
    
    // Monthly cleanup on 1st day at 3 AM
    cron.schedule('0 3 1 * *', async () => {
      try {
        await this.cleanupOldBackups();
        logger.info('Scheduled backup cleanup completed successfully');
      } catch (error) {
        logger.error('Scheduled backup cleanup failed', { error: error.message });
      }
    });
    
    logger.info('Backup service initialized with scheduled jobs');
  }
  
  /**
   * Perform database backup
   * @param {boolean} isWeekly - Whether this is a weekly full backup
   */
  async performFullBackup(isWeekly = false) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupType = isWeekly ? 'weekly' : 'daily';
    const filename = `hostreamly-${backupType}-${timestamp}.sql`;
    const localPath = path.join(this.backupDir, filename);
    
    try {
      logger.info(`Starting ${backupType} database backup`, { filename });
      
      // Create database dump
      await this.createDatabaseDump(localPath);
      
      // Compress the backup
      const compressedPath = await this.compressBackup(localPath);
      
      // Upload to DigitalOcean Spaces
      await this.uploadToSpaces(compressedPath, `${backupType}/${path.basename(compressedPath)}`);
      
      // Clean up local files
      fs.unlinkSync(localPath);
      fs.unlinkSync(compressedPath);
      
      logger.info(`${backupType} backup completed successfully`, {
        filename: path.basename(compressedPath),
        type: backupType
      });
      
      return {
        success: true,
        filename: path.basename(compressedPath),
        type: backupType,
        timestamp
      };
      
    } catch (error) {
      logger.error(`${backupType} backup failed`, {
        error: error.message,
        filename
      });
      
      // Clean up any remaining files
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      
      throw error;
    }
  }
  
  /**
   * Create database dump using pg_dump
   * @param {string} outputPath - Path to save the dump
   */
  async createDatabaseDump(outputPath) {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'hostreamly',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };
    
    const pgDumpCommand = [
      'pg_dump',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.username}`,
      `--dbname=${dbConfig.database}`,
      '--verbose',
      '--clean',
      '--no-owner',
      '--no-privileges',
      `--file=${outputPath}`
    ].join(' ');
    
    // Set password via environment variable
    const env = { ...process.env, PGPASSWORD: dbConfig.password };
    
    try {
      const { stdout, stderr } = await execAsync(pgDumpCommand, { env });
      
      if (stderr && !stderr.includes('NOTICE')) {
        logger.warn('pg_dump warnings', { stderr });
      }
      
      logger.info('Database dump created successfully', {
        outputPath,
        size: fs.statSync(outputPath).size
      });
      
    } catch (error) {
      logger.error('Failed to create database dump', {
        error: error.message,
        command: pgDumpCommand.replace(dbConfig.password, '***')
      });
      throw error;
    }
  }
  
  /**
   * Compress backup file using gzip
   * @param {string} filePath - Path to the file to compress
   */
  async compressBackup(filePath) {
    const compressedPath = `${filePath}.gz`;
    
    try {
      await execAsync(`gzip "${filePath}"`);
      
      logger.info('Backup compressed successfully', {
        originalSize: fs.statSync(filePath + '.gz').size,
        compressedPath
      });
      
      return compressedPath;
      
    } catch (error) {
      logger.error('Failed to compress backup', {
        error: error.message,
        filePath
      });
      throw error;
    }
  }
  
  /**
   * Upload backup to DigitalOcean Spaces
   * @param {string} localPath - Local file path
   * @param {string} remotePath - Remote path in Spaces
   */
  async uploadToSpaces(localPath, remotePath) {
    try {
      const fileContent = fs.readFileSync(localPath);
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: remotePath,
        Body: fileContent,
        ContentType: 'application/gzip',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'database': process.env.DB_NAME || 'hostreamly',
          'version': process.env.APP_VERSION || '1.0.0'
        }
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      
      logger.info('Backup uploaded to DigitalOcean Spaces', {
        location: result.Location,
        key: result.Key,
        size: fileContent.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Failed to upload backup to Spaces', {
        error: error.message,
        localPath,
        remotePath
      });
      throw error;
    }
  }
  
  /**
   * List available backups
   * @param {string} type - Backup type (daily, weekly, or all)
   */
  async listBackups(type = 'all') {
    try {
      const prefix = type === 'all' ? '' : `${type}/`;
      
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      const backups = result.Contents.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        type: obj.Key.includes('weekly') ? 'weekly' : 'daily'
      })).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
      return backups;
      
    } catch (error) {
      logger.error('Failed to list backups', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Download backup from Spaces
   * @param {string} backupKey - Backup key in Spaces
   * @param {string} localPath - Local path to save the backup
   */
  async downloadBackup(backupKey, localPath) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: backupKey
      };
      
      const result = await this.s3.getObject(params).promise();
      fs.writeFileSync(localPath, result.Body);
      
      logger.info('Backup downloaded successfully', {
        backupKey,
        localPath,
        size: result.Body.length
      });
      
      return localPath;
      
    } catch (error) {
      logger.error('Failed to download backup', {
        error: error.message,
        backupKey
      });
      throw error;
    }
  }
  
  /**
   * Restore database from backup
   * @param {string} backupPath - Path to the backup file
   */
  async restoreFromBackup(backupPath) {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'hostreamly',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };
    
    try {
      logger.info('Starting database restore', { backupPath });
      
      // Decompress if needed
      let sqlPath = backupPath;
      if (backupPath.endsWith('.gz')) {
        await execAsync(`gunzip -c "${backupPath}" > "${backupPath.replace('.gz', '')}"`);
        sqlPath = backupPath.replace('.gz', '');
      }
      
      const psqlCommand = [
        'psql',
        `--host=${dbConfig.host}`,
        `--port=${dbConfig.port}`,
        `--username=${dbConfig.username}`,
        `--dbname=${dbConfig.database}`,
        `--file=${sqlPath}`
      ].join(' ');
      
      const env = { ...process.env, PGPASSWORD: dbConfig.password };
      
      const { stdout, stderr } = await execAsync(psqlCommand, { env });
      
      if (stderr && !stderr.includes('NOTICE')) {
        logger.warn('Database restore warnings', { stderr });
      }
      
      // Clean up decompressed file if we created it
      if (sqlPath !== backupPath && fs.existsSync(sqlPath)) {
        fs.unlinkSync(sqlPath);
      }
      
      logger.info('Database restore completed successfully', { backupPath });
      
      return { success: true, backupPath };
      
    } catch (error) {
      logger.error('Database restore failed', {
        error: error.message,
        backupPath
      });
      throw error;
    }
  }
  
  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const toDelete = [];
      
      for (const backup of backups) {
        const backupDate = new Date(backup.lastModified);
        const daysDiff = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
        
        // Retention policy:
        // - Keep daily backups for 30 days
        // - Keep weekly backups for 90 days
        if (
          (backup.type === 'daily' && daysDiff > 30) ||
          (backup.type === 'weekly' && daysDiff > 90)
        ) {
          toDelete.push(backup.key);
        }
      }
      
      // Delete old backups
      for (const key of toDelete) {
        await this.s3.deleteObject({
          Bucket: this.bucketName,
          Key: key
        }).promise();
        
        logger.info('Deleted old backup', { key });
      }
      
      logger.info('Backup cleanup completed', {
        totalBackups: backups.length,
        deletedBackups: toDelete.length
      });
      
      return {
        totalBackups: backups.length,
        deletedBackups: toDelete.length,
        deletedKeys: toDelete
      };
      
    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get backup service status and statistics
   */
  async getBackupStatus() {
    try {
      const backups = await this.listBackups();
      const dailyBackups = backups.filter(b => b.type === 'daily');
      const weeklyBackups = backups.filter(b => b.type === 'weekly');
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const latestBackup = backups[0];
      
      return {
        totalBackups: backups.length,
        dailyBackups: dailyBackups.length,
        weeklyBackups: weeklyBackups.length,
        totalSize,
        latestBackup: latestBackup ? {
          key: latestBackup.key,
          date: latestBackup.lastModified,
          size: latestBackup.size,
          type: latestBackup.type
        } : null,
        nextScheduledBackup: '2:00 AM daily',
        retentionPolicy: {
          daily: '30 days',
          weekly: '90 days'
        }
      };
      
    } catch (error) {
      logger.error('Failed to get backup status', { error: error.message });
      throw error;
    }
  }
}

module.exports = new BackupService();