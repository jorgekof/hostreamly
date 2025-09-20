// Test setup file
// This file is executed before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'hostreamly_test';
process.env.DB_USER = 'test';
process.env.DB_PASS = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.BUNNY_API_KEY = 'test-bunny-key';
process.env.BUNNY_LIBRARY_ID = 'test-library-id';

// Mock external services
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    isReady: true,
    isOpen: true
  }))
}));

// Mock database connection
jest.mock('sequelize', () => {
  const mockSequelize = {
    authenticate: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    sync: jest.fn(() => Promise.resolve()),
    addHook: jest.fn(),
    removeHook: jest.fn(),
    query: jest.fn(() => Promise.resolve([])),
    transaction: jest.fn(() => Promise.resolve({
      commit: jest.fn(),
      rollback: jest.fn()
    })),
    define: jest.fn(() => {
      const MockModel = function() {};
      MockModel.prototype = {
        comparePassword: jest.fn(() => Promise.resolve(true)),
        generatePasswordResetToken: jest.fn(() => 'mock-token'),
        save: jest.fn(() => Promise.resolve())
      };
      MockModel.findAll = jest.fn(() => Promise.resolve([]));
      MockModel.findOne = jest.fn(() => Promise.resolve(null));
      MockModel.create = jest.fn(() => Promise.resolve({}));
      MockModel.update = jest.fn(() => Promise.resolve([1]));
      MockModel.destroy = jest.fn(() => Promise.resolve(1));
      MockModel.belongsTo = jest.fn();
       MockModel.hasMany = jest.fn();
       MockModel.hasOne = jest.fn();
       MockModel.beforeCreate = jest.fn();
       MockModel.afterCreate = jest.fn();
       MockModel.beforeUpdate = jest.fn();
       MockModel.afterUpdate = jest.fn();
       MockModel.beforeDestroy = jest.fn();
       MockModel.afterDestroy = jest.fn();
       return MockModel;
    })
  };
  return {
    Sequelize: jest.fn(() => mockSequelize),
    DataTypes: {
      STRING: jest.fn((length) => ({ type: 'STRING', length })),
      INTEGER: jest.fn(() => ({ type: 'INTEGER' })),
      BOOLEAN: jest.fn(() => ({ type: 'BOOLEAN' })),
      TEXT: jest.fn(() => ({ type: 'TEXT' })),
      DATE: jest.fn(() => ({ type: 'DATE' })),
      UUID: jest.fn(() => ({ type: 'UUID' })),
      ENUM: jest.fn((...values) => ({ type: 'ENUM', values })),
      DECIMAL: jest.fn((precision, scale) => ({ type: 'DECIMAL', precision, scale })),
      BIGINT: {
        UNSIGNED: { type: 'BIGINT', unsigned: true }
      },
      UUIDV4: 'UUIDV4',
      NOW: 'NOW'
    }
  };
});

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4')
}));

// Mock WebhookService to prevent setInterval
jest.mock('../services/WebhookService', () => {
  return jest.fn().mockImplementation(() => ({
    processRetryQueue: jest.fn(),
    addToQueue: jest.fn(),
    sendWebhook: jest.fn(() => Promise.resolve())
  }));
});

// Increase timeout for async operations
jest.setTimeout(30000);

// Clean up after tests
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 100));
});