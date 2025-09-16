const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create Analytics Tables Script
 * 
 * Creates the necessary tables for the enhanced analytics system
 */

async function createAnalyticsTables() {
  try {
    console.log('Creating analytics tables...');
    
    // Create video_metadata table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS video_metadata (
        id VARCHAR(36) PRIMARY KEY,
        bunny_video_id VARCHAR(36) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tags JSON,
        status ENUM('uploading', 'processing', 'ready', 'failed') DEFAULT 'uploading',
        storage_size_bytes BIGINT DEFAULT 0,
        duration_seconds INT DEFAULT 0,
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ video_metadata table created');
    
    // Create video_views table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS video_views (
        id VARCHAR(36) PRIMARY KEY,
        video_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        duration_seconds INT DEFAULT 0,
        quality VARCHAR(20) DEFAULT 'auto',
        user_agent TEXT,
        ip_address VARCHAR(45),
        country VARCHAR(2),
        bandwidth_bytes BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_video_id (video_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_country (country)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ video_views table created');
    
    // Create user_storage_usage table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_storage_usage (
        user_id VARCHAR(36) PRIMARY KEY,
        bytes_used BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ user_storage_usage table created');
    
    // Create user_bandwidth_usage table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_bandwidth_usage (
        user_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        bytes_transferred BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, date),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ user_bandwidth_usage table created');
    
    // Create upload_events table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS upload_events (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        video_id VARCHAR(36),
        event_type ENUM('upload_started', 'upload_completed', 'upload_failed', 'processing_started', 'processing_completed', 'processing_failed') NOT NULL,
        file_size_bytes BIGINT,
        error_message TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_video_id (video_id),
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ upload_events table created');
    
    // Create subscription_plans table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        storage_limit_bytes BIGINT NOT NULL,
        bandwidth_limit_bytes BIGINT NOT NULL,
        video_limit INT NOT NULL,
        price_monthly DECIMAL(10,2),
        features JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ subscription_plans table created');
    
    // Create user_analytics_summary table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_analytics_summary (
        user_id VARCHAR(36) PRIMARY KEY,
        total_videos INT DEFAULT 0,
        total_views BIGINT DEFAULT 0,
        total_watch_time_seconds BIGINT DEFAULT 0,
        total_storage_bytes BIGINT DEFAULT 0,
        total_bandwidth_bytes BIGINT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ user_analytics_summary table created');
    
    // Create video_analytics_summary table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS video_analytics_summary (
        video_id VARCHAR(36) PRIMARY KEY,
        total_views BIGINT DEFAULT 0,
        total_watch_time_seconds BIGINT DEFAULT 0,
        avg_watch_time_seconds DECIMAL(10,2) DEFAULT 0,
        total_bandwidth_bytes BIGINT DEFAULT 0,
        engagement_score INT DEFAULT 0,
        unique_viewers BIGINT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ video_analytics_summary table created');
    
    // Insert default subscription plans
    await sequelize.query(`
      INSERT IGNORE INTO subscription_plans (id, name, storage_limit_bytes, bandwidth_limit_bytes, video_limit, price_monthly, features) VALUES
      ('free-plan', 'Free', 1073741824, 10737418240, 10, 0.00, JSON_OBJECT('drm', false, 'analytics', 'basic', 'support', 'community')),
      ('starter-plan', 'Starter', 10737418240, 107374182400, 100, 25.00, JSON_OBJECT('drm', true, 'analytics', 'advanced', 'support', 'email')),
      ('pro-plan', 'Professional', 107374182400, 1073741824000, 1000, 219.00, JSON_OBJECT('drm', true, 'analytics', 'advanced', 'support', 'priority')),
      ('enterprise-plan', 'Enterprise', 1099511627776, 10995116277760, 10000, 999.00, JSON_OBJECT('drm', true, 'analytics', 'advanced', 'support', 'dedicated'))
    `);
    console.log('✓ Default subscription plans inserted');
    
    console.log('\n🎉 All analytics tables created successfully!');
    
  } catch (error) {
    console.error('\n💥 Failed to create analytics tables!');
    console.error('Error:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    
    throw error;
  }
}

async function main() {
  try {
    console.log('Connecting to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection successful');
    
    // Create analytics tables
    await createAnalyticsTables();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await sequelize.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
    }
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = { createAnalyticsTables };