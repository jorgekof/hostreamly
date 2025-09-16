const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database configuration
const dialect = process.env.DB_DIALECT || 'mariadb';

let dbConfig;

if (dialect === 'sqlite') {
  dbConfig = {
    dialect: 'sqlite',
    storage: process.env.DB_NAME,
    logging: process.env.NODE_ENV === 'development' ? 
      (msg) => logger.debug(msg) : false,
    benchmark: process.env.NODE_ENV === 'development',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: dialect,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      timezone: 'Etc/GMT0',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    logging: process.env.NODE_ENV === 'development' ? 
      (msg) => logger.debug(msg) : false,
    benchmark: process.env.NODE_ENV === 'development',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  };
}

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig);

// Connection function
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`${dialect.toUpperCase()} connection established successfully`);
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
    
    return sequelize;
  } catch (error) {
    logger.error(`Unable to connect to ${dialect.toUpperCase()}:`, error);
    throw error;
  }
};

// Close connection function
const closeDB = async () => {
  try {
    await sequelize.close();
    logger.info('MariaDB connection closed');
  } catch (error) {
    logger.error('Error closing MariaDB connection:', error);
    throw error;
  }
};

// Health check function
const checkDBHealth = async () => {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Transaction helper
const withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Query performance monitoring
sequelize.addHook('beforeQuery', (options) => {
  options.startTime = Date.now();
});

sequelize.addHook('afterQuery', (options) => {
  const duration = Date.now() - options.startTime;
  if (duration > 1000) { // Log slow queries (>1s)
    logger.warn('Slow query detected', {
      sql: options.sql,
      duration: `${duration}ms`,
      bind: options.bind
    });
  }
});

// Export configuration and functions
module.exports = {
  sequelize,
  connectDB,
  closeDB,
  checkDBHealth,
  withTransaction,
  Sequelize
};