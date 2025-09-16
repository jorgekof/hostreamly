const express = require('express');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const webhooksController = require('../controllers/webhooksController');
const { authMiddleware } = require('../middleware/auth');
const { requirePlan } = require('../middleware/planAuth');

const router = express.Router();

// Rate limiting for webhook operations
const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many webhook requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limit for webhook creation/updates
const webhookModifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many webhook modification requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const validateWebhookCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('url')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL must be a valid HTTP/HTTPS URL'),
  
  body('events')
    .isArray({ min: 1 })
    .withMessage('Events must be a non-empty array')
    .custom((events) => {
      const validEvents = [
        'video.created', 'video.updated', 'video.deleted', 'video.processed',
        'video.encoding.started', 'video.encoding.completed', 'video.encoding.failed',
        'livestream.started', 'livestream.ended', 'livestream.recorded',
        'analytics.milestone', 'user.plan.changed', 'storage.limit.reached'
      ];
      
      for (const event of events) {
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid event: ${event}`);
        }
      }
      return true;
    }),
  
  body('secret')
    .optional()
    .isLength({ min: 8, max: 256 })
    .withMessage('Secret must be between 8 and 256 characters'),
  
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object')
    .custom((headers) => {
      // Validate header names and values
      for (const [key, value] of Object.entries(headers)) {
        if (typeof key !== 'string' || key.length === 0) {
          throw new Error('Header names must be non-empty strings');
        }
        if (typeof value !== 'string') {
          throw new Error('Header values must be strings');
        }
        // Prevent overriding critical headers
        const forbiddenHeaders = ['content-type', 'user-agent', 'x-webhook-timestamp', 'x-webhook-id', 'x-webhook-signature'];
        if (forbiddenHeaders.includes(key.toLowerCase())) {
          throw new Error(`Cannot override system header: ${key}`);
        }
      }
      return true;
    })
];

const validateWebhookUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL must be a valid HTTP/HTTPS URL'),
  
  body('events')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Events must be a non-empty array')
    .custom((events) => {
      if (!events) return true; // Optional field
      
      const validEvents = [
        'video.created', 'video.updated', 'video.deleted', 'video.processed',
        'video.encoding.started', 'video.encoding.completed', 'video.encoding.failed',
        'livestream.started', 'livestream.ended', 'livestream.recorded',
        'analytics.milestone', 'user.plan.changed', 'storage.limit.reached'
      ];
      
      for (const event of events) {
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid event: ${event}`);
        }
      }
      return true;
    }),
  
  body('secret')
    .optional()
    .isLength({ min: 8, max: 256 })
    .withMessage('Secret must be between 8 and 256 characters'),
  
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object')
    .custom((headers) => {
      if (!headers) return true; // Optional field
      
      for (const [key, value] of Object.entries(headers)) {
        if (typeof key !== 'string' || key.length === 0) {
          throw new Error('Header names must be non-empty strings');
        }
        if (typeof value !== 'string') {
          throw new Error('Header values must be strings');
        }
        const forbiddenHeaders = ['content-type', 'user-agent', 'x-webhook-timestamp', 'x-webhook-id', 'x-webhook-signature'];
        if (forbiddenHeaders.includes(key.toLowerCase())) {
          throw new Error(`Cannot override system header: ${key}`);
        }
      }
      return true;
    }),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

const validateWebhookId = [
  param('id')
    .isUUID()
    .withMessage('Invalid webhook ID format')
];

const validateDeliveryId = [
  param('deliveryId')
    .isUUID()
    .withMessage('Invalid delivery ID format')
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
  
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be true or false')
];

const validateDeliveryPagination = [
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
    .isIn(['success', 'failed', 'pending'])
    .withMessage('Status must be success, failed, or pending')
];

// Apply authentication and plan validation to all routes
router.use(authMiddleware);
// router.use(requirePlan('professional')); // Webhooks are Professional+ feature - temporarily disabled
// router.use(webhookRateLimit); // Temporarily disabled for debugging

/**
 * @route GET /api/webhooks
 * @desc Get all webhooks for authenticated user
 * @access Private (Professional+)
 */
router.get('/', 
  validatePagination,
  webhooksController.getWebhooks
);

/**
 * @route GET /api/webhooks/:id
 * @desc Get specific webhook by ID
 * @access Private (Professional+)
 */
router.get('/:id',
  validateWebhookId,
  webhooksController.getWebhook
);

/**
 * @route POST /api/webhooks
 * @desc Create new webhook
 * @access Private (Professional+)
 */
