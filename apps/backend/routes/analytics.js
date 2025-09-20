const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for analytics tracking
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 tracking events per minute
  message: {
    error: 'Analytics tracking limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

// Rate limiting for analytics queries
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 analytics queries per minute
  message: {
    error: 'Analytics query limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * @swagger
 * components:
 *   schemas:
 *     VideoPlayEvent:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Unique session identifier
 *         clientId:
 *           type: string
 *           description: Google Analytics client ID
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         referrer:
 *           type: string
 *           description: Referrer URL
 *         playerConfig:
 *           type: object
 *           description: Player configuration settings
 *         duration:
 *           type: number
 *           description: Video duration in milliseconds
 *         quality:
 *           type: string
 *           enum: [auto, 240p, 360p, 480p, 720p, 1080p, 1440p, 2160p]
 *           default: auto
 *         bandwidth:
 *           type: number
 *           description: Bandwidth usage in bytes
 *     
 *     VideoProgressEvent:
 *       type: object
 *       required: [sessionId, progress, currentTime]
 *       properties:
 *         sessionId:
 *           type: string
 *         clientId:
 *           type: string
 *         progress:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Progress percentage (25, 50, 75, 100)
 *         currentTime:
 *           type: number
 *           minimum: 0
 *           description: Current playback time in seconds
 *     
 *     VideoCompleteEvent:
 *       type: object
 *       required: [sessionId, watchTime, totalDuration]
 *       properties:
 *         sessionId:
 *           type: string
 *         clientId:
 *           type: string
 *         watchTime:
 *           type: number
 *           minimum: 0
 *           description: Total watch time in seconds
 *         totalDuration:
 *           type: number
 *           minimum: 0
 *           description: Total video duration in seconds
 */

/**
 * @swagger
 * /api/analytics/track/video/{videoId}/play:
 *   post:
 *     summary: Track video play event
 *     tags: [Analytics]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VideoPlayEvent'
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/track/video/:videoId/play',
  optionalAuth,
  trackingLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required'),
    body('clientId')
      .optional()
      .isString()
      .withMessage('Client ID must be a string'),
    body('duration')
      .optional()
      .isNumeric()
      .withMessage('Duration must be a number'),
    body('quality')
      .optional()
      .isIn(['auto', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'])
      .withMessage('Invalid quality setting'),
    body('bandwidth')
      .optional()
      .isNumeric()
      .withMessage('Bandwidth must be a number')
  ],
  analyticsController.trackVideoPlay
);

/**
 * @swagger
 * /api/analytics/track/video/{videoId}/progress:
 *   post:
 *     summary: Track video progress milestone
 *     tags: [Analytics]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VideoProgressEvent'
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *       400:
 *         description: Validation error
 */
router.post('/track/video/:videoId/progress',
  optionalAuth,
  trackingLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required'),
    body('progress')
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress must be between 0 and 100'),
    body('currentTime')
      .isFloat({ min: 0 })
      .withMessage('Current time must be a positive number')
  ],
  analyticsController.trackVideoProgress
);

/**
 * @swagger
 * /api/analytics/track/video/{videoId}/complete:
 *   post:
 *     summary: Track video completion event
 *     tags: [Analytics]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VideoCompleteEvent'
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *       400:
 *         description: Validation error
 */
router.post('/track/video/:videoId/complete',
  optionalAuth,
  trackingLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required'),
    body('watchTime')
      .isFloat({ min: 0 })
      .withMessage('Watch time must be a positive number'),
    body('totalDuration')
      .isFloat({ min: 0 })
      .withMessage('Total duration must be a positive number')
  ],
  analyticsController.trackVideoComplete
);

/**
 * @swagger
 * /api/analytics/track/video/{videoId}/embed:
 *   post:
 *     summary: Track embed view event
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [embedToken, domain]
 *             properties:
 *               embedToken:
 *                 type: string
 *                 description: Embed token
 *               domain:
 *                 type: string
 *                 description: Domain where video is embedded
 *               referrer:
 *                 type: string
 *                 description: Referrer URL
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *       400:
 *         description: Validation error
 */
router.post('/track/video/:videoId/embed',
  trackingLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('embedToken')
      .notEmpty()
      .withMessage('Embed token is required'),
    body('domain')
      .notEmpty()
      .withMessage('Domain is required'),
    body('referrer')
      .optional()
      .isURL()
      .withMessage('Invalid referrer URL')
  ],
  analyticsController.trackEmbedView
);

/**
 * @swagger
 * /api/analytics/track/video/{videoId}/upload:
 *   post:
 *     summary: Track video upload event
 *     tags: [Analytics]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileSize, duration, format]
 *             properties:
 *               fileSize:
 *                 type: number
 *                 minimum: 0
 *                 description: File size in bytes
 *               duration:
 *                 type: number
 *                 minimum: 0
 *                 description: Video duration in seconds
 *               format:
 *                 type: string
 *                 description: Video format (mp4, webm, etc.)
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *       400:
 *         description: Validation error
 */
router.post('/track/video/:videoId/upload',
  auth,
  trackingLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    body('fileSize')
      .isNumeric()
      .withMessage('File size must be a number'),
    body('duration')
      .isNumeric()
      .withMessage('Duration must be a number'),
    body('format')
      .notEmpty()
      .withMessage('Format is required')
  ],
  analyticsController.trackVideoUpload
);

/**
 * @swagger
 * /api/analytics/video/{videoId}:
 *   get:
 *     summary: Get video analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Group analytics by time period
 *     responses:
 *       200:
 *         description: Video analytics data
 *       400:
 *         description: Validation error
 *       404:
 *         description: Video not found
 */
router.get('/video/:videoId',
  auth,
  queryLimiter,
  [
    param('videoId')
      .isUUID()
      .withMessage('Invalid video ID format'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('groupBy')
      .optional()
      .isIn(['hour', 'day', 'week', 'month'])
      .withMessage('Invalid groupBy value')
  ],
  analyticsController.getVideoAnalytics
);

/**
 * @swagger
 * /api/analytics/user:
 *   get:
 *     summary: Get user analytics summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: User analytics data
 *       400:
 *         description: Validation error
 */
router.get('/user',
  auth,
  queryLimiter,
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
  ],
  analyticsController.getUserAnalytics
);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *       400:
 *         description: Validation error
 */
router.get('/dashboard',
  auth,
  queryLimiter,
  [
    query('period')
      .optional()
      .isIn(['24h', '7d', '30d', '90d'])
      .withMessage('Invalid period. Must be 24h, 7d, 30d, or 90d')
  ],
  analyticsController.getDashboardAnalytics
);

/**
 * @swagger
 * /api/analytics/google-analytics/status:
 *   get:
 *     summary: Get Google Analytics configuration status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google Analytics status
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
 *                     enabled:
 *                       type: boolean
 *                     configuration:
 *                       type: object
 *                       properties:
 *                         trackingId:
 *                           type: boolean
 *                         measurementId:
 *                           type: boolean
 *                         apiSecret:
 *                           type: boolean
 *                     status:
 *                       type: string
 *                       enum: [configured, not_configured]
 */
router.get('/google-analytics/status',
  auth,
  analyticsController.getGAStatus
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  logger.error('Analytics route error:', {
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