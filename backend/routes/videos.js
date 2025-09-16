const express = require('express');
const multer = require('multer');
const { body, query, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { Video, User } = require('../models');
const { authMiddleware: auth, requirePremium, validateInput, enhancedRateLimit } = require('../middleware/auth');
const bunnyService = require('../services/BunnyService');
const videoCacheService = require('../services/videoCacheService');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const { AppError, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { 
  handleValidationErrors: validationHandler, 
  sanitizeHtml, 
  validateTags,
  validateVideoFile,
  createSmartRateLimit 
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting mejorado
const uploadLimiter = createSmartRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour for regular users
  message: 'Upload limit exceeded. Please try again later.',
  prefix: 'video_upload',
  skipPremium: true, // Premium users skip rate limiting
  skipAdmin: true
});

const searchLimiter = createSmartRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Search limit exceeded. Please try again later.',
  prefix: 'video_search'
});

// Multer configuration for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos', req.user.id);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// Usar validación de archivos mejorada
const fileFilter = validateVideoFile({
  allowedMimes: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/3gpp',
    'video/x-flv'
  ],
  allowedExtensions: ['.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.wmv', '.webm', '.3gp', '.flv']
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB max file size
    files: 1
  }
});

// Validation middleware mejorada con sanitización XSS
const validateVideoUpload = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage('Title is required and must be less than 255 characters'),
  sanitizeHtml('title'), // Sanitizar XSS
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  sanitizeHtml('description'), // Sanitizar XSS
  body('visibility')
    .optional()
    .isIn(['public', 'unlisted', 'private', 'premium'])
    .withMessage('Invalid visibility option'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  sanitizeHtml('category'), // Sanitizar XSS
  validateTags('tags', { maxTags: 20, maxTagLength: 50 }), // Validación mejorada de tags
  body('enable_comments')
    .optional()
    .isBoolean()
    .withMessage('Enable comments must be a boolean'),
  body('enable_downloads')
    .optional()
    .isBoolean()
    .withMessage('Enable downloads must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be 4-50 characters')
];

const validateVideoUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage('Title must be 1-255 characters'),
  sanitizeHtml('title'), // Sanitizar XSS
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  sanitizeHtml('description'), // Sanitizar XSS
  body('visibility')
    .optional()
    .isIn(['public', 'unlisted', 'private', 'premium'])
    .withMessage('Invalid visibility option'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  sanitizeHtml('category'), // Sanitizar XSS
  validateTags('tags', { maxTags: 20, maxTagLength: 50 }) // Validación mejorada de tags
];

const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters')
    .customSanitizer(value => {
      if (typeof value === 'string') {
        // Sanitizar caracteres especiales para búsqueda segura
        return value.replace(/[<>"'&]/g, '');
      }
      return value;
    }),
  query('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category filter must be less than 100 characters')
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return value.replace(/[<>"'&]/g, '');
      }
      return value;
    }),
  query('duration')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Duration must be short, medium, or long'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'views', 'duration'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Helper functions
// Usar el handler de validación centralizado
const handleValidationErrors = validationHandler;

const checkVideoOwnership = async (req, res, next) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }
    
    if (video.user_id !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }
    
    req.video = video;
    next();
  } catch (error) {
    next(error);
  }
};

const checkUserQuota = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if user can upload (storage and bandwidth limits)
    if (!user.canUpload(req.file?.size || 0)) {
      throw new AppError('Upload quota exceeded. Upgrade to premium for more storage.', 413);
    }
    
    req.userModel = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Routes

/**
 * @route   POST /api/videos/upload
 * @desc    Upload a new video
 * @access  Private
 */
