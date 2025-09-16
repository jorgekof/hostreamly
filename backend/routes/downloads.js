const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const downloadController = require('../controllers/downloadController');
const { authMiddleware: auth, optionalAuth, requireAdmin: adminMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for download operations
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 downloads per minute per IP
  message: {
    error: 'Download limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.ip
});

// Rate limiting for download link creation
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 link creations per minute per user
  message: {
    error: 'Download link creation limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

// Rate limiting for download link management
const managementLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 management operations per minute per user
  message: {
    error: 'Management operation limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * @swagger
 * components:
 *   schemas:
 *     DownloadLink:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Download link ID
 *         token:
 *           type: string
 *           description: Secure download token
 *         video_id:
 *           type: string
 *           format: uuid
 *           description: Associated video ID
 *         download_type:
 *           type: string
 *           enum: [original, transcoded, thumbnail, preview]
 *           description: Type of file to download
 *         quality:
 *           type: string
 *           description: Video quality (for transcoded downloads)
 *         format:
 *           type: string
 *           description: File format
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: When the link expires
 *         max_downloads:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: Maximum number of downloads allowed
 *         download_count:
 *           type: integer
 *           description: Current number of downloads
 *         status:
 *           type: string
 *           enum: [active, expired, disabled, exhausted]
 *           description: Current status of the download link
 *         requires_password:
 *           type: boolean
 *           description: Whether password is required
 *         requires_auth:
 *           type: boolean
 *           description: Whether authentication is required
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *     
 *     CreateDownloadLinkRequest:
 *       type: object
 *       required: [download_type]
 *       properties:
 *         download_type:
 *           type: string
 *           enum: [original, transcoded, thumbnail, preview]
 *           description: Type of file to download
 *         quality:
 *           type: string
 *           description: Video quality (required for transcoded type)
 *         format:
 *           type: string
 *           description: Preferred file format
 *         expires_in_hours:
 *           type: integer
 *           minimum: 1
 *           maximum: 8760
 *           default: 24
 *           description: Hours until expiration (max 1 year)
 *         max_downloads:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 1
 *           description: Maximum number of downloads
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Optional password protection
 *         ip_restrictions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of allowed IP addresses or CIDR blocks
 *         require_auth:
 *           type: boolean
 *           default: false
 *           description: Whether authentication is required
 *         notify_on_download:
 *           type: boolean
 *           default: true
 *           description: Whether to notify on download
 *         requester_email:
 *           type: string
 *           format: email
 *           description: Email of download requester
 *         requester_name:
 *           type: string
 *           description: Name of download requester
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Optional notes about the download link
 */

/**
 * @swagger
 * /api/downloads/videos/{videoId}/links:
 *   post:
 *     summary: Create a download link for a video
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDownloadLinkRequest'
 *     responses:
 *       201:
 *         description: Download link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DownloadLink'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Video not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/videos/:videoId/links',
  auth,
  createLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('download_type')
      .isIn(['original', 'transcoded', 'thumbnail', 'preview'])
      .withMessage('Invalid download type'),
    body('quality')
      .optional()
      .matches(/^(240p|360p|480p|720p|1080p|1440p|2160p)$/)
      .withMessage('Invalid quality format'),
    body('expires_in_hours')
      .optional()
      .isInt({ min: 1, max: 8760 })
      .withMessage('Expiration must be between 1 hour and 1 year'),
    body('max_downloads')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Max downloads must be between 1 and 100'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('ip_restrictions')
      .optional()
      .isArray()
      .withMessage('IP restrictions must be an array'),
    body('ip_restrictions.*')
      .optional()
      .matches(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/)
      .withMessage('Invalid IP address or CIDR format'),
    body('require_auth')
      .optional()
      .isBoolean()
      .withMessage('Require auth must be boolean'),
    body('notify_on_download')
      .optional()
      .isBoolean()
      .withMessage('Notify on download must be boolean'),
    body('requester_email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('requester_name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Requester name too long'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes too long')
  ],
  downloadController.createDownloadLink
);

/**
 * @swagger
 * /api/downloads/videos/{videoId}/links:
 *   get:
 *     summary: Get download links for a video
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, disabled, exhausted]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Download links retrieved successfully
 *       404:
 *         description: Video not found
 */
router.get('/videos/:videoId/links',
  auth,
  managementLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('status')
      .optional()
      .isIn(['active', 'expired', 'disabled', 'exhausted'])
      .withMessage('Invalid status filter')
  ],
  downloadController.getVideoDownloadLinks
);

/**
 * @swagger
 * /api/downloads/links:
 *   get:
 *     summary: Get user's download links
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, disabled, exhausted]
 *         description: Filter by status
 *       - in: query
 *         name: video_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by video ID
 *     responses:
 *       200:
 *         description: Download links retrieved successfully
 */
router.get('/links',
  auth,
  managementLimiter,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('status')
      .optional()
      .isIn(['active', 'expired', 'disabled', 'exhausted'])
      .withMessage('Invalid status filter'),
    query('video_id')
      .optional()
      .isUUID()
      .withMessage('Invalid video ID format')
  ],
  downloadController.getUserDownloadLinks
);

