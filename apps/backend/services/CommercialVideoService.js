const BunnyService = require('./BunnyService');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');
const Video = require('../models/Video');
const User = require('../models/User');
const Analytics = require('../models/Analytics');

class CommercialVideoService {
  constructor() {
    this.bunnyService = BunnyService;
    this.transcodingProfiles = {
      '240p': { width: 426, height: 240, bitrate: 400 },
      '360p': { width: 640, height: 360, bitrate: 800 },
      '480p': { width: 854, height: 480, bitrate: 1200 },
      '720p': { width: 1280, height: 720, bitrate: 2500 },
      '1080p': { width: 1920, height: 1080, bitrate: 5000 },
      '1440p': { width: 2560, height: 1440, bitrate: 8000 },
      '2160p': { width: 3840, height: 2160, bitrate: 15000 }
    };
  }

  /**
   * Upload video with commercial features
   */
  async uploadCommercialVideo(userId, file, metadata = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Check user limits based on plan
      await this.checkUserLimits(user, file.size);

      // Create video record in database
      const video = await Video.create({
        user_id: userId,
        title: metadata.title || 'Untitled Video',
        description: metadata.description || '',
        filename: file.filename,
        original_filename: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        status: 'uploading',
        visibility: metadata.visibility || 'private',
        tags: metadata.tags || [],
        category: metadata.category || 'general',
        monetization_enabled: metadata.monetization_enabled || false,
        price: metadata.price || null,
        drm_enabled: process.env.BUNNY_DRM_ENABLED === 'true'
      });

      // Create video in Bunny Stream
      const bunnyVideo = await this.bunnyService.createVideo(
        video.title,
        process.env.BUNNY_STREAM_COLLECTION_ID
      );

      // Update video with Bunny ID
      await video.update({
        bunny_video_id: bunnyVideo.guid,
        bunny_library_id: bunnyVideo.videoLibraryId
      });

      // Upload to Bunny Stream
      video.status = 'processing';
      await video.save();

      const uploadResult = await this.bunnyService.uploadVideo(
        bunnyVideo.guid,
        file.path
      );

      // Configure transcoding profiles
      await this.configureTranscoding(bunnyVideo.guid, metadata.quality_profiles);

      // Enable DRM if required
      if (video.drm_enabled) {
        await this.enableDRM(bunnyVideo.guid);
      }

      // Set up analytics tracking
      await this.setupAnalytics(video.id, bunnyVideo.guid);

      logger.info('Commercial video uploaded successfully', {
        videoId: video.id,
        bunnyVideoId: bunnyVideo.guid,
        userId,
        fileSize: file.size
      });

      return {
        video,
        bunnyVideo,
        uploadResult
      };
    } catch (error) {
      logger.error('Commercial video upload failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Configure transcoding profiles for commercial quality
   */
  async configureTranscoding(videoId, requestedProfiles = []) {
    try {
      // Default profiles for commercial use
      const defaultProfiles = ['360p', '720p', '1080p'];
      const profiles = requestedProfiles.length > 0 ? requestedProfiles : defaultProfiles;

      const transcodingConfig = {
        enableTranscoding: true,
        profiles: profiles.map(profile => ({
          name: profile,
          ...this.transcodingProfiles[profile]
        }))
      };

      await this.bunnyService.updateVideo(videoId, transcodingConfig);

      logger.info('Transcoding configured', {
        videoId,
        profiles
      });

      return transcodingConfig;
    } catch (error) {
      logger.error('Transcoding configuration failed', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Enable DRM protection
   */
  async enableDRM(videoId) {
    try {
      const drmConfig = {
        enableDRM: true,
        enableMP4Fallback: false,
        enableTokenAuthentication: process.env.BUNNY_TOKEN_AUTH_ENABLED === 'true',
        enableGeoBlocking: false,
        allowedCountries: [],
        blockedCountries: []
      };

      await this.bunnyService.enableDrm(videoId, drmConfig);

      logger.info('DRM enabled for video', {
        videoId,
        config: drmConfig
      });

      return drmConfig;
    } catch (error) {
      logger.error('DRM enablement failed', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Setup analytics tracking
   */
  async setupAnalytics(videoId, bunnyVideoId) {
    try {
      const analyticsConfig = {
        videoId,
        bunnyVideoId,
        trackViews: true,
        trackEngagement: true,
        trackGeography: true,
        trackDevices: true,
        trackReferrers: true
      };

      await cache.set(`analytics:config:${videoId}`, analyticsConfig, 86400);

      logger.info('Analytics configured for video', {
        videoId,
        bunnyVideoId
      });

      return analyticsConfig;
    } catch (error) {
      logger.error('Analytics setup failed', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check user limits based on subscription plan
   */
  async checkUserLimits(user, fileSize) {
    try {
      const plan = user.subscription_plan || 'free';
      const limits = await this.getUserLimits(plan);

      // Check storage limit
      const currentUsage = await this.getUserStorageUsage(user.id);
      if (currentUsage + fileSize > limits.storage) {
        throw new Error(`Límite de almacenamiento excedido. Plan ${plan}: ${limits.storage / (1024**3)}GB`);
      }

      // Check monthly upload limit
      const monthlyUploads = await this.getMonthlyUploads(user.id);
      if (monthlyUploads >= limits.monthlyUploads) {
        throw new Error(`Límite de subidas mensuales excedido. Plan ${plan}: ${limits.monthlyUploads} videos`);
      }

      return true;
    } catch (error) {
      logger.error('User limits check failed', {
        userId: user.id,
        fileSize,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user limits based on plan
   */
  async getUserLimits(plan) {
    const limits = {
      free: {
        storage: parseInt(process.env.FREE_STORAGE_LIMIT) || 1 * 1024**3, // 1GB
        bandwidth: parseInt(process.env.FREE_BANDWIDTH_LIMIT) || 10 * 1024**3, // 10GB
        monthlyUploads: 10,
        maxFileSize: 500 * 1024**2, // 500MB
        drm: false,
        analytics: false,
        monetization: false
      },
      premium: {
        storage: parseInt(process.env.PREMIUM_STORAGE_LIMIT) || 100 * 1024**3, // 100GB
        bandwidth: parseInt(process.env.PREMIUM_BANDWIDTH_LIMIT) || 1000 * 1024**3, // 1TB
        monthlyUploads: 1000,
        maxFileSize: 5 * 1024**3, // 5GB
        drm: true,
        analytics: true,
        monetization: true
      },
      enterprise: {
        storage: Infinity,
        bandwidth: Infinity,
        monthlyUploads: Infinity,
        maxFileSize: 50 * 1024**3, // 50GB
        drm: true,
        analytics: true,
        monetization: true
      }
    };

    return limits[plan] || limits.free;
  }

  /**
   * Get user storage usage
   */
  async getUserStorageUsage(userId) {
    try {
      const cacheKey = `storage:usage:${userId}`;
      let usage = await cache.get(cacheKey);

      if (usage === null) {
        const result = await Video.sum('file_size', {
          where: { user_id: userId }
        });
        usage = result || 0;
        await cache.set(cacheKey, usage, 3600); // Cache for 1 hour
      }

      return usage;
    } catch (error) {
      logger.error('Failed to get user storage usage', {
        userId,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Get monthly uploads count
   */
  async getMonthlyUploads(userId) {
    try {
      const { Op } = require('sequelize');
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const count = await Video.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: startOfMonth
          }
        }
      });

      return count;
    } catch (error) {
      logger.error('Failed to get monthly uploads', {
        userId,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Generate monetized video player
   */
  async generateMonetizedPlayer(videoId, userId = null, options = {}) {
    try {
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new Error('Video no encontrado');
      }

      // Check if user has access to monetized content
      if (video.monetization_enabled && video.price > 0) {
        const hasAccess = await this.checkVideoAccess(videoId, userId);
        if (!hasAccess) {
          return {
            requiresPurchase: true,
            price: video.price,
            currency: 'USD',
            purchaseUrl: `/api/videos/${videoId}/purchase`
          };
        }
      }

      // Generate signed URL for secure playback
      const signedUrl = this.bunnyService.generateSignedUrl(
        video.bunny_video_id,
        options.expirationTime || 3600,
        options.userIp
      );

      // Get embed code with custom player
      const embedCode = this.bunnyService.getEmbedCode(video.bunny_video_id, {
        ...options,
        responsive: true,
        controls: true
      });

      return {
        signedUrl,
        embedCode,
        thumbnailUrl: this.bunnyService.getThumbnailUrl(video.bunny_video_id),
        hlsUrl: this.bunnyService.getHlsUrl(video.bunny_video_id),
        requiresPurchase: false
      };
    } catch (error) {
      logger.error('Failed to generate monetized player', {
        videoId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if user has access to video
   */
  async checkVideoAccess(videoId, userId) {
    try {
      if (!userId) return false;

      const video = await Video.findByPk(videoId);
      if (!video) return false;

      // Owner always has access
      if (video.user_id === userId) return true;

      // Check if video is free
      if (!video.monetization_enabled || video.price === 0) return true;

      // Check if user has purchased the video
      // This would require a Purchase model
      // const purchase = await Purchase.findOne({
      //   where: { video_id: videoId, user_id: userId, status: 'completed' }
      // });
      // return !!purchase;

      return false;
    } catch (error) {
      logger.error('Failed to check video access', {
        videoId,
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get comprehensive video analytics
   */
  async getVideoAnalytics(videoId, dateRange = {}) {
    try {
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new Error('Video no encontrado');
      }

      // Get Bunny.net statistics
      const bunnyStats = await this.bunnyService.getVideoStatistics(
        video.bunny_video_id,
        dateRange.from,
        dateRange.to
      );

      // Get internal analytics
      const internalStats = await Analytics.getVideoAnalytics(videoId, dateRange);

      return {
        bunnyStats,
        internalStats,
        summary: {
          totalViews: bunnyStats.viewCount || 0,
          totalWatchTime: bunnyStats.watchTime || 0,
          averageWatchTime: bunnyStats.averageWatchTime || 0,
          engagement: internalStats.engagement || 0,
          revenue: internalStats.revenue || 0
        }
      };
    } catch (error) {
      logger.error('Failed to get video analytics', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new CommercialVideoService();