router.post('/upload', 
  auth, 
  uploadLimiter, 
  upload.single('video'), 
  checkUserQuota,
  validateVideoUpload, 
  handleValidationErrors, 
  async (req, res, next) => {
    let tempFilePath = null;
    
    try {
      if (!req.file) {
        throw new ValidationError('Video file is required');
      }
      
      tempFilePath = req.file.path;
      const {
        title,
        description,
        visibility = 'public',
        category,
        tags = [],
        enable_comments = true,
        enable_downloads = false,
        password,
        publish_at
      } = req.body;
      
      // Check premium requirements
      if (visibility === 'premium' && !req.user.is_premium) {
        throw new ValidationError('Premium visibility requires premium subscription');
      }
      
      // Upload to Bunny Stream
      logger.bunny('video_upload_started', 'info', {
        userId: req.user.id,
        filename: req.file.originalname,
        size: req.file.size
      });
      
      const bunnyVideo = await bunnyService.createVideo(title, process.env.BUNNY_STREAM_COLLECTION_ID);
      
      // Upload file to Bunny Stream
      const uploadResult = await bunnyService.uploadVideo(
        bunnyVideo.guid,
        tempFilePath
      );
      
      // Generate URLs for the video
      const embedUrl = bunnyService.getVideoEmbedUrl(bunnyVideo.guid);
      const thumbnailUrl = bunnyService.getVideoThumbnailUrl(bunnyVideo.guid);
      const playUrl = bunnyService.getVideoPlayUrl(bunnyVideo.guid);
      
      // Create video record in database
      const videoData = {
        user_id: req.user.id,
        title,
        description,
        slug: null, // Will be generated in beforeCreate hook
        bunny_video_id: bunnyVideo.guid,
        bunny_library_id: bunnyVideo.videoLibraryId,
        bunny_collection_id: process.env.BUNNY_STREAM_COLLECTION_ID,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        visibility,
        category,
        tags: Array.isArray(tags) ? tags : [],
        enable_comments,
        enable_downloads,
        status: 'processing',
        processing_progress: 0,
        embed_url: embedUrl,
        thumbnail_url: thumbnailUrl,
        play_url: playUrl
      };
      
      // Handle password protection
      if (password) {
        const bcrypt = require('bcrypt');
        videoData.is_password_protected = true;
        videoData.password_hash = await bcrypt.hash(password, 12);
      }
      
      // Handle scheduled publishing
      if (publish_at) {
        const publishDate = new Date(publish_at);
        if (publishDate > new Date()) {
          videoData.published_at = publishDate;
          videoData.visibility = 'private'; // Keep private until publish date
        }
      }
      
      const video = await Video.create(videoData);
      
      // Update user storage usage
      await req.userModel.increment('storage_used', { by: req.file.size });
      
      // Clean up temporary file
      await fs.unlink(tempFilePath);
      tempFilePath = null;
      
      logger.bunny('video_upload_completed', 'success', {
        userId: req.user.id,
        videoId: video.id,
        bunnyVideoId: bunnyVideo.guid,
        size: req.file.size
      });
      
      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully and is being processed',
        data: {
          video: {
            id: video.id,
            title: video.title,
            slug: video.slug,
            status: video.status,
            visibility: video.visibility,
            bunny_video_id: video.bunny_video_id,
            created_at: video.created_at
          }
        }
      });
    } catch (error) {
      // Clean up temporary file on error
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (unlinkError) {
          logger.error('Failed to clean up temporary file', {
            path: tempFilePath,
            error: unlinkError.message
          });
        }
      }
      next(error);
    }
  }
);

/**
 * @route   GET /api/videos
 * @desc    Get videos with filtering and pagination
 * @access  Public
 */