/**
 * @swagger
 * /api/downloads/links/{linkId}:
 *   put:
 *     summary: Update a download link
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Download link ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expires_in_hours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8760
 *                 description: Hours until expiration
 *               max_downloads:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Maximum downloads
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password (null to remove)
 *               ip_restrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IP restrictions
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *                 description: Link status
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Notes
 *     responses:
 *       200:
 *         description: Download link updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Download link not found
 */
router.put('/links/:linkId',
  auth,
  managementLimiter,
  [
    param('linkId')
      .isUUID()
      .withMessage('Invalid link ID format'),
    body('expires_in_hours')
      .optional()
      .isInt({ min: 1, max: 8760 })
      .withMessage('Expiration must be between 1 hour and 1 year'),
    body('max_downloads')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Max downloads must be between 1 and 100'),
    body('password')
      .optional({ nullable: true })
      .custom((value) => {
        if (value !== null && value !== undefined && value.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['active', 'disabled'])
      .withMessage('Status must be active or disabled'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes too long')
  ],
  downloadController.updateDownloadLink
);

/**
 * @swagger
 * /api/downloads/links/{linkId}:
 *   delete:
 *     summary: Delete a download link
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Download link ID
 *     responses:
 *       200:
 *         description: Download link deleted successfully
 *       404:
 *         description: Download link not found
 */
router.delete('/links/:linkId',
  auth,
  managementLimiter,
  [
    param('linkId')
      .isUUID()
      .withMessage('Invalid link ID format')
  ],
  downloadController.deleteDownloadLink
);

/**
 * @swagger
 * /api/downloads/{token}:
 *   get:
 *     summary: Get download link information
 *     tags: [Downloads]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Download token
 *     responses:
 *       200:
 *         description: Download link information
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
 *                     id:
 *                       type: string
 *                     video:
 *                       type: object
 *                     download_type:
 *                       type: string
 *                     expires_at:
 *                       type: string
 *                     max_downloads:
 *                       type: integer
 *                     download_count:
 *                       type: integer
 *                     requires_password:
 *                       type: boolean
 *                     requires_auth:
 *                       type: boolean
 *                     can_download:
 *                       type: boolean
 *                     remaining_downloads:
 *                       type: integer
 *       404:
 *         description: Download link not found
 */
router.get('/:token',
  optionalAuth,
  downloadLimiter,
  [
    param('token')
      .isLength({ min: 32 })
      .withMessage('Invalid token format')
  ],
  downloadController.getDownloadLinkInfo
);

/**
 * @swagger
 * /api/downloads/{token}:
 *   post:
 *     summary: Process download request
 *     tags: [Downloads]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Download token
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'true'
 *         description: Whether to redirect to file or return URL
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password if required
 *     responses:
 *       200:
 *         description: Download URL returned (if redirect=false)
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
 *                     download_url:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     remaining_downloads:
 *                       type: integer
 *       302:
 *         description: Redirect to download file (if redirect=true)
 *       401:
 *         description: Password or authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Download link not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/:token',
  optionalAuth,
  downloadLimiter,
  [
    param('token')
      .isLength({ min: 32 })
      .withMessage('Invalid token format'),
    body('password')
      .optional()
      .isString()
      .withMessage('Password must be a string')
  ],
  downloadController.processDownload
);

/**
 * @swagger
 * /api/downloads/admin/cleanup:
 *   post:
 *     summary: Cleanup expired download links (Admin only)
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 */
router.post('/admin/cleanup',
  auth,
  adminMiddleware,
  downloadController.cleanupExpiredLinks
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  logger.error('Download route error:', {
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