const enhancedBunnyService = require('../services/EnhancedBunnyService');
const webhookService = require('../services/WebhookService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Enhanced Video Controller for Commercial Video Hosting
 * 
 * Features:
 * - Direct upload to Bunny Stream with pre-signed URLs
 * - Real-time analytics tracking
 * - Plan limits enforcement
 * - Bandwidth and storage monitoring
 */
class EnhancedVideoController {
  
  /**
   * Create a new video and get pre-signed upload URL
   */
  async createVideoUpload(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const userId = req.user.id;
      const { title, description, tags, isPrivate = false, thumbnailTime = 10000 } = req.body;
      
      // Check plan limits before allowing upload
      const planLimits = await enhancedBunnyService.checkPlanLimits(userId);
      
      if (planLimits.hasExceededLimits) {
        return res.status(403).json({
          success: false,
          message: 'Plan limits exceeded',
          limits: planLimits.limits,
          planName: planLimits.planName
        });
      }
      
      // Create video in Bunny Stream
      const videoData = await enhancedBunnyService.createVideo(title, userId, {
        description,
        tags,
        isPrivate,
        thumbnailTime
      });
      
      // Generate pre-signed upload URL
      const uploadData = await enhancedBunnyService.generatePreSignedUploadUrl(
        videoData.videoId,
        userId,
        60 // 60 minutes expiration
      );
      
      // Disparar webhook de video creado
      try {
        await webhookService.onVideoCreated(userId, {
          id: videoData.videoId,
          title,
          description,
          tags,
          isPrivate,
          size: 0, // Se actualizará cuando se complete la subida
          format: 'pending'
        });
      } catch (webhookError) {
        logger.warn('Failed to trigger video.created webhook', {
          userId,
          videoId: videoData.videoId,
          error: webhookError.message
        });
      }
      
      logger.info('Video upload initiated', {
        userId,
        videoId: videoData.videoId,
        title
      });
      
      res.status(201).json({
        success: true,
        message: 'Video created successfully. Use the upload URL to upload your file.',
        data: {
          videoId: videoData.videoId,
          title,
          uploadUrl: uploadData.uploadUrl,
          uploadHeaders: uploadData.headers,
          tusEndpoint: uploadData.tusEndpoint,
          instructions: uploadData.instructions,
          expiresAt: new Date(uploadData.expires * 1000).toISOString(),
          remainingLimits: {
            storage: {
              used: planLimits.limits.storage.used,
              limit: planLimits.limits.storage.limit,
              remaining: planLimits.limits.storage.limit - planLimits.limits.storage.used
            },
            videos: {
              used: planLimits.limits.videos.used,
              limit: planLimits.limits.videos.limit,
              remaining: planLimits.limits.videos.limit - planLimits.limits.videos.used
            }
          }
        }
      });
      
    } catch (error) {
      logger.error('Video upload creation failed', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create video upload',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Handle upload completion webhook from Bunny Stream
   */
  async handleUploadWebhook(req, res) {
    try {
      const { videoId, status, userId } = req.body;
      
      if (!videoId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: videoId, userId'
        });
      }
      
      if (status === 'uploaded') {
        // Handle successful upload
        const videoInfo = await enhancedBunnyService.handleUploadCompletion(
          videoId,
          userId,
          req.body
        );
        
        // Disparar webhook de encoding iniciado
        try {
          await webhookService.onVideoEncodingStarted(userId, {
            id: videoId,
            encoding_profile: 'standard'
          });
        } catch (webhookError) {
          logger.warn('Failed to trigger video.encoding.started webhook', {
            userId,
            videoId,
            error: webhookError.message
          });
        }
        
        logger.info('Upload webhook processed', {
          videoId,
          userId,
          status,
          fileSize: videoInfo.storageSize
        });
        
        res.json({
          success: true,
          message: 'Upload completion processed successfully',
          data: videoInfo
        });
      } else {
        // Handle failed upload
        logger.warn('Upload failed webhook received', {
          videoId,
          userId,
          status,
          body: req.body
        });
        
        res.json({
          success: true,
          message: 'Upload failure processed'
        });
      }
      
    } catch (error) {
      logger.error('Upload webhook processing failed', {
        error: error.message,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to process upload webhook'
      });
    }
  }
  
  /**
   * Get video with enhanced analytics
   */
  async getVideo(req, res) {
    try {
      const { videoId } = req.params;
      const userId = req.user.id;
      
      const video = await enhancedBunnyService.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }
      
      // Generate secure playback URL
      const playbackUrl = enhancedBunnyService.generateSecurePlaybackUrl(
        videoId,
        userId,
        {
          expirationHours: 24,
          userIp: req.ip,
          enableAnalytics: true
        }
      );
      
      res.json({
        success: true,
        data: {
          ...video,
          playbackUrl,
          thumbnailUrl: `https://vz-${process.env.BUNNY_STREAM_LIBRARY_ID}.b-cdn.net/${videoId}/thumbnail.jpg`,
          previewUrl: `https://vz-${process.env.BUNNY_STREAM_LIBRARY_ID}.b-cdn.net/${videoId}/preview.webp`
        }
      });
      
    } catch (error) {
      logger.error('Get video failed', {
        videoId: req.params.videoId,
        userId: req.user?.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve video'
      });
    }
  }
  
  /**
   * Track video view for analytics
   */
  async trackVideoView(req, res) {
    try {
      const { videoId } = req.params;
      const userId = req.user?.id; // Can be null for anonymous views
      const {
        duration = 0,
        quality = 'auto',
        bandwidth = 0,
        country = null
      } = req.body;
      
      await enhancedBunnyService.trackVideoView(videoId, userId, {
        duration,
        quality,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        country,
        bandwidth
      });
      
      res.json({
        success: true,
        message: 'Video view tracked successfully'
      });
      
    } catch (error) {
      logger.error('Video view tracking failed', {
        videoId: req.params.videoId,
        userId: req.user?.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to track video view'
      });
    }
  }
  
  /**
   * Get user analytics dashboard
   */
  async getUserAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { dateFrom, dateTo } = req.query;
      
      const analytics = await enhancedBunnyService.getUserAnalytics(
        userId,
        dateFrom,
        dateTo
      );
      
      const planLimits = await enhancedBunnyService.checkPlanLimits(userId);
      
      res.json({
        success: true,
        data: {
          analytics,
          planLimits,
          usagePercentages: {
            storage: Math.round((analytics.storage.totalBytes / planLimits.limits.storage.limit) * 100),
            bandwidth: Math.round((analytics.bandwidth.totalBytes / planLimits.limits.bandwidth.limit) * 100),
            videos: Math.round((analytics.videos.totalCount / planLimits.limits.videos.limit) * 100)
          }
        }
      });
      
    } catch (error) {
      logger.error('Get user analytics failed', {
        userId: req.user.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics'
      });
    }
  }
  
  /**
   * Get video analytics for a specific video
   */
  async getVideoAnalytics(req, res) {
    try {
      const { videoId } = req.params;
      const userId = req.user.id;
      
      // Verify user owns this video
      const video = await enhancedBunnyService.getVideo(videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this video'
        });
      }
      
      res.json({
        success: true,
        data: {
          videoId,
          analytics: video.analytics,
          engagementScore: this.calculateEngagementScore(video.analytics)
        }
      });
      
    } catch (error) {
      logger.error('Get video analytics failed', {
        videoId: req.params.videoId,
        userId: req.user.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve video analytics'
      });
    }
  }
  
  /**
   * Get user's videos list with pagination
   */
  async getUserVideos(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
      
      const offset = (page - 1) * limit;
      
      let statusFilter = '';
      let searchFilter = '';
      const params = [userId];
      
      if (status !== 'all') {
        statusFilter = 'AND status = ?';
        params.push(status);
      }
      
      if (search) {
        searchFilter = 'AND title LIKE ?';
        params.push(`%${search}%`);
      }
      
      const db = require('../config/database');
      
      // Get videos with analytics
      const [videos] = await db.query(`
        SELECT 
          vm.*,
          vas.total_views,
          vas.total_watch_time_seconds,
          vas.total_bandwidth_bytes,
          vas.engagement_score
        FROM video_metadata vm
        LEFT JOIN video_analytics_summary vas ON vm.bunny_video_id = vas.video_id
        WHERE vm.user_id = ? ${statusFilter} ${searchFilter}
        ORDER BY vm.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);
      
      // Get total count
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total
        FROM video_metadata
        WHERE user_id = ? ${statusFilter} ${searchFilter}
      `, params);
      
      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);
      
      res.json({
        success: true,
        data: {
          videos: videos.map(video => ({
            ...video,
            thumbnailUrl: `https://vz-${process.env.BUNNY_STREAM_LIBRARY_ID}.b-cdn.net/${video.bunny_video_id}/thumbnail.jpg`,
            previewUrl: `https://vz-${process.env.BUNNY_STREAM_LIBRARY_ID}.b-cdn.net/${video.bunny_video_id}/preview.webp`
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get user videos failed', {
        userId: req.user.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve videos'
      });
    }
  }
  
  /**
   * Delete video
   */
  async deleteVideo(req, res) {
    try {
      const { videoId } = req.params;
      const userId = req.user.id;
      
      // Verify user owns this video
      const video = await enhancedBunnyService.getVideo(videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this video'
        });
      }
      
      // Delete from Bunny Stream
      await enhancedBunnyService.deleteVideo(videoId);
      
      // Update storage usage
      if (video.storageSize > 0) {
        await enhancedBunnyService.trackStorageUsage(userId, video.storageSize, 'remove');
      }
      
      logger.info('Video deleted successfully', {
        videoId,
        userId,
        title: video.title
      });
      
      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
      
    } catch (error) {
      logger.error('Video deletion failed', {
        videoId: req.params.videoId,
        userId: req.user.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete video'
      });
    }
  }
  
  // Helper methods
  
  calculateEngagementScore(analytics) {
    if (!analytics || analytics.total_views === 0) {
      return 0;
    }
    
    const avgWatchTime = analytics.avg_watch_time || 0;
    const totalViews = analytics.total_views || 0;
    
    // Simple engagement score calculation (0-100)
    // Based on average watch time and view count
    let score = 0;
    
    // Watch time component (0-70 points)
    if (avgWatchTime > 0) {
      score += Math.min(avgWatchTime / 60, 70); // Max 70 points for 60+ seconds avg watch time
    }
    
    // View count component (0-30 points)
    if (totalViews > 0) {
      score += Math.min(Math.log10(totalViews) * 10, 30); // Logarithmic scale for views
    }
    
    return Math.round(Math.min(score, 100));
  }
}

module.exports = new EnhancedVideoController();