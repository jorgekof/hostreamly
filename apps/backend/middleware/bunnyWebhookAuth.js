const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Bunny Stream Webhook Authentication Middleware
 * 
 * Validates incoming webhooks from Bunny Stream using signature verification
 * to ensure requests are legitimate and haven't been tampered with.
 */

/**
 * Verify Bunny Stream webhook signature
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyBunnyWebhook = (req, res, next) => {
  try {
    const signature = req.get('X-Bunny-Signature');
    const timestamp = req.get('X-Bunny-Timestamp');
    const webhookSecret = process.env.BUNNY_WEBHOOK_SECRET;
    
    // Check if webhook secret is configured
    if (!webhookSecret) {
      logger.warn('Bunny webhook secret not configured, skipping verification');
      return next();
    }
    
    // Check if signature is provided
    if (!signature) {
      logger.warn('Bunny webhook signature missing', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        message: 'Webhook signature required'
      });
    }
    
    // Check timestamp to prevent replay attacks (optional)
    if (timestamp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      const timeDifference = Math.abs(currentTime - webhookTime);
      
      // Reject webhooks older than 5 minutes
      if (timeDifference > 300) {
        logger.warn('Bunny webhook timestamp too old', {
          timestamp: webhookTime,
          currentTime,
          difference: timeDifference,
          ip: req.ip
        });
        
        return res.status(401).json({
          success: false,
          message: 'Webhook timestamp too old'
        });
      }
    }
    
    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    // Compare signatures
    const providedSignature = signature.replace('sha256=', '');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )) {
      logger.warn('Bunny webhook signature verification failed', {
        providedSignature: providedSignature.substring(0, 8) + '...',
        expectedSignature: expectedSignature.substring(0, 8) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
    
    logger.info('Bunny webhook signature verified successfully', {
      timestamp,
      ip: req.ip
    });
    
    next();
    
  } catch (error) {
    logger.error('Bunny webhook verification error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};

/**
 * Middleware to capture raw body for webhook signature verification
 * This should be applied before body parsing middleware
 */
const captureRawBody = (req, res, next) => {
  if (req.path.includes('/webhook/')) {
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

/**
 * Rate limiting specifically for webhooks
 */
const webhookRateLimit = require('express-rate-limit')({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow up to 100 webhook requests per minute per IP
  message: {
    success: false,
    message: 'Too many webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for known Bunny Stream IPs (if needed)
  skip: (req) => {
    // Add Bunny Stream IP ranges here if known
    const bunnyIpRanges = [
      // Add known Bunny Stream IP ranges
    ];
    
    // For now, don't skip any IPs
    return false;
  }
});

/**
 * Validate webhook payload structure
 */
const validateWebhookPayload = (req, res, next) => {
  const { videoId, status, userId } = req.body;
  
  if (!videoId || !status) {
    logger.warn('Invalid webhook payload structure', {
      body: req.body,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook payload: videoId and status are required'
    });
  }
  
  // Validate status values
  const validStatuses = [
    'uploaded',
    'processing',
    'ready',
    'failed',
    'deleted'
  ];
  
  if (!validStatuses.includes(status)) {
    logger.warn('Invalid webhook status', {
      status,
      validStatuses,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  next();
};

/**
 * Complete webhook authentication chain
 */
const authenticateWebhook = [
  webhookRateLimit,
  verifyBunnyWebhook,
  validateWebhookPayload
];

module.exports = {
  verifyBunnyWebhook,
  captureRawBody,
  webhookRateLimit,
  validateWebhookPayload,
  authenticateWebhook
};