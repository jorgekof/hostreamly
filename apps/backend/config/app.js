const path = require('path');
const os = require('os');

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    timezone: process.env.TZ || 'UTC'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5 // 5 auth attempts per 15 minutes
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'hostreamly',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'hostreamly:',
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB
    allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || 'mp4,avi,mov,wmv,flv,webm,mkv').split(','),
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp').split(','),
    uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../uploads'),
    tempPath: process.env.TEMP_PATH || path.join(os.tmpdir(), 'hostreamly')
  },

  // BunnyCDN Configuration
  bunny: {
    apiKey: process.env.BUNNY_API_KEY || '',
    storageZone: process.env.BUNNY_STORAGE_ZONE || '',
    pullZone: process.env.BUNNY_PULL_ZONE || '',
    streamLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '',
    streamApiKey: process.env.BUNNY_STREAM_API_KEY || '',
    baseUrl: process.env.BUNNY_BASE_URL || 'https://storage.bunnycdn.com',
    streamBaseUrl: process.env.BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com'
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@hostreamly.com'
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 60000, // 1 minute
    alertThresholds: {
      cpu: parseFloat(process.env.CPU_ALERT_THRESHOLD) || 80,
      memory: parseFloat(process.env.MEMORY_ALERT_THRESHOLD) || 85,
      disk: parseFloat(process.env.DISK_ALERT_THRESHOLD) || 90,
      responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 5000
    },
    retentionDays: parseInt(process.env.METRICS_RETENTION_DAYS) || 30
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../logs/app.log'),
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
    path: process.env.BACKUP_PATH || path.join(__dirname, '../backups'),
    compression: process.env.BACKUP_COMPRESSION !== 'false'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    methods: (process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS').split(','),
    allowedHeaders: (process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization,X-Requested-With').split(',')
  },

  // Feature Flags
  features: {
    registration: process.env.FEATURE_REGISTRATION !== 'false',
    socialLogin: process.env.FEATURE_SOCIAL_LOGIN === 'true',
    twoFactorAuth: process.env.FEATURE_2FA === 'true',
    videoTranscoding: process.env.FEATURE_VIDEO_TRANSCODING !== 'false',
    liveStreaming: process.env.FEATURE_LIVE_STREAMING === 'true',
    analytics: process.env.FEATURE_ANALYTICS !== 'false'
  },

  // Performance Configuration
  performance: {
    compression: process.env.COMPRESSION_ENABLED !== 'false',
    cacheControl: process.env.CACHE_CONTROL || 'public, max-age=3600',
    staticMaxAge: parseInt(process.env.STATIC_MAX_AGE) || 86400000, // 1 day
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000 // 30 seconds
  }
};