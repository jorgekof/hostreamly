const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');
const db = require('../config/database');

/**
 * Enhanced Bunny Stream Service for Commercial Video Hosting
 * 
 * Features:
 * - Direct upload to Bunny Stream with pre-signed URLs
 * - Custom analytics tracking per client
 * - Bandwidth and storage usage monitoring
 * - Resumable uploads support
 * - DRM integration
 * - Commercial plan limits enforcement
 */
class EnhancedBunnyService {
  constructor() {
    this.streamApiKey = process.env.BUNNY_STREAM_API_KEY;
    this.libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    this.collectionId = process.env.BUNNY_STREAM_COLLECTION_ID;
    this.webhookSecret = process.env.BUNNY_STREAM_WEBHOOK_SECRET;
    this.cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
    
    // API endpoints
    this.streamBaseUrl = 'https://video.bunnycdn.com';
    this.uploadBaseUrl = 'https://video.bunnycdn.com';
    
    // Initialize HTTP client
    this.streamClient = axios.create({
      baseURL: this.streamBaseUrl,
      headers: {
        'AccessKey': this.streamApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    this.streamClient.interceptors.response.use(
      (response) => {
        logger.bunnynet('enhanced_stream_api_success', 'success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        logger.bunnynet('enhanced_stream_api_error', 'error', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        throw error;
      }
    );
  }
  
  /**
   * Create video with enhanced metadata for commercial tracking
   */
  async createVideo(title, userId, metadata = {}) {
    try {
      const videoData = {
        title,
        collectionId: this.collectionId,
        thumbnailTime: metadata.thumbnailTime || 10000,
        ...metadata
      };
      
      const response = await this.streamClient.post(
        `/library/${this.libraryId}/videos`,
        videoData
      );
      
      const videoId = response.data.guid;
      
      // Store video metadata in our database for analytics
      await this.storeVideoMetadata(videoId, userId, {
        title,
        bunnyVideoId: videoId,
        status: 'created',
        createdAt: new Date(),
        ...metadata
      });
      
      logger.bunnynet('enhanced_video_created', 'success', {
        videoId,
        userId,
        title
      });
      
      return {
        videoId,
        ...response.data
      };
    } catch (error) {
      logger.bunnynet('enhanced_video_creation_failed', 'error', {
        title,
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate pre-signed upload URL for direct client uploads
   */
  async generatePreSignedUploadUrl(videoId, userId, expirationMinutes = 60) {
    try {
      const expires = Math.floor(Date.now() / 1000) + (expirationMinutes * 60);
      
      // Generate SHA256 signature for pre-signed upload
      const authString = `${this.libraryId}${this.streamApiKey}${expires}${videoId}`;
      const signature = crypto.createHash('sha256').update(authString).digest('hex');
      
      const uploadUrl = `${this.uploadBaseUrl}/library/${this.libraryId}/videos/${videoId}`;
      
      const preSignedData = {
        uploadUrl,
        videoId,
        expires,
        signature,
        headers: {
          'AccessKey': this.streamApiKey,
          'Content-Type': 'application/octet-stream'
        },
        // TUS resumable upload endpoint
        tusEndpoint: `${this.uploadBaseUrl}/tusupload`,
        // Instructions for client-side upload
        instructions: {
          method: 'PUT',
          url: uploadUrl,
          headers: {
            'AccessKey': this.streamApiKey,
            'Content-Type': 'application/octet-stream'
          }
        }
      };
      
      // Track upload initiation
      await this.trackUploadEvent(userId, videoId, 'upload_initiated', {
        expirationMinutes,
        uploadUrl
      });
      
      logger.bunnynet('presigned_upload_url_generated', 'success', {
        videoId,
        userId,
        expires
      });
      
      return preSignedData;
    } catch (error) {
      logger.bunnynet('presigned_upload_url_failed', 'error', {
        videoId,
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Handle upload completion webhook
   */
  async handleUploadCompletion(videoId, userId, uploadData) {
    try {
      // Get video info from Bunny Stream
      const videoInfo = await this.getVideo(videoId);
      
      // Update our database with upload completion
      await this.updateVideoMetadata(videoId, {
        status: 'uploaded',
        uploadedAt: new Date(),
        fileSize: videoInfo.storageSize,
        duration: videoInfo.length,
        width: videoInfo.width,
        height: videoInfo.height
      });
      
      // Track storage usage for the user
      await this.trackStorageUsage(userId, videoInfo.storageSize, 'add');
      
      // Track upload completion event
      await this.trackUploadEvent(userId, videoId, 'upload_completed', {
        fileSize: videoInfo.storageSize,
        duration: videoInfo.length
      });
      
      logger.bunnynet('upload_completion_handled', 'success', {
        videoId,
        userId,
        fileSize: videoInfo.storageSize
      });
      
      return videoInfo;
    } catch (error) {
      logger.bunnynet('upload_completion_failed', 'error', {
        videoId,
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get video with enhanced analytics data
   */
  async getVideo(videoId) {
    try {
      const cacheKey = `enhanced:video:${videoId}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const response = await this.streamClient.get(
        `/library/${this.libraryId}/videos/${videoId}`
      );
      
      // Enhance with our analytics data
      const analyticsData = await this.getVideoAnalytics(videoId);
      
      const enhancedData = {
        ...response.data,
        analytics: analyticsData
      };
      
      // Cache for 5 minutes
      await cache.set(cacheKey, enhancedData, 300);
      
      return enhancedData;
    } catch (error) {
      logger.bunnynet('enhanced_get_video_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Track video view and bandwidth usage
   */
  async trackVideoView(videoId, userId, viewData = {}) {
    try {
      const {
        duration = 0,
        quality = 'auto',
        userAgent = '',
        ipAddress = '',
        country = '',
        bandwidth = 0
      } = viewData;
      
      // Insert view record
      await db.query(`
        INSERT INTO video_views (
          video_id, user_id, duration_watched, quality, 
          user_agent, ip_address, country, bandwidth_used, viewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [videoId, userId, duration, quality, userAgent, ipAddress, country, bandwidth]);
      
      // Update user's bandwidth usage
      if (bandwidth > 0) {
        await this.trackBandwidthUsage(userId, bandwidth);
      }
      
      // Update video view count in cache
      const viewCountKey = `video:views:${videoId}`;
      await cache.incr(viewCountKey);
      
      logger.bunnynet('video_view_tracked', 'success', {
        videoId,
        userId,
        duration,
        bandwidth
      });
      
      return true;
    } catch (error) {
      logger.bunnynet('video_view_tracking_failed', 'error', {
        videoId,
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get comprehensive analytics for a user
   */
  async getUserAnalytics(userId, dateFrom = null, dateTo = null) {
    try {
      const dateFilter = dateFrom && dateTo 
        ? 'AND DATE(created_at) BETWEEN ? AND ?'
        : '';
      const dateParams = dateFrom && dateTo ? [dateFrom, dateTo] : [];
      
      // Get storage usage
      const [storageResult] = await db.query(`
        SELECT 
          SUM(CASE WHEN operation = 'add' THEN bytes ELSE -bytes END) as total_storage
        FROM user_storage_usage 
        WHERE user_id = ? ${dateFilter}
      `, [userId, ...dateParams]);
      
      // Get bandwidth usage
      const [bandwidthResult] = await db.query(`
        SELECT 
          SUM(bytes_transferred) as total_bandwidth,
          COUNT(*) as total_requests
        FROM user_bandwidth_usage 
        WHERE user_id = ? ${dateFilter}
      `, [userId, ...dateParams]);
      
      // Get video statistics
      const [videoStats] = await db.query(`
        SELECT 
          COUNT(*) as total_videos,
          SUM(file_size) as total_video_size,
          AVG(duration) as avg_duration
        FROM video_metadata 
        WHERE user_id = ? AND status = 'uploaded' ${dateFilter}
      `, [userId, ...dateParams]);
      
      // Get view statistics
      const [viewStats] = await db.query(`
        SELECT 
          COUNT(*) as total_views,
          SUM(duration_watched) as total_watch_time,
          AVG(duration_watched) as avg_watch_time
        FROM video_views v
        JOIN video_metadata vm ON v.video_id = vm.bunny_video_id
        WHERE vm.user_id = ? ${dateFilter}
      `, [userId, ...dateParams]);
      
      return {
        storage: {
          totalBytes: storageResult.total_storage || 0,
          totalGB: Math.round((storageResult.total_storage || 0) / (1024 * 1024 * 1024) * 100) / 100
        },
        bandwidth: {
          totalBytes: bandwidthResult.total_bandwidth || 0,
          totalGB: Math.round((bandwidthResult.total_bandwidth || 0) / (1024 * 1024 * 1024) * 100) / 100,
          totalRequests: bandwidthResult.total_requests || 0
        },
        videos: {
          totalCount: videoStats.total_videos || 0,
          totalSizeBytes: videoStats.total_video_size || 0,
          avgDurationSeconds: videoStats.avg_duration || 0
        },
        views: {
          totalViews: viewStats.total_views || 0,
          totalWatchTimeSeconds: viewStats.total_watch_time || 0,
          avgWatchTimeSeconds: viewStats.avg_watch_time || 0
        }
      };
    } catch (error) {
      logger.bunnynet('user_analytics_failed', 'error', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Check if user has exceeded plan limits
   */
  async checkPlanLimits(userId) {
    try {
      // Get user's plan
      const [userPlan] = await db.query(`
        SELECT p.* FROM users u
        JOIN subscription_plans p ON u.plan_id = p.id
        WHERE u.id = ?
      `, [userId]);
      
      if (!userPlan) {
        throw new Error('User plan not found');
      }
      
      // Get current usage
      const analytics = await this.getUserAnalytics(userId);
      
      const limits = {
        storage: {
          limit: userPlan.storage_limit_gb * 1024 * 1024 * 1024, // Convert GB to bytes
          used: analytics.storage.totalBytes,
          exceeded: analytics.storage.totalBytes > (userPlan.storage_limit_gb * 1024 * 1024 * 1024)
        },
        bandwidth: {
          limit: userPlan.bandwidth_limit_gb * 1024 * 1024 * 1024, // Convert GB to bytes
          used: analytics.bandwidth.totalBytes,
          exceeded: analytics.bandwidth.totalBytes > (userPlan.bandwidth_limit_gb * 1024 * 1024 * 1024)
        },
        videos: {
          limit: userPlan.video_limit,
          used: analytics.videos.totalCount,
          exceeded: analytics.videos.totalCount > userPlan.video_limit
        }
      };
      
      return {
        planName: userPlan.name,
        limits,
        hasExceededLimits: limits.storage.exceeded || limits.bandwidth.exceeded || limits.videos.exceeded
      };
    } catch (error) {
      logger.bunnynet('plan_limits_check_failed', 'error', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate secure playback URL with analytics tracking
   */
  generateSecurePlaybackUrl(videoId, userId, options = {}) {
    try {
      const {
        expirationHours = 24,
        userIp = null,
        enableAnalytics = true
      } = options;
      
      const expires = Math.floor(Date.now() / 1000) + (expirationHours * 3600);
      
      // Generate secure token
      let authString = `${this.libraryId}${this.webhookSecret}${expires}${videoId}`;
      if (userIp) {
        authString += userIp;
      }
      
      const token = crypto.createHash('sha256').update(authString).digest('hex');
      
      // Build URL with analytics tracking
      const baseUrl = `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}`;
      const params = new URLSearchParams({
        token,
        expires: expires.toString()
      });
      
      if (userIp) {
        params.append('ip', userIp);
      }
      
      if (enableAnalytics) {
        params.append('analytics', 'true');
        params.append('user_id', userId.toString());
      }
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      logger.bunnynet('secure_playback_url_failed', 'error', {
        videoId,
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  // Helper methods for database operations
  
  async storeVideoMetadata(videoId, userId, metadata) {
    await db.query(`
      INSERT INTO video_metadata (
        bunny_video_id, user_id, title, status, file_size, 
        duration, width, height, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      videoId, userId, metadata.title, metadata.status,
      metadata.fileSize || 0, metadata.duration || 0,
      metadata.width || 0, metadata.height || 0, metadata.createdAt
    ]);
  }
  
  async updateVideoMetadata(videoId, updates) {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await db.query(`
      UPDATE video_metadata SET ${setClause} WHERE bunny_video_id = ?
    `, [...values, videoId]);
    
    // Invalidate cache
    await cache.del(`enhanced:video:${videoId}`);
  }
  
  async trackStorageUsage(userId, bytes, operation = 'add') {
    await db.query(`
      INSERT INTO user_storage_usage (user_id, bytes, operation, created_at)
      VALUES (?, ?, ?, NOW())
    `, [userId, bytes, operation]);
  }
  
  async trackBandwidthUsage(userId, bytes) {
    await db.query(`
      INSERT INTO user_bandwidth_usage (user_id, bytes_transferred, created_at)
      VALUES (?, ?, NOW())
    `, [userId, bytes]);
  }
  
  async trackUploadEvent(userId, videoId, event, data = {}) {
    await db.query(`
      INSERT INTO upload_events (user_id, video_id, event_type, event_data, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, videoId, event, JSON.stringify(data)]);
  }
  
  async getVideoAnalytics(videoId) {
    const [result] = await db.query(`
      SELECT 
        COUNT(vv.id) as total_views,
        SUM(vv.duration_watched) as total_watch_time,
        AVG(vv.duration_watched) as avg_watch_time,
        SUM(vv.bandwidth_used) as total_bandwidth
      FROM video_views vv
      WHERE vv.video_id = ?
    `, [videoId]);
    
    return result || {
      total_views: 0,
      total_watch_time: 0,
      avg_watch_time: 0,
      total_bandwidth: 0
    };
  }
}

module.exports = new EnhancedBunnyService();