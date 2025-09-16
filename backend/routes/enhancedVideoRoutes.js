const express = require('express');
const router = express.Router();
const enhancedVideoController = require('../controllers/enhancedVideoController');
const { authMiddleware: auth } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

/**
 * Enhanced Video Routes for Commercial Video Hosting
 * 
 * Features:
 * - Direct upload to Bunny Stream
 * - Real-time analytics
 * - Plan limits enforcement
 * - Rate limiting for API protection
 */

// Rate limiting configurations
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const analyticsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 analytics requests per minute
  message: {
    success: false,
    message: 'Too many analytics requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const viewTrackingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more frequent view tracking
  message: {
    success: false,
    message: 'Too many view tracking requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const validateVideoCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
        throw new Error('Each tag must be a string with maximum 50 characters');
      }
      return true;
    }),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('thumbnailTime')
    .optional()
    .isInt({ min: 0, max: 3600000 })
    .withMessage('thumbnailTime must be between 0 and 3600000 milliseconds')
];

const validateVideoView = [
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  body('quality')
    .optional()
    .isIn(['auto', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'])
    .withMessage('Invalid quality setting'),
  body('bandwidth')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bandwidth must be a positive integer'),
  body('country')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country must be a 2-letter country code')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['all', 'processing', 'ready', 'failed', 'uploading'])
    .withMessage('Invalid status filter'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must not exceed 255 characters')
];

const validateVideoId = [
  param('videoId')
    .isUUID(4)
    .withMessage('Invalid video ID format')
];

const validateDateRange = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 date')
];

// Routes

/**
 * @route   POST /api/enhanced-videos/create
 * @desc    Create a new video and get pre-signed upload URL
 * @access  Private
 */
router.post('/create',
  uploadRateLimit,
  auth,
  validateVideoCreation,
  enhancedVideoController.createVideoUpload
);

/**
 * @route   POST /api/enhanced-videos/webhook/upload
 * @desc    Handle upload completion webhook from Bunny Stream
 * @access  Public (with webhook validation)
 */
router.post('/webhook/upload',
  enhancedVideoController.handleUploadWebhook
);

/**
 * @route   GET /api/enhanced-videos/:videoId
 * @desc    Get video details with secure playback URL
 * @access  Private
 */
router.get('/:videoId',
  auth,
  validateVideoId,
  enhancedVideoController.getVideo
);

/**
 * @route   POST /api/enhanced-videos/:videoId/view
 * @desc    Track video view for analytics
 * @access  Public (can be anonymous)
 */
router.post('/:videoId/view',
  viewTrackingRateLimit,
  validateVideoId,
  validateVideoView,
  enhancedVideoController.trackVideoView
);

/**
 * @route   GET /api/enhanced-videos/:videoId/analytics
 * @desc    Get analytics for a specific video
 * @access  Private (video owner only)
 */
router.get('/:videoId/analytics',
  analyticsRateLimit,
  auth,
  validateVideoId,
  enhancedVideoController.getVideoAnalytics
);

/**
 * @route   DELETE /api/enhanced-videos/:videoId
 * @desc    Delete a video
 * @access  Private (video owner only)
 */
router.delete('/:videoId',
  auth,
  validateVideoId,
  enhancedVideoController.deleteVideo
);

/**
 * @route   GET /api/enhanced-videos
 * @desc    Get user's videos with pagination and filtering
 * @access  Private
 */
router.get('/',
  auth,
  validatePagination,
  enhancedVideoController.getUserVideos
);

/**
 * @route   GET /api/enhanced-videos/analytics/dashboard
 * @desc    Get user analytics dashboard
 * @access  Private
 */
router.get('/analytics/dashboard',
  analyticsRateLimit,
  auth,
  validateDateRange,
  enhancedVideoController.getUserAnalytics
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  const logger = require('../utils/logger');
  
  logger.error('Enhanced video route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error in video processing',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;