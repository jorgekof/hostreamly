const redis = require('redis');
const logger = require('../utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
};

// Create Redis client
const client = redis.createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
    connectTimeout: redisConfig.connectTimeout,
    commandTimeout: redisConfig.commandTimeout,
    keepAlive: redisConfig.keepAlive
  },
  password: redisConfig.password,
  database: redisConfig.db,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Redis event handlers
client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

client.on('end', () => {
  logger.info('Redis client disconnected');
});

client.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

// Connection function
const connectRedis = async () => {
  try {
    // Skip Redis connection in test environment if not available
    if (process.env.NODE_ENV === 'development' && !process.env.REDIS_HOST) {
      logger.warn('Redis connection skipped in development mode');
      return null;
    }
    
    if (!client.isOpen) {
      await client.connect();
    }
    logger.info('Redis connection established successfully');
    return client;
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    
    // In development, continue without Redis
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing without Redis in development mode');
      return null;
    }
    
    throw error;
  }
};

// Close connection function
const closeRedis = async () => {
  try {
    if (client.isOpen) {
      await client.quit();
    }
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
};

// Health check function
const checkRedisHealth = async () => {
  try {
    const pong = await client.ping();
    return {
      status: 'healthy',
      message: `Redis responded with: ${pong}`,
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

// In-memory cache fallback for development
const memoryCache = new Map();
const cacheTimers = new Map();

// Cache helper functions
const cache = {
  // Get value from cache
  get: async (key) => {
    try {
      // Use Redis if available
      if (client.isOpen) {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      }
      
      // Fallback to memory cache
      return memoryCache.get(key) || null;
    } catch (error) {
      logger.error('Cache get error:', error);
      // Fallback to memory cache on Redis error
      return memoryCache.get(key) || null;
    }
  },

  // Set value in cache
  set: async (key, value, ttl = 3600) => {
    try {
      // Use Redis if available
      if (client.isOpen) {
        const serialized = JSON.stringify(value);
        if (ttl > 0) {
          await client.setEx(key, ttl, serialized);
        } else {
          await client.set(key, serialized);
        }
        return true;
      }
      
      // Fallback to memory cache
      memoryCache.set(key, value);
      
      // Set expiration timer for memory cache
      if (ttl > 0) {
        if (cacheTimers.has(key)) {
          clearTimeout(cacheTimers.get(key));
        }
        const timer = setTimeout(() => {
          memoryCache.delete(key);
          cacheTimers.delete(key);
        }, ttl * 1000);
        cacheTimers.set(key, timer);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      // Fallback to memory cache on Redis error
      memoryCache.set(key, value);
      return true;
    }
  },

  // Delete value from cache
  del: async (key) => {
    try {
      // Use Redis if available
      if (client.isOpen) {
        await client.del(key);
        return true;
      }
      
      // Fallback to memory cache
      memoryCache.delete(key);
      if (cacheTimers.has(key)) {
        clearTimeout(cacheTimers.get(key));
        cacheTimers.delete(key);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      // Fallback to memory cache on Redis error
      memoryCache.delete(key);
      if (cacheTimers.has(key)) {
        clearTimeout(cacheTimers.get(key));
        cacheTimers.delete(key);
      }
      return true;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      // Use Redis if available
      if (client.isOpen) {
        const exists = await client.exists(key);
        return exists === 1;
      }
      
      // Fallback to memory cache
      return memoryCache.has(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      // Fallback to memory cache on Redis error
      return memoryCache.has(key);
    }
  },

  // Set expiration for key
  expire: async (key, ttl) => {
    try {
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  },

  // Get multiple keys
  mget: async (keys) => {
    try {
      const values = await client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  },

  // Set multiple keys
  mset: async (keyValuePairs, ttl = 3600) => {
    try {
      const pipeline = client.multi();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized = JSON.stringify(value);
        if (ttl > 0) {
          pipeline.setEx(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  },

  // Increment counter
  incr: async (key, amount = 1) => {
    try {
      const result = await client.incrBy(key, amount);
      return result;
    } catch (error) {
      logger.error('Cache incr error:', error);
      return null;
    }
  },

  // Get keys by pattern
  keys: async (pattern) => {
    try {
      const keys = await client.keys(pattern);
      return keys;
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  },

  // Flush all cache
  flushAll: async () => {
    try {
      await client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
};

// Session store for express-session (if needed)
// const session = require('express-session');
// const RedisStore = require('connect-redis')(session);
// const sessionStore = new RedisStore({ client });

module.exports = {
  client,
  connectRedis,
  closeRedis,
  checkRedisHealth,
  cache
  // sessionStore
};