router.get('/', 
  enhancedRateLimit({ type: 'video_list', maxRequests: 60, windowMs: 60 * 1000 }),
  validateInput({
    q: { required: false, type: 'string', maxLength: 255 },
    category: { required: false, type: 'string' },
    duration: { required: false, type: 'string' },
    sort: { required: false, type: 'string' },
    page: { required: false, type: 'number', min: 1 },
    limit: { required: false, type: 'number', min: 1, max: 50 },
    user_id: { required: false, type: 'string' }
  }),
  validateSearch, 
  handleValidationErrors, 
  async (req, res, next) => {
  try {
    const {
      q,
      category,
      duration,
      sort = 'newest',
      page = 1,
      limit = 20,
      user_id
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Use cache service for public videos
    if (!q && !user_id) {
      const orderBy = sort === 'newest' ? 'created_at' : sort === 'popular' ? 'view_count' : 'created_at';
      const orderDir = sort === 'oldest' ? 'ASC' : 'DESC';
      
      const result = await videoCacheService.getPublicVideos(parseInt(limit), parseInt(offset), orderBy, orderDir);
      
      return res.json({
        success: true,
        data: {
          videos: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.count,
            pages: Math.ceil(result.count / limit)
          }
        }
      });
    }
    
    let whereClause = {
      status: 'completed',
      visibility: ['public', 'unlisted']
    };
    
    // Add search filters
    if (q) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (user_id) {
      whereClause.user_id = user_id;
      // If requesting specific user's videos, include private ones if it's the owner
      if (req.user && req.user.id === parseInt(user_id)) {
        whereClause.visibility = ['public', 'unlisted', 'private', 'premium'];
      }
    }
    
    // Duration filter
    if (duration) {
      const { Op } = require('sequelize');
      switch (duration) {
        case 'short':
          whereClause.duration = { [Op.lt]: 240 }; // Less than 4 minutes
          break;
        case 'medium':
          whereClause.duration = { [Op.between]: [240, 1200] }; // 4-20 minutes
          break;
        case 'long':
          whereClause.duration = { [Op.gt]: 1200 }; // More than 20 minutes
          break;
      }
    }
    
    // Sort options
    let orderClause;
    switch (sort) {
      case 'oldest':
        orderClause = [['created_at', 'ASC']];
        break;
      case 'popular':
        orderClause = [['views_count', 'DESC'], ['likes_count', 'DESC']];
        break;
      case 'views':
        orderClause = [['views_count', 'DESC']];
        break;
      case 'duration':
        orderClause = [['duration', 'DESC']];
        break;
      default: // newest
        orderClause = [['created_at', 'DESC']];
    }
    
    const result = await Video.findAndCountAll({
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
        exclude: ['password_hash', 'bunny_library_id', 'bunny_collection_id']
      }
    });
    
    const response = {
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.count,
        pages: Math.ceil(result.count / limit)
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
 * @route   GET /api/videos/search
 * @desc    Search videos
 * @access  Public
 */
router.get('/search', 
  enhancedRateLimit({ type: 'video_search', maxRequests: 30, windowMs: 60 * 1000 }),
  validateInput({
    q: { required: true, type: 'string', maxLength: 255 },
    category: { required: false, type: 'string' },
    duration: { required: false, type: 'string' },
    sort: { required: false, type: 'string' },
    page: { required: false, type: 'number', min: 1 },
    limit: { required: false, type: 'number', min: 1, max: 50 }
  }),
  searchLimiter, 
  validateSearch, 
  handleValidationErrors, 
  async (req, res, next) => {
  try {
    const {
      q,
      category,
      duration,
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query;
    
    if (!q) {
      throw new ValidationError('Search query is required');
    }
    
    const offset = (page - 1) * limit;
    const result = await videoCacheService.searchVideos(q, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: {
        videos: result.rows,
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
 * @route   GET /api/videos/popular
 * @desc    Get popular videos
 * @access  Public
 */
router.get('/popular', async (req, res, next) => {
  try {
    const { timeframe = '24h', limit = 20, offset = 0 } = req.query;
    const cacheKey = `videos:popular:${timeframe}:${limit}:${offset}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const result = await Video.getPopularVideos(parseInt(limit), 7); // 7 days default
    
    const response = {
      videos: result,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.length
      }
    };
    
    // Cache for 10 minutes
    await cache.set(cacheKey, response, 600);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/videos/my-videos
 * @desc    Get current user's videos
 * @access  Private
 */
router.get('/my-videos', auth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      status = 'all',
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = { user_id: req.user.id };

    // Add status filter
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Add search filter
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: [
        'id', 'title', 'description', 'bunny_video_id', 'bunny_library_id', 
        'bunny_collection_id', 'embed_url', 'play_url', 'thumbnail_url',
        'status', 'visibility', 'duration', 'file_size', 'view_count',
        'created_at', 'updated_at'
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/videos/:identifier
 * @desc    Get video by ID or slug
 * @access  Public
 */
router.get('/:identifier', 
  enhancedRateLimit({ type: 'video_view', maxRequests: 100, windowMs: 60 * 1000 }),
  validateInput({
    identifier: { required: true, type: 'string', maxLength: 255 }
  }),
  async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { password } = req.query;
    
    // Try to find by slug first using cache service
    let video = await videoCacheService.getVideoBySlug(identifier);
    if (!video) {
      video = await Video.findByPk(identifier, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
        }]
      });
    }
    
    if (!video) {
      throw new NotFoundError('Video not found');
    }
    
    // Check if video is accessible
    if (!video.isAccessible(req.user, password)) {
      if (video.is_password_protected) {
        throw new AppError('Password required', 401);
      }
      if (video.visibility === 'private') {
        throw new AppError('Video is private', 403);
      }
      if (video.visibility === 'premium') {
        throw new AppError('Premium subscription required', 403);
      }
    }
    
    // Increment view count (async, don't wait)
    video.incrementViews().catch(error => {
      logger.error('Failed to increment video views', {
        videoId: video.id,
        error: error.message
      });
    });
    
    // Invalidate cache after view increment
    videoCacheService.invalidateVideoCache(video.id).catch(error => {
      logger.error('Failed to invalidate video cache', {
        videoId: video.id,
        error: error.message
      });
    });
    
    // Get streaming URLs from Bunny.net
    const streamingUrls = await bunnyService.getStreamingUrls(video.bunny_video_id);
    
    res.json({
      success: true,
      data: {
        video: {
          ...video.toJSON(),
          streaming_urls: streamingUrls,
          password_hash: undefined // Never expose password hash
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video
 * @access  Private (Owner or Admin)
 */
router.put('/:id', 
  auth, 
  checkVideoOwnership, 
  validateVideoUpdate, 
  handleValidationErrors, 
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        visibility,
        category,
        tags,
        enable_comments,
        enable_downloads,
        password,
        remove_password
      } = req.body;
      
      const updateData = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (visibility !== undefined) {
        // Check premium requirements
        if (visibility === 'premium' && !req.user.is_premium) {
          throw new ValidationError('Premium visibility requires premium subscription');
        }
        updateData.visibility = visibility;
      }
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (enable_comments !== undefined) updateData.enable_comments = enable_comments;
      if (enable_downloads !== undefined) updateData.enable_downloads = enable_downloads;
      
      // Handle password changes
      if (remove_password) {
        updateData.is_password_protected = false;
        updateData.password_hash = null;
      } else if (password) {
        const bcrypt = require('bcrypt');
        updateData.is_password_protected = true;
        updateData.password_hash = await bcrypt.hash(password, 12);
      }
      
      await req.video.update(updateData);
      
      // Update video metadata in Bunny.net if title changed
      if (title && title !== req.video.title) {
        try {
          await bunnyService.updateVideo(req.video.bunny_video_id, { title });
        } catch (bunnyError) {
          logger.bunny('video_metadata_update_failed', 'warning', {
            videoId: req.video.id,
            bunnyVideoId: req.video.bunny_video_id,
            error: bunnyError.message
          });
        }
      }
      
      // Clear related caches
      const cachePattern = `videos:*`;
      const keys = await cache.keys(cachePattern);
      if (keys.length > 0) {
        await cache.del(keys);
      }
      
      res.json({
        success: true,
        message: 'Video updated successfully',
        data: {
          video: {
            ...req.video.toJSON(),
            password_hash: undefined
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete video
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', auth, checkVideoOwnership, async (req, res, next) => {
  try {
    // Delete from Bunny.net
    try {
      await bunnyService.deleteVideo(req.video.bunny_video_id);
    } catch (bunnyError) {
      logger.bunny('video_deletion_failed', 'warning', {
        videoId: req.video.id,
        bunnyVideoId: req.video.bunny_video_id,
        error: bunnyError.message
      });
    }
    
    // Update user storage usage
    await User.decrement('storage_used', {
      by: req.video.file_size,
      where: { id: req.video.user_id }
    });
    
    // Delete from database
    await req.video.destroy();
    
    // Clear caches
    const cachePattern = `videos:*`;
    const keys = await cache.keys(cachePattern);
    if (keys.length > 0) {
      await cache.del(keys);
    }
    
    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/videos/:id/like
 * @desc    Like/unlike video
 * @access  Private
 */
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }
    
    const cacheKey = `video:like:${video.id}:${req.user.id}`;
    const isLiked = await cache.get(cacheKey);
    
    if (isLiked) {
      // Unlike
      await video.decrement('likes_count');
      await cache.del(cacheKey);
    } else {
      // Like
      await video.increment('likes_count');
      await cache.set(cacheKey, true, 24 * 3600); // 24 hours
    }
    
    res.json({
      success: true,
      data: {
        liked: !isLiked,
        likes_count: isLiked ? video.likes_count - 1 : video.likes_count + 1
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/videos/:id/analytics
 * @desc    Get video analytics
 * @access  Private (Owner or Admin)
 */
router.get('/:id/analytics', auth, checkVideoOwnership, async (req, res, next) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Get local analytics
    const localAnalytics = req.video.getAnalytics();
    
    let bunnyAnalytics = null;
    try {
      // Try to get analytics from Bunny.net
      bunnyAnalytics = await bunnyService.getVideoAnalytics(
        req.video.bunny_video_id,
        timeframe
      );
    } catch (bunnyError) {
      logger.warn('Failed to fetch Bunny analytics', {
        videoId: req.video.id,
        bunnyVideoId: req.video.bunny_video_id,
        error: bunnyError.message
      });
      // Continue without Bunny analytics
    }
    
    const analytics = {
      ...localAnalytics,
      ...(bunnyAnalytics && { bunny_analytics: bunnyAnalytics })
    };
    
    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/videos/:id/download
 * @desc    Generate download link
 * @access  Private
 */
router.post('/:id/download', auth, async (req, res, next) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }
    
    if (!video.enable_downloads) {
      throw new AppError('Downloads are not enabled for this video', 403);
    }
    
    if (!video.isAccessible(req.user)) {
      throw new AppError('Access denied', 403);
    }
    
    // Generate signed download URL
    const downloadUrl = await bunnyService.generateSignedUrl(
      video.bunny_video_id,
      'download',
      3600 // 1 hour expiry
    );
    
    // Increment download count
    await video.increment('downloads_count');
    
    res.json({
      success: true,
      data: {
        download_url: downloadUrl,
        expires_in: 3600
      }
    });
  } catch (error) {
    next(error);
  }
});



/**
 * @route   POST /api/videos/create-test
 * @desc    Create test video for development
 * @access  Private
 */
router.post('/create-test', auth, async (req, res, next) => {
  try {
    const {
      title,
      description,
      file_name,
      file_size,
      duration,
      format,
      resolution,
      status
    } = req.body;

    const testId = Date.now();
    const video = await Video.create({
      title,
      description,
      file_name,
      original_filename: file_name || 'test-video.mp4',
      file_size,
      duration,
      format,
      resolution,
      status: status || 'processed',
      user_id: req.user.id,
      bunny_video_id: `test-${testId}`,
      bunny_library_id: 'test-library-id',
      slug: `test-video-${testId}`,
      thumbnail_url: 'https://via.placeholder.com/640x360',
      video_url: 'https://via.placeholder.com/test-video.mp4',
      views: 0,
      likes: 0,
      dislikes: 0,
      visibility: 'public'
    });

    res.status(201).json({
      success: true,
      data: {
        video: {
          id: video.id,
          title: video.title,
          description: video.description,
          status: video.status,
          created_at: video.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;