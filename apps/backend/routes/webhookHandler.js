const express = require('express');
const router = express.Router();
const webhookHandlerController = require('../controllers/webhookHandlerController');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

/**
 * Webhook Handler Routes
 * 
 * Rutas para manejar webhooks entrantes de servicios externos
 * y disparar webhooks salientes a los usuarios
 */

// Rate limiting para webhooks
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto
  message: {
    success: false,
    message: 'Too many webhook requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting más estricto para webhooks de prueba
const testWebhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por minuto
  message: {
    success: false,
    message: 'Too many test webhook requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/webhook-handler/bunny/stream:
 *   post:
 *     summary: Handle Bunny Stream webhook
 *     description: Receives webhooks from Bunny Stream for video processing events
 *     tags: [Webhook Handler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoId
 *               - userId
 *               - status
 *             properties:
 *               videoId:
 *                 type: string
 *                 description: ID of the video
 *               userId:
 *                 type: string
 *                 description: ID of the user who owns the video
 *               status:
 *                 type: string
 *                 enum: [processed, ready, failed, error]
 *                 description: Processing status
 *               processingTime:
 *                 type: number
 *                 description: Time taken to process the video (in seconds)
 *               qualities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available video qualities
 *               error:
 *                 type: string
 *                 description: Error message if processing failed
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/bunny/stream', webhookRateLimit, webhookHandlerController.handleBunnyStreamWebhook);

/**
 * @swagger
 * /api/webhook-handler/analytics/milestone:
 *   post:
 *     summary: Handle analytics milestone webhook
 *     description: Receives webhooks for analytics milestones (views, watch time, etc.)
 *     tags: [Webhook Handler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - videoId
 *               - milestoneType
 *               - milestoneValue
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               videoId:
 *                 type: string
 *                 description: ID of the video
 *               milestoneType:
 *                 type: string
 *                 enum: [views, watch_time, shares, downloads]
 *                 description: Type of milestone reached
 *               milestoneValue:
 *                 type: number
 *                 description: Milestone value (e.g., 1000 views)
 *     responses:
 *       200:
 *         description: Milestone webhook processed successfully
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/analytics/milestone', webhookRateLimit, webhookHandlerController.handleAnalyticsMilestone);

/**
 * @swagger
 * /api/webhook-handler/storage/limit:
 *   post:
 *     summary: Handle storage limit webhook
 *     description: Receives webhooks when storage limits are approached or exceeded
 *     tags: [Webhook Handler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - currentUsage
 *               - limit
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               currentUsage:
 *                 type: number
 *                 description: Current storage usage in bytes
 *               limit:
 *                 type: number
 *                 description: Storage limit in bytes
 *               percentage:
 *                 type: number
 *                 description: Percentage of storage used
 *     responses:
 *       200:
 *         description: Storage limit webhook processed successfully
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/storage/limit', webhookRateLimit, webhookHandlerController.handleStorageLimit);

/**
 * @swagger
 * /api/webhook-handler/livestream/{event}:
 *   post:
 *     summary: Handle livestream event webhook
 *     description: Receives webhooks for livestream events (started, ended, recorded)
 *     tags: [Webhook Handler]
 *     parameters:
 *       - in: path
 *         name: event
 *         required: true
 *         schema:
 *           type: string
 *           enum: [started, ended, recorded]
 *         description: Type of livestream event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - streamId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               streamId:
 *                 type: string
 *                 description: ID of the livestream
 *               title:
 *                 type: string
 *                 description: Title of the livestream
 *               duration:
 *                 type: number
 *                 description: Duration of the stream in seconds
 *               peakViewers:
 *                 type: number
 *                 description: Peak number of concurrent viewers
 *               recordingId:
 *                 type: string
 *                 description: ID of the recording (for recorded event)
 *     responses:
 *       200:
 *         description: Livestream webhook processed successfully
 *       400:
 *         description: Bad request - missing required fields or unknown event
 *       500:
 *         description: Internal server error
 */
router.post('/livestream/:event', webhookRateLimit, webhookHandlerController.handleLivestreamEvent);

/**
 * @swagger
 * /api/webhook-handler/test:
 *   post:
 *     summary: Test webhook trigger
 *     description: Triggers a test webhook for debugging purposes
 *     tags: [Webhook Handler]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - eventType
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               eventType:
 *                 type: string
 *                 description: Type of event to test
 *                 example: video.created
 *               eventData:
 *                 type: object
 *                 description: Additional data for the test event
 *     responses:
 *       200:
 *         description: Test webhook triggered successfully
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
 *                   type: object
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/test', testWebhookRateLimit, authMiddleware, webhookHandlerController.testWebhook);

/**
 * @swagger
 * /api/webhook-handler/stats/{userId}:
 *   get:
 *     summary: Get webhook statistics
 *     description: Retrieves webhook delivery statistics for a user
 *     tags: [Webhook Handler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: webhookId
 *         schema:
 *           type: string
 *         description: Optional webhook ID to filter stats
 *     responses:
 *       200:
 *         description: Webhook statistics retrieved successfully
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
 *                     total_deliveries:
 *                       type: number
 *                     successful_deliveries:
 *                       type: number
 *                     failed_deliveries:
 *                       type: number
 *                     success_rate:
 *                       type: number
 *                     average_response_time:
 *                       type: number
 *                     last_delivery:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing userId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats/:userId', authMiddleware, webhookHandlerController.getWebhookStats);

// Middleware para manejar errores de JSON parsing
router.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }
  next(error);
});

module.exports = router;