router.post('/',
  webhookModifyRateLimit,
  validateWebhookCreation,
  webhooksController.createWebhook
);

/**
 * @route PUT /api/webhooks/:id
 * @desc Update webhook
 * @access Private (Professional+)
 */
router.put('/:id',
  webhookModifyRateLimit,
  validateWebhookId,
  validateWebhookUpdate,
  webhooksController.updateWebhook
);

/**
 * @route DELETE /api/webhooks/:id
 * @desc Delete webhook
 * @access Private (Professional+)
 */
router.delete('/:id',
  webhookModifyRateLimit,
  validateWebhookId,
  webhooksController.deleteWebhook
);

/**
 * @route POST /api/webhooks/:id/test
 * @desc Test webhook by sending a test payload
 * @access Private (Professional+)
 */
router.post('/:id/test',
  webhookModifyRateLimit,
  validateWebhookId,
  webhooksController.testWebhook
);

/**
 * @route GET /api/webhooks/:id/deliveries
 * @desc Get webhook deliveries
 * @access Private (Professional+)
 */
router.get('/:id/deliveries',
  validateWebhookId,
  validateDeliveryPagination,
  webhooksController.getWebhookDeliveries
);

/**
 * @route POST /api/webhooks/deliveries/:deliveryId/retry
 * @desc Retry failed webhook delivery
 * @access Private (Professional+)
 */
router.post('/deliveries/:deliveryId/retry',
  webhookModifyRateLimit,
  validateDeliveryId,
  webhooksController.retryWebhookDelivery
);

/**
 * @route GET /api/webhooks/events
 * @desc Get available webhook events
 * @access Private (Professional+)
 */
router.get('/events', (req, res) => {
  const events = [
    {
      name: 'video.created',
      description: 'Triggered when a new video is uploaded',
      example_payload: {
        event: 'video.created',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          title: 'My Video',
          duration: 120,
          size: 1024000,
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'video.updated',
      description: 'Triggered when video metadata is updated',
      example_payload: {
        event: 'video.updated',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          changes: ['title', 'description'],
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'video.deleted',
      description: 'Triggered when a video is deleted',
      example_payload: {
        event: 'video.deleted',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'video.processed',
      description: 'Triggered when video processing is complete',
      example_payload: {
        event: 'video.processed',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          processing_time: 45,
          qualities: ['720p', '1080p'],
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'video.encoding.started',
      description: 'Triggered when video encoding begins',
      example_payload: {
        event: 'video.encoding.started',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          encoding_profile: 'standard',
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'video.encoding.completed',
      description: 'Triggered when video encoding is completed',
      example_payload: {
        event: 'video.encoding.completed',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          encoding_time: 120,
          output_qualities: ['480p', '720p', '1080p'],
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'video.encoding.failed',
      description: 'Triggered when video encoding fails',
      example_payload: {
        event: 'video.encoding.failed',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          video_id: 'uuid-here',
          error: 'Unsupported format',
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'livestream.started',
      description: 'Triggered when a livestream begins',
      example_payload: {
        event: 'livestream.started',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          stream_id: 'uuid-here',
          title: 'My Live Stream',
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'livestream.ended',
      description: 'Triggered when a livestream ends',
      example_payload: {
        event: 'livestream.ended',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          stream_id: 'uuid-here',
          duration: 3600,
          peak_viewers: 150,
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'livestream.recorded',
      description: 'Triggered when a livestream recording is available',
      example_payload: {
        event: 'livestream.recorded',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          stream_id: 'uuid-here',
          recording_id: 'recording-uuid',
          duration: 3600,
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'analytics.milestone',
      description: 'Triggered when analytics milestones are reached',
      example_payload: {
        event: 'analytics.milestone',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          milestone_type: 'views',
          milestone_value: 1000,
          video_id: 'uuid-here',
          user_id: 'user-uuid'
        }
      }
    },
    {
      name: 'user.plan.changed',
      description: 'Triggered when user changes subscription plan',
      example_payload: {
        event: 'user.plan.changed',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          user_id: 'user-uuid',
          old_plan: 'basic',
          new_plan: 'professional',
          effective_date: '2024-01-15T10:30:00Z'
        }
      }
    },
    {
      name: 'storage.limit.reached',
      description: 'Triggered when storage limit is reached',
      example_payload: {
        event: 'storage.limit.reached',
        timestamp: '2024-01-15T10:30:00Z',
        data: {
          user_id: 'user-uuid',
          current_usage: 10737418240,
          limit: 10737418240,
          percentage: 100
        }
      }
    }
  ];
  
  res.json({
    success: true,
    data: { events }
  });
});

module.exports = router;