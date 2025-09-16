const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { Video, User } = require('../models');
const BunnyService = require('../services/BunnyService');
const AnalyticsService = require('../services/AnalyticsService');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class VideoController {
  constructor() {
    this.bunnyService = new BunnyService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get all videos with pagination and filtering
   */
  getVideos = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      userId
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add status filter
    if (status) {
      whereClause.status = status;
    }

    // Add user filter
    if (userId) {
      whereClause.userId = userId;
    }

    try {
      const { count, rows: videos } = await Video.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          attributes: ['id', 'username', 'email']
        }],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
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
            itemsPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching videos:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching videos',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Get video by ID with analytics
   */
  getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { trackView = true } = req.query;

    try {
      const video = await Video.findByPk(id, {
        include: [{
          model: User,
          attributes: ['id', 'username', 'email']
        }]
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Track view if requested
      if (trackView === 'true') {
        await this.analyticsService.trackVideoView(id, req.ip, req.headers['user-agent']);
        await video.increment('views');
      }

      // Get video analytics
      const analytics = await this.analyticsService.getVideoAnalytics(id);

      res.json({
        success: true,
        data: {
          video,
          analytics
        }
      });
    } catch (error) {
      logger.error('Error fetching video:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching video',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Create new video
   */
  createVideo = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, tags, isPrivate = false, thumbnailTime = 10000 } = req.body;
    const userId = req.user?.id || req.body.userId;

    try {
      // Create video in Bunny Stream
      const bunnyVideo = await this.bunnyService.createVideo(title, {
        description,
        tags,
        thumbnailTime
      });

      // Create video record in database
      const video = await Video.create({
        title,
        description,
        tags: Array.isArray(tags) ? tags : [],
        isPrivate,
        userId,
        bunnyVideoId: bunnyVideo.guid,
        status: 'processing',
        thumbnailTime,
        metadata: {
          bunnyData: bunnyVideo,
          createdAt: new Date()
        }
      });

      logger.info(`Video created successfully: ${video.id}`);

      res.status(201).json({
        success: true,
        message: 'Video created successfully',
        data: {
          video,
          uploadUrl: bunnyVideo.uploadUrl,
          bunnyVideoId: bunnyVideo.guid
        }
      });
    } catch (error) {
      logger.error('Error creating video:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating video',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Update video
   */
  updateVideo = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    try {
      const video = await Video.findByPk(id);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Update video in Bunny Stream if needed
      if (updateData.title || updateData.description) {
        await this.bunnyService.updateVideo(video.bunnyVideoId, {
          title: updateData.title || video.title,
          description: updateData.description || video.description
        });
      }

      // Update video in database
      await video.update(updateData);

      logger.info(`Video updated successfully: ${id}`);

      res.json({
        success: true,
        message: 'Video updated successfully',
        data: { video }
      });
    } catch (error) {
      logger.error('Error updating video:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating video',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Delete video
   */
  deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const video = await Video.findByPk(id);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Delete video from Bunny Stream
      if (video.bunnyVideoId) {
        await this.bunnyService.deleteVideo(video.bunnyVideoId);
      }

      // Delete video from database
      await video.destroy();

      logger.info(`Video deleted successfully: ${id}`);

      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting video:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting video',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Get video analytics
   */
  getVideoAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    try {
      const video = await Video.findByPk(id);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      const analytics = await this.analyticsService.getDetailedVideoAnalytics(id, period);

      res.json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      logger.error('Error fetching video analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Get video streaming URL
   */
  getStreamingUrl = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quality = 'auto' } = req.query;

    try {
      const video = await Video.findByPk(id);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      if (video.status !== 'ready') {
        return res.status(400).json({
          success: false,
          message: 'Video is not ready for streaming',
          status: video.status
        });
      }

      const streamingUrl = await this.bunnyService.getStreamingUrl(video.bunnyVideoId, quality);

      res.json({
        success: true,
        data: {
          streamingUrl,
          quality,
          videoId: id
        }
      });
    } catch (error) {
      logger.error('Error getting streaming URL:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting streaming URL',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });
}

module.exports = new VideoController();