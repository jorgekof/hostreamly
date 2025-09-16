const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const embedController = require('../controllers/embedController');
const { authMiddleware: auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const { validateCustomCSS, validateSecureUrl, createSmartRateLimit, validationHandler } = require('../middleware/validation');

const router = express.Router();

// Rate limiting for embed generation
const embedLimiter = createSmartRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 embed generations per minute
  message: {
    error: 'Embed generation limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

// Rate limiting for embed views (more permissive)
const embedViewLimiter = createSmartRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 embed views per minute
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.ip
});

// Rate limiting for embed management
const embedManagementLimiter = createSmartRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 management operations per minute
  message: {
    error: 'Embed management limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * @swagger
 * components:
 *   schemas:
 *     EmbedConfig:
 *       type: object
 *       properties:
 *         width:
 *           type: integer
 *           minimum: 200
 *           maximum: 1920
 *           default: 640
 *         height:
 *           type: integer
 *           minimum: 150
 *           maximum: 1080
 *           default: 360
 *         autoplay:
 *           type: boolean
 *           default: false
 *         controls:
 *           type: boolean
 *           default: true
 *         muted:
 *           type: boolean
 *           default: false
 *         loop:
 *           type: boolean
 *           default: false
 *         responsive:
 *           type: boolean
 *           default: true
 *         showTitle:
 *           type: boolean
 *           default: true
 *         showDescription:
 *           type: boolean
 *           default: false
 *         customCSS:
 *           type: string
 *           maxLength: 10000
 *         domainProtectionEnabled:
 *           type: boolean
 *           default: false
 *         domainProtectionType:
 *           type: string
 *           enum: [whitelist, blacklist]
 *           default: whitelist
 *         allowedDomains:
 *           type: array
 *           items:
 *             type: string
 *           example: ["example.com", ".mydomain.com", "localhost"]
 *         requireReferrer:
 *           type: boolean
 *           default: true
 *         allowApiAccess:
 *           type: boolean
 *           default: false
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/embed/{videoId}/generate:
 *   post:
 *     summary: Generate embed code for a video with domain protection
 *     tags: [Embed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmbedConfig'
 *     responses:
 *       200:
 *         description: Embed code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     embedToken:
 *                       type: string
 *                     embedUrl:
 *                       type: string
 *                     shareUrl:
 *                       type: string
 *                     codes:
 *                       type: object
 *                       properties:
 *                         iframe:
 *                           type: string
 *                         responsive:
 *                           type: string
 *                         javascript:
 *                           type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: Video not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/:videoId/generate',
  auth,
  embedLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('width')
      .optional()
      .isInt({ min: 200, max: 1920 })
      .withMessage('Width must be between 200 and 1920 pixels'),
    body('height')
      .optional()
      .isInt({ min: 150, max: 1080 })
      .withMessage('Height must be between 150 and 1080 pixels'),
    body('autoplay')
      .optional()
      .isBoolean()
      .withMessage('Autoplay must be a boolean'),
    body('controls')
      .optional()
      .isBoolean()
      .withMessage('Controls must be a boolean'),
    body('muted')
      .optional()
      .isBoolean()
      .withMessage('Muted must be a boolean'),
    body('loop')
      .optional()
      .isBoolean()
      .withMessage('Loop must be a boolean'),
    body('responsive')
      .optional()
      .isBoolean()
      .withMessage('Responsive must be a boolean'),
    body('showTitle')
      .optional()
      .isBoolean()
      .withMessage('Show title must be a boolean'),
    body('showDescription')
      .optional()
      .isBoolean()
      .withMessage('Show description must be a boolean'),
    body('customCSS')
      .optional()
      .isLength({ max: 10000 })
      .custom(validateCustomCSS)
      .withMessage('Custom CSS must not exceed 10,000 characters and be safe'),
    body('domainProtectionEnabled')
      .optional()
      .isBoolean()
      .withMessage('Domain protection enabled must be a boolean'),
    body('domainProtectionType')
      .optional()
      .isIn(['whitelist', 'blacklist'])
      .withMessage('Domain protection type must be whitelist or blacklist'),
    body('allowedDomains')
      .optional()
      .isArray()
      .withMessage('Allowed domains must be an array')
      .custom((domains) => {
        if (!Array.isArray(domains)) return true;
        return domains.every(domain => {
          if (typeof domain !== 'string' || domain.length === 0 || domain.length > 253) {
            return false;
          }
          try {
            validateSecureUrl(`https://${domain.replace(/^https?:\/\//, '')}`);
            return true;
          } catch {
            return false;
          }
        });
      })
      .withMessage('Each domain must be a valid and secure domain'),
    body('requireReferrer')
      .optional()
      .isBoolean()
      .withMessage('Require referrer must be a boolean'),
    body('allowApiAccess')
      .optional()
      .isBoolean()
      .withMessage('Allow API access must be a boolean'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expires at must be a valid ISO 8601 date')
      .custom((value) => {
        if (!value) return true;
        const expiryDate = new Date(value);
        const now = new Date();
        return expiryDate > now;
      })
      .withMessage('Expiry date must be in the future')
  ],
  validationHandler,
  embedController.generateEmbedCode
);

/**
 * @swagger
 * /api/embed/{token}:
 *   get:
 *     summary: Get embed player with domain validation
 *     tags: [Embed]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Embed token
 *     responses:
 *       200:
 *         description: Embed player data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       type: object
 *                     config:
 *                       type: object
 *                     playerHTML:
 *                       type: string
 *       403:
 *         description: Domain not authorized
 *       404:
 *         description: Embed not found
 *       410:
 *         description: Embed expired
 */
router.get('/:token',
  embedViewLimiter,
  [
    param('token')
      .isLength({ min: 32, max: 128 })
      .withMessage('Invalid embed token format')
  ],
  validationHandler,
  embedController.getEmbedPlayer
);

/**
 * @swagger
 * /api/embed/configs:
 *   get:
 *     summary: Get user's embed configurations
 *     tags: [Embed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: videoId
 *         schema:
 *           type: string
 *         description: Filter by video ID
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of embed configurations
 */
router.get('/configs',
  auth,
  embedManagementLimiter,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('videoId')
      .optional()
      .isUUID()
      .withMessage('Invalid video ID format'),
    query('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean')
  ],
  validationHandler,
  embedController.getEmbedConfigs
);

