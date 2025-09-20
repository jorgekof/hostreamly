const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  generateApiKey,
  getApiKeys,
  updateApiKey,
  deleteApiKey,
  getApiKeyStats,
  apiKeyRateLimit,
  validateApiKeyGeneration,
  validateApiKeyUpdate
} = require('../controllers/apiKeyController');

/**
 * API Keys Routes
 * 
 * Provides endpoints for managing API keys used for
 * third-party integrations and embed functionality
 */

/**
 * @route   POST /api/api-keys
 * @desc    Generate new API key
 * @access  Private
 * @body    { name?, permissions?, expiresIn? }
 */
router.post('/',
  apiKeyRateLimit,
  authMiddleware,
  validateApiKeyGeneration,
  generateApiKey
);

/**
 * @route   GET /api/api-keys
 * @desc    Get user's API keys
 * @access  Private
 */
router.get('/',
  authMiddleware,
  getApiKeys
);

/**
 * @route   PUT /api/api-keys/:keyId
 * @desc    Update API key
 * @access  Private
 * @body    { name?, permissions?, isActive? }
 */
router.put('/:keyId',
  authMiddleware,
  validateApiKeyUpdate,
  updateApiKey
);

/**
 * @route   DELETE /api/api-keys/:keyId
 * @desc    Delete API key
 * @access  Private
 */
router.delete('/:keyId',
  authMiddleware,
  deleteApiKey
);

/**
 * @route   GET /api/api-keys/:keyId/stats
 * @desc    Get API key usage statistics
 * @access  Private
 */
router.get('/:keyId/stats',
  authMiddleware,
  getApiKeyStats
);

/**
 * @route   GET /api/api-keys/permissions
 * @desc    Get available permissions
 * @access  Private
 */
router.get('/permissions',
  authMiddleware,
  (req, res) => {
    const permissions = {
      'embed:read': 'Read embed codes and player configurations',
      'embed:write': 'Generate and modify embed codes',
      'video:read': 'Access video information and metadata',
      'video:write': 'Upload and modify videos',
      'analytics:read': 'Access video analytics and statistics',
      'thumbnail:read': 'Access video thumbnails',
      'thumbnail:write': 'Upload and modify video thumbnails'
    };

    res.json({
      success: true,
      data: {
        permissions,
        categories: {
          embed: ['embed:read', 'embed:write'],
          video: ['video:read', 'video:write'],
          analytics: ['analytics:read'],
          thumbnail: ['thumbnail:read', 'thumbnail:write']
        }
      }
    });
  }
);

/**
 * @route   POST /api/api-keys/test
 * @desc    Test API key functionality
 * @access  Private
 */
router.post('/test',
  authMiddleware,
  async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: 'API key is required'
        });
      }

      // Test the API key
      const { validateApiKey } = require('../controllers/apiKeyController');
      const keyData = await validateApiKey(apiKey);

      if (!keyData) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired API key'
        });
      }

      res.json({
        success: true,
        message: 'API key is valid',
        data: {
          keyId: keyData.id,
          name: keyData.name,
          permissions: keyData.permissions,
          userId: keyData.userId
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to test API key'
      });
    }
  }
);

module.exports = router;