const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const LiveStream = require('../models/LiveStream');
const User = require('../models/User');
const { authMiddleware: auth, requirePremium } = require('../middleware/auth');
const { requireEnterprisePlan, validateLiveStreamingLimits } = require('../middleware/planAuth');
const agoraService = require('../services/AgoraService');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const { AppError, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { sanitizeHtml, validateTags, createSmartRateLimit, validationHandler } = require('../middleware/validation');

const router = express.Router();

// Rate limiting
const createStreamLimiter = createSmartRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 stream creations per hour
  message: {
    error: 'Stream creation limit exceeded. Please try again later.',
    retryAfter: 3600
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

const joinStreamLimiter = createSmartRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 join attempts per minute
  message: {
    error: 'Too many join attempts. Please try again later.',
    retryAfter: 60
  }
});

// Validation middleware
const validateStreamCreation = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .trim()
    .customSanitizer(sanitizeHtml)
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .customSanitizer(sanitizeHtml)
    .withMessage('Description must be less than 5000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'unlisted', 'private', 'premium'])
    .withMessage('Invalid visibility option'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeHtml)
    .withMessage('Category must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .custom(validateTags)
    .withMessage('Tags must be an array with maximum 20 items'),
  body('scheduled_start_time')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled start time format'),
  body('scheduled_end_time')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled end time format'),
  body('max_viewers')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Max viewers must be between 1 and 100000'),
  body('enable_chat')
    .optional()
    .isBoolean()
    .withMessage('Enable chat must be a boolean'),
  body('enable_recording')
    .optional()
    .isBoolean()
    .withMessage('Enable recording must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be 4-50 characters'),
  body('ticket_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be a positive number')
];

const validateStreamUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .trim()
    .customSanitizer(sanitizeHtml)
    .withMessage('Title must be 1-255 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .customSanitizer(sanitizeHtml)
    .withMessage('Description must be less than 5000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'unlisted', 'private', 'premium'])
    .withMessage('Invalid visibility option'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeHtml)
    .withMessage('Category must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .custom(validateTags)
    .withMessage('Tags must be an array with maximum 20 items')
];

const validateJoinStream = [
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be 4-50 characters')
];

// Helper functions
// Use centralized validation handler from middleware

const checkStreamOwnership = async (req, res, next) => {
  try {
    const stream = await LiveStream.findByPk(req.params.id);
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }
    
    if (stream.user_id !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }
    
    req.stream = stream;
    next();
  } catch (error) {
    next(error);
  }
};

const checkStreamLimits = async (req, res, next) => {
  try {
    const user = req.userModel || await User.findByPk(req.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check concurrent stream limits for enterprise plan
    const activeStreams = await LiveStream.count({
      where: {
        user_id: req.user.id,
        status: ['live', 'preparing']
      }
    });
    
    // Enterprise plan: múltiples streams concurrentes
    const maxConcurrentStreams = 10;
    const maxConcurrentViewers = req.streamingLimits?.maxConcurrentViewers || 100;
    
    if (activeStreams >= maxConcurrentStreams) {
      throw new AppError(
        `Maximum concurrent streams reached (${maxConcurrentStreams}) for Enterprise plan.`,
        429
      );
    }
    
    // Agregar información de límites al request
    req.streamLimits = {
      maxConcurrentStreams,
      maxConcurrentViewers,
      activeStreams
    };
    
    req.userModel = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Routes

/**
 * @route   POST /api/livestreams
 * @desc    Create a new live stream
 * @access  Private
 */
router.post('/', 
  auth, 
  requireEnterprisePlan,
  validateLiveStreamingLimits,
  createStreamLimiter, 
  checkStreamLimits,
  validateStreamCreation, 
  validationHandler, 
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        slug,
        visibility = 'public',
        category,
        tags = [],
        scheduled_start_time,
        scheduled_end_time,
        max_viewers = 1000,
        enable_chat = true,
        enable_recording = false,
        password,
        ticket_price,
        currency = 'USD'
      } = req.body;
      
      // Check premium requirements
      if (visibility === 'premium' && !req.user.is_premium) {
        throw new ValidationError('Premium visibility requires premium subscription');
      }
      
      if (enable_recording && !req.user.is_premium) {
        throw new ValidationError('Recording feature requires premium subscription');
      }
      
      if (ticket_price && ticket_price > 0 && !req.user.is_premium) {
        throw new ValidationError('Monetization requires premium subscription');
      }
      
      // Generate unique channel name and UID
      const channelName = agoraService.generateChannelName('stream');
      const broadcasterUid = agoraService.generateUid();
      
      // Create stream record
      const streamData = {
        user_id: req.user.id,
        title,
        description,
        slug,
        channel_name: channelName,
        agora_app_id: process.env.AGORA_APP_ID,
        broadcaster_uid: broadcasterUid,
        visibility,
        category,
        tags: Array.isArray(tags) ? tags : [],
        scheduled_start_time: scheduled_start_time ? new Date(scheduled_start_time) : null,
        scheduled_end_time: scheduled_end_time ? new Date(scheduled_end_time) : null,
        max_viewers,
        enable_chat,
        enable_recording,
        is_monetized: ticket_price && ticket_price > 0,
        ticket_price: ticket_price || null,
        currency
      };
      
      // Handle password protection
      if (password) {
        const bcrypt = require('bcrypt');
        streamData.is_password_protected = true;
        streamData.password_hash = await bcrypt.hash(password, 12);
      }
      
      const stream = await LiveStream.create(streamData);
      
      logger.agora('stream_created', 'success', {
        userId: req.user.id,
        streamId: stream.id,
        channelName: stream.channel_name,
        broadcasterUid: stream.broadcaster_uid
      });
      
      res.status(201).json({
        success: true,
        message: 'Live stream created successfully',
        data: {
          stream: {
            id: stream.id,
            title: stream.title,
            slug: stream.slug,
            channel_name: stream.channel_name,
            broadcaster_uid: stream.broadcaster_uid,
            status: stream.status,
            visibility: stream.visibility,
            scheduled_start_time: stream.scheduled_start_time,
            created_at: stream.created_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/livestreams
 * @desc    Get live streams with filtering
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status = 'live',
      category,
      sort = 'viewers',
      page = 1,
      limit = 20,
      user_id
    } = req.query;
    
    const offset = (page - 1) * limit;
    const cacheKey = `livestreams:${JSON.stringify(req.query)}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    let result;
    
    if (status === 'live') {
      result = await LiveStream.findLiveStreams(parseInt(limit), parseInt(offset));
    } else if (status === 'scheduled') {
      result = await LiveStream.findScheduledStreams(parseInt(limit), parseInt(offset));
    } else if (user_id) {
      result = await LiveStream.findUserStreams(user_id, parseInt(limit), parseInt(offset));
    } else {
      // General query with filters
      let whereClause = {
        visibility: ['public', 'unlisted']
      };
      
      if (status && status !== 'all') {
        whereClause.status = status;
      }
      
      if (category) {
        whereClause.category = category;
      }
      
      if (user_id) {
        whereClause.user_id = user_id;
        // Include private streams if requesting own streams
        if (req.user && req.user.id === parseInt(user_id)) {
          whereClause.visibility = ['public', 'unlisted', 'private', 'premium'];
        }
      }
      
      let orderClause;
      switch (sort) {
        case 'newest':
          orderClause = [['created_at', 'DESC']];
          break;
        case 'scheduled':
          orderClause = [['scheduled_start_time', 'ASC']];
          break;
        case 'viewers':
        default:
          orderClause = [['current_viewers', 'DESC'], ['created_at', 'DESC']];
      }
      
      result = await LiveStream.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
        }],
        order: orderClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: {
          exclude: ['password_hash', 'stream_key']
        }
      });
    }
    
    const response = {
      streams: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.count,
        pages: Math.ceil(result.count / limit)
      }
    };
    
    // Cache for 1 minute (live data changes frequently)
    await cache.set(cacheKey, response, 60);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/livestreams/popular
 * @desc    Get popular live streams
 * @access  Public
 */
router.get('/popular', async (req, res, next) => {
  try {
    const { timeframe = '24h', limit = 20, offset = 0 } = req.query;
    const cacheKey = `livestreams:popular:${timeframe}:${limit}:${offset}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const result = await LiveStream.findPopularStreams(
      timeframe, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    const response = {
      streams: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.count
      }
    };
    
    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/livestreams/search
 * @desc    Search live streams
 * @access  Public
 */
router.get('/search', async (req, res, next) => {
  try {
    const {
      q,
      category,
      status,
      page = 1,
      limit = 20
    } = req.query;
    
    if (!q) {
      throw new ValidationError('Search query is required');
    }
    
    const offset = (page - 1) * limit;
    const result = await LiveStream.searchStreams(q, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: {
        streams: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.count,
          pages: Math.ceil(result.count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/livestreams/:identifier
 * @desc    Get live stream by ID or slug
 * @access  Public
 */
router.get('/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { password } = req.query;
    
    // Try to find by slug first, then by ID
    let stream = await LiveStream.findBySlug(identifier);
    if (!stream) {
      stream = await LiveStream.findByPk(identifier, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
        }]
      });
    }
    
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }
    
    // Check if stream is accessible
    if (!stream.isAccessible(req.user, password)) {
      if (stream.is_password_protected) {
        throw new AppError('Password required', 401);
      }
      if (stream.visibility === 'private') {
        throw new AppError('Stream is private', 403);
      }
      if (stream.visibility === 'premium') {
        throw new AppError('Premium subscription required', 403);
      }
    }
    
    res.json({
      success: true,
      data: {
        stream: {
          ...stream.toJSON(),
          password_hash: undefined,
          stream_key: undefined // Never expose stream key
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/livestreams/:id/join
 * @desc    Join a live stream (get tokens)
 * @access  Private
 */
router.post('/:id/join', 
  auth, 
  requireEnterprisePlan,
  joinStreamLimiter, 
  validateJoinStream, 
  validationHandler, 
  async (req, res, next) => {
    try {
      const { password } = req.body;
      const { role = 'audience' } = req.query; // audience, broadcaster, moderator
      
      const stream = await LiveStream.findByPk(req.params.id);
      if (!stream) {
        throw new NotFoundError('Stream not found');
      }
      
      // Check if stream is accessible
      if (!stream.isAccessible(req.user, password)) {
        if (stream.is_password_protected) {
          throw new AppError('Invalid password', 401);
        }
        if (stream.visibility === 'private') {
          throw new AppError('Stream is private', 403);
        }
        if (stream.visibility === 'premium') {
          throw new AppError('Premium subscription required', 403);
        }
      }
      
      // Check if stream is live or can be joined
      if (!['live', 'preparing'].includes(stream.status)) {
        throw new AppError('Stream is not available for joining', 400);
      }
      
      // Check viewer limits
      if (role === 'audience' && stream.current_viewers >= stream.max_viewers) {
        throw new AppError('Stream has reached maximum viewer capacity', 429);
      }
      
      // Determine user role and permissions
      let userRole = 'subscriber'; // Default Agora role
      let uid = agoraService.generateUid();
      
      if (stream.user_id === req.user.id) {
        // Stream owner is always broadcaster
        userRole = 'publisher';
        uid = stream.broadcaster_uid;
      } else if (role === 'broadcaster' && stream.allow_co_hosts) {
        // Co-host/moderator
        userRole = 'publisher';
      }
      
      // Generate Agora tokens
      const rtcToken = agoraService.generateRtcToken(
        stream.channel_name,
        uid,
        userRole,
        3600 // 1 hour
      );
      
      const rtmToken = agoraService.generateRtmToken(
        req.user.id.toString(),
        3600 // 1 hour
      );
      
      // Increment viewer count if joining as audience
      if (role === 'audience') {
        await stream.incrementViewers();
      }
      
      // Cache user's stream session
      await cache.set(
        `stream:session:${stream.id}:${req.user.id}`,
        {
          uid,
          role: userRole,
          joinedAt: Date.now()
        },
        3600 // 1 hour
      );
      
      logger.agora('stream_joined', 'success', {
        userId: req.user.id,
        streamId: stream.id,
        channelName: stream.channel_name,
        uid,
        role: userRole
      });
      
      res.json({
        success: true,
        message: 'Joined stream successfully',
        data: {
          stream: {
            id: stream.id,
            title: stream.title,
            channel_name: stream.channel_name,
            status: stream.status,
            current_viewers: stream.current_viewers
          },
          tokens: {
            rtc: rtcToken,
            rtm: rtmToken
          },
          user: {
            uid,
            role: userRole
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/livestreams/:id/leave
 * @desc    Leave a live stream
 * @access  Private
 */
router.post('/:id/leave', auth, async (req, res, next) => {
  try {
    const stream = await LiveStream.findByPk(req.params.id);
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }
    
    // Get user session
    const session = await cache.get(`stream:session:${stream.id}:${req.user.id}`);
    if (session && session.role === 'subscriber') {
      // Decrement viewer count for audience members
      await stream.decrementViewers();
    }
    
    // Remove session
    await cache.del(`stream:session:${stream.id}:${req.user.id}`);
    
    logger.agora('stream_left', 'success', {
      userId: req.user.id,
      streamId: stream.id,
      channelName: stream.channel_name
    });
    
    res.json({
      success: true,
      message: 'Left stream successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/livestreams/:id/start
 * @desc    Start a live stream
 * @access  Private (Owner)
 */
router.post('/:id/start', auth, requireEnterprisePlan, checkStreamOwnership, async (req, res, next) => {
  try {
    if (!req.stream.canStart()) {
      throw new AppError('Stream cannot be started in current state', 400);
    }
    
    // Update stream status
    await req.stream.update({
      status: 'live',
      actual_start_time: new Date()
    });
    
    // Start recording if enabled
    if (req.stream.enable_recording) {
      try {
        const resourceId = await agoraService.acquireRecordingResource(
          req.stream.channel_name,
          req.stream.broadcaster_uid
        );
        
        const { sid } = await agoraService.startRecording(
          req.stream.channel_name,
          req.stream.broadcaster_uid,
          resourceId
        );
        
        await req.stream.update({
          recording_resource_id: resourceId,
          recording_sid: sid,
          recording_status: 'recording'
        });
      } catch (recordingError) {
        logger.agora('recording_start_failed', 'error', {
          streamId: req.stream.id,
          error: recordingError.message
        });
        // Continue without recording
      }
    }
    
    logger.agora('stream_started', 'success', {
      userId: req.user.id,
      streamId: req.stream.id,
      channelName: req.stream.channel_name
    });
    
    res.json({
      success: true,
      message: 'Stream started successfully',
      data: {
        stream: {
          id: req.stream.id,
          status: req.stream.status,
          actual_start_time: req.stream.actual_start_time,
          recording_status: req.stream.recording_status
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/livestreams/:id/end
 * @desc    End a live stream
 * @access  Private (Owner)
 */
router.post('/:id/end', auth, requireEnterprisePlan, checkStreamOwnership, async (req, res, next) => {
  try {
    if (!req.stream.canEnd()) {
      throw new AppError('Stream cannot be ended in current state', 400);
    }
    
    // Stop recording if active
    if (req.stream.recording_status === 'recording') {
      try {
        const recordingResult = await agoraService.stopRecording(
          req.stream.channel_name,
          req.stream.broadcaster_uid,
          req.stream.recording_resource_id,
          req.stream.recording_sid
        );
        
        await req.stream.update({
          recording_status: 'stopped',
          recording_files: recordingResult.serverResponse?.fileList || []
        });
      } catch (recordingError) {
        logger.agora('recording_stop_failed', 'error', {
          streamId: req.stream.id,
          error: recordingError.message
        });
      }
    }
    
    // Update stream status
    await req.stream.update({
      status: 'ended',
      actual_end_time: new Date(),
      current_viewers: 0
    });
    
    // Clear all user sessions for this stream
    const sessionKeys = await cache.keys(`stream:session:${req.stream.id}:*`);
    if (sessionKeys.length > 0) {
      await cache.del(sessionKeys);
    }
    
    logger.agora('stream_ended', 'success', {
      userId: req.user.id,
      streamId: req.stream.id,
      channelName: req.stream.channel_name,
      duration: req.stream.actual_end_time - req.stream.actual_start_time
    });
    
    res.json({
      success: true,
      message: 'Stream ended successfully',
      data: {
        stream: {
          id: req.stream.id,
          status: req.stream.status,
          actual_end_time: req.stream.actual_end_time,
          recording_status: req.stream.recording_status,
          recording_files: req.stream.recording_files
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/livestreams/:id
 * @desc    Update live stream
 * @access  Private (Owner)
 */
router.put('/:id', 
  auth, 
  requireEnterprisePlan,
  checkStreamOwnership, 
  validateStreamUpdate, 
  validationHandler, 
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        visibility,
        category,
        tags,
        enable_chat,
        enable_recording,
        password,
        remove_password
      } = req.body;
      
      // Prevent updates to live streams
      if (req.stream.status === 'live') {
        throw new AppError('Cannot update stream while live', 400);
      }
      
      const updateData = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (visibility !== undefined) {
        if (visibility === 'premium' && !req.user.is_premium) {
          throw new ValidationError('Premium visibility requires premium subscription');
        }
        updateData.visibility = visibility;
      }
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (enable_chat !== undefined) updateData.enable_chat = enable_chat;
      if (enable_recording !== undefined) {
        if (enable_recording && !req.user.is_premium) {
          throw new ValidationError('Recording feature requires premium subscription');
        }
        updateData.enable_recording = enable_recording;
      }
      
      // Handle password changes
      if (remove_password) {
        updateData.is_password_protected = false;
        updateData.password_hash = null;
      } else if (password) {
        const bcrypt = require('bcrypt');
        updateData.is_password_protected = true;
        updateData.password_hash = await bcrypt.hash(password, 12);
      }
      
      await req.stream.update(updateData);
      
      res.json({
        success: true,
        message: 'Stream updated successfully',
        data: {
          stream: {
            ...req.stream.toJSON(),
            password_hash: undefined,
            stream_key: undefined
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/livestreams/:id
 * @desc    Delete live stream
 * @access  Private (Owner)
 */
router.delete('/:id', auth, requireEnterprisePlan, checkStreamOwnership, async (req, res, next) => {
  try {
    // Cannot delete live streams
    if (req.stream.status === 'live') {
      throw new AppError('Cannot delete live stream', 400);
    }
    
    // Stop recording if active
    if (req.stream.recording_status === 'recording') {
      try {
        await agoraService.stopRecording(
          req.stream.channel_name,
          req.stream.broadcaster_uid,
          req.stream.recording_resource_id,
          req.stream.recording_sid
        );
      } catch (recordingError) {
        logger.agora('recording_cleanup_failed', 'warning', {
          streamId: req.stream.id,
          error: recordingError.message
        });
      }
    }
    
    // Clear all sessions
    const sessionKeys = await cache.keys(`stream:session:${req.stream.id}:*`);
    if (sessionKeys.length > 0) {
      await cache.del(sessionKeys);
    }
    
    await req.stream.destroy();
    
    res.json({
      success: true,
      message: 'Stream deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/livestreams/:id/analytics
 * @desc    Get stream analytics
 * @access  Private (Owner)
 */
router.get('/:id/analytics', auth, checkStreamOwnership, async (req, res, next) => {
  try {
    const analytics = req.stream.getAnalytics();
    
    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/livestreams/:id/chat
 * @desc    Send chat message
 * @access  Private
 */
router.post('/:id/chat', auth, async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Message is required');
    }
    
    const stream = await LiveStream.findByPk(req.params.id);
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }
    
    if (!stream.enable_chat) {
      throw new AppError('Chat is disabled for this stream', 403);
    }
    
    if (!stream.isAccessible(req.user)) {
      throw new AppError('Access denied', 403);
    }
    
    // Send message via Agora RTM
    const messageResult = await agoraService.sendChannelMessage(
      stream.channel_name,
      req.user.id.toString(),
      message.trim()
    );
    
    // Increment chat message count
    await stream.addChatMessage();
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: messageResult.messageId
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;