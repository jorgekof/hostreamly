const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey'); // We'll need to create this model

/**
 * API Key Controller
 * 
 * Handles API key generation, management, and authentication
 * for third-party integrations and embed functionality
 */

/**
 * Rate limiting for API key operations
 */
const apiKeyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many API key requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Generate new API key
 */
const generateApiKey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, permissions, expiresIn } = req.body;
    const userId = req.user.id;

    // Check user's plan limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check API key limits based on plan
    const existingKeys = await getApiKeysByUser(userId);
    const planLimits = {
      basic: 2,
      pro: 10,
      enterprise: 50
    };

    const maxKeys = planLimits[user.plan] || planLimits.basic;
    if (existingKeys.length >= maxKeys) {
      return res.status(403).json({
        success: false,
        message: `API key limit reached for ${user.plan} plan (${maxKeys} keys max)`
      });
    }

    // Generate secure API key
    const keyPrefix = 'hst_'; // Hostreamly prefix
    const keyBody = crypto.randomBytes(32).toString('hex');
    const apiKey = keyPrefix + keyBody;

    // Hash the key for storage
    const hashedKey = await bcrypt.hash(apiKey, 12);

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn && expiresIn !== 'never') {
      const days = parseInt(expiresIn);
      if (days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    }

    // Create API key record
    const apiKeyData = {
      userId,
      name: name || 'Unnamed API Key',
      keyHash: hashedKey,
      keyPrefix: keyPrefix + keyBody.substring(0, 8) + '...', // For display
      permissions: permissions || ['embed:read', 'video:read'],
      expiresAt,
      lastUsedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database (mock for now)
    const savedKey = await saveApiKey(apiKeyData);

    // Log API key creation
    logger.info('API key created', {
      userId,
      keyId: savedKey.id,
      name: apiKeyData.name,
      permissions: apiKeyData.permissions
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: savedKey.id,
        name: apiKeyData.name,
        key: apiKey, // Only returned once!
        keyPrefix: apiKeyData.keyPrefix,
        permissions: apiKeyData.permissions,
        expiresAt: apiKeyData.expiresAt,
        createdAt: apiKeyData.createdAt,
        warning: 'Store this key securely. It will not be shown again.'
      }
    });

  } catch (error) {
    logger.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  }
};

/**
 * Get user's API keys
 */
const getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeys = await getApiKeysByUser(userId);

    // Remove sensitive data
    const safeKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
      createdAt: key.createdAt,
      usageCount: key.usageCount || 0
    }));

    res.json({
      success: true,
      data: {
        apiKeys: safeKeys,
        total: safeKeys.length
      }
    });

  } catch (error) {
    logger.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys'
    });
  }
};

/**
 * Update API key
 */
const updateApiKey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { keyId } = req.params;
    const { name, permissions, isActive } = req.body;
    const userId = req.user.id;

    // Find and verify ownership
    const apiKey = await getApiKeyById(keyId, userId);
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Update fields
    const updates = {
      updatedAt: new Date()
    };

    if (name !== undefined) updates.name = name;
    if (permissions !== undefined) updates.permissions = permissions;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedKey = await updateApiKeyById(keyId, updates);

    logger.info('API key updated', {
      userId,
      keyId,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        id: updatedKey.id,
        name: updatedKey.name,
        keyPrefix: updatedKey.keyPrefix,
        permissions: updatedKey.permissions,
        isActive: updatedKey.isActive,
        updatedAt: updatedKey.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key'
    });
  }
};

/**
 * Delete API key
 */
const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.id;

    // Find and verify ownership
    const apiKey = await getApiKeyById(keyId, userId);
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await deleteApiKeyById(keyId);

    logger.info('API key deleted', {
      userId,
      keyId,
      keyName: apiKey.name
    });

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key'
    });
  }
};

/**
 * Validate API key (for middleware)
 */
const validateApiKey = async (apiKey) => {
  try {
    if (!apiKey || !apiKey.startsWith('hst_')) {
      return null;
    }

    // Get all active API keys (in production, this would be optimized)
    const allKeys = await getAllActiveApiKeys();
    
    for (const keyRecord of allKeys) {
      const isValid = await bcrypt.compare(apiKey, keyRecord.keyHash);
      
      if (isValid) {
        // Check expiration
        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
          return null;
        }

        // Update last used
        await updateApiKeyUsage(keyRecord.id);

        return {
          id: keyRecord.id,
          userId: keyRecord.userId,
          permissions: keyRecord.permissions,
          name: keyRecord.name
        };
      }
    }

    return null;

  } catch (error) {
    logger.error('Error validating API key:', error);
    return null;
  }
};

/**
 * Get API key usage statistics
 */
const getApiKeyStats = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const apiKey = await getApiKeyById(keyId, userId);
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Get usage statistics (mock data for now)
    const stats = {
      totalRequests: apiKey.usageCount || 0,
      lastUsedAt: apiKey.lastUsedAt,
      requestsToday: 0,
      requestsThisWeek: 0,
      requestsThisMonth: 0,
      topEndpoints: [
        { endpoint: '/api/embed/generate', count: 45 },
        { endpoint: '/api/embed/player', count: 23 },
        { endpoint: '/api/videos', count: 12 }
      ],
      errorRate: 0.02
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching API key stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API key statistics'
    });
  }
};

// Mock database functions (replace with actual database operations)
async function saveApiKey(apiKeyData) {
  // Mock implementation
  return {
    id: crypto.randomUUID(),
    ...apiKeyData
  };
}

async function getApiKeysByUser(userId) {
  // Mock implementation
  return [];
}

async function getApiKeyById(keyId, userId) {
  // Mock implementation
  return null;
}

async function updateApiKeyById(keyId, updates) {
  // Mock implementation
  return { id: keyId, ...updates };
}

async function deleteApiKeyById(keyId) {
  // Mock implementation
  return true;
}

async function getAllActiveApiKeys() {
  // Mock implementation
  return [];
}

async function updateApiKeyUsage(keyId) {
  // Mock implementation
  return true;
}

// Validation middleware
const validateApiKeyGeneration = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      const validPermissions = [
        'embed:read', 'embed:write',
        'video:read', 'video:write',
        'analytics:read',
        'thumbnail:read', 'thumbnail:write'
      ];
      
      for (const permission of permissions) {
        if (!validPermissions.includes(permission)) {
          throw new Error(`Invalid permission: ${permission}`);
        }
      }
      return true;
    }),
  body('expiresIn')
    .optional()
    .custom((value) => {
      if (value === 'never') return true;
      const days = parseInt(value);
      if (isNaN(days) || days < 1 || days > 365) {
        throw new Error('expiresIn must be "never" or a number between 1 and 365');
      }
      return true;
    })
];

const validateApiKeyUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

module.exports = {
  generateApiKey,
  getApiKeys,
  updateApiKey,
  deleteApiKey,
  validateApiKey,
  getApiKeyStats,
  apiKeyRateLimit,
  validateApiKeyGeneration,
  validateApiKeyUpdate
};