/**
 * @swagger
 * /api/embed/configs/{configId}:
 *   put:
 *     summary: Update embed configuration
 *     tags: [Embed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: Embed configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmbedConfig'
 *     responses:
 *       200:
 *         description: Embed configuration updated
 *       404:
 *         description: Configuration not found
 */
router.put('/configs/:configId',
  auth,
  embedManagementLimiter,
  [
    param('configId')
      .isUUID()
      .withMessage('Invalid configuration ID format'),
    body('width')
      .optional()
      .isInt({ min: 200, max: 1920 })
      .withMessage('Width must be between 200 and 1920 pixels'),
    body('height')
      .optional()
      .isInt({ min: 150, max: 1080 })
      .withMessage('Height must be between 150 and 1080 pixels'),
    body('domainProtectionEnabled')
      .optional()
      .isBoolean()
      .withMessage('Domain protection enabled must be a boolean'),
    body('domainProtectionType')
      .optional()
      .isIn(['whitelist', 'blacklist'])
      .withMessage('Domain protection type must be whitelist or blacklist'),
    body('allowedDomains')
      .optional()
      .isArray()
      .withMessage('Allowed domains must be an array'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean')
  ],
  validationHandler,
  embedController.updateEmbedConfig
);

/**
 * @swagger
 * /api/embed/configs/{configId}:
 *   delete:
 *     summary: Delete embed configuration
 *     tags: [Embed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: Embed configuration ID
 *     responses:
 *       200:
 *         description: Configuration deleted
 *       404:
 *         description: Configuration not found
 */
router.delete('/configs/:configId',
  auth,
  embedManagementLimiter,
  [
    param('configId')
      .isUUID()
      .withMessage('Invalid configuration ID format')
  ],
  validationHandler,
  embedController.deleteEmbedConfig
);

/**
 * @swagger
 * /api/embed/cleanup/expired:
 *   post:
 *     summary: Cleanup expired embed configurations (admin only)
 *     tags: [Embed]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed
 *       403:
 *         description: Admin access required
 */
router.post('/cleanup/expired',
  auth,
  // TODO: Add admin middleware
  embedController.cleanupExpiredEmbeds
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  logger.error('Embed route error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;