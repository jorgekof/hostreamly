const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');
const axios = require('axios');

/**
 * Analytics Service for Commercial Video Hosting
 * 
 * Handles all analytics tracking, aggregation, and reporting
 * for bandwidth usage, storage consumption, and video engagement metrics.
 */
class AnalyticsService {
  constructor() {
    this.redis = cache;
    
    // Google Analytics configuration
    this.gaTrackingId = process.env.GA_TRACKING_ID;
    this.gaMeasurementId = process.env.GA_MEASUREMENT_ID;
    this.gaApiSecret = process.env.GA_API_SECRET;
    this.gaEnabled = !!(this.gaTrackingId || (this.gaMeasurementId && this.gaApiSecret));
    
    if (!this.gaEnabled) {
      logger.warn('Google Analytics not configured. Set GA_TRACKING_ID or GA_MEASUREMENT_ID + GA_API_SECRET');
    }
    
    // Cache keys
    this.CACHE_KEYS = {
      USER_ANALYTICS: (userId, dateFrom, dateTo) => `analytics:user:${userId}:${dateFrom}:${dateTo}`,
      VIDEO_ANALYTICS: (videoId) => `analytics:video:${videoId}`,
      PLAN_LIMITS: (userId) => `limits:user:${userId}`,
      BANDWIDTH_USAGE: (userId, date) => `bandwidth:${userId}:${date}`,
      STORAGE_USAGE: (userId) => `storage:${userId}`
    };
    
    // Cache TTL in seconds
    this.CACHE_TTL = {
      USER_ANALYTICS: 300, // 5 minutes
      VIDEO_ANALYTICS: 600, // 10 minutes
      PLAN_LIMITS: 1800, // 30 minutes
      BANDWIDTH_USAGE: 3600, // 1 hour
      STORAGE_USAGE: 1800 // 30 minutes
    };
  }
  
  /**
   * Track video view with detailed analytics
   */
  async trackVideoView(videoId, userId, viewData) {
    try {
      const {
        duration = 0,
        quality = 'auto',
        userAgent = '',
        ipAddress = '',
        country = null,
        bandwidth = 0
      } = viewData;
      
      const viewId = require('crypto').randomUUID();
      const timestamp = new Date();
      
      // Insert view record
      await sequelize.query(`
        INSERT INTO video_views (
          id, video_id, user_id, duration_seconds, quality,
          user_agent, ip_address, country, bandwidth_bytes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [viewId, videoId, userId, Math.floor(duration / 1000),
        quality, userAgent, ipAddress, country, bandwidth, timestamp]
      });
      
      // Update bandwidth usage if provided
      if (bandwidth > 0 && userId) {
        await this.trackBandwidthUsage(userId, bandwidth);
      }
      
      // Update real-time analytics in Redis
      await this.updateRealTimeAnalytics(videoId, userId, {
        view: 1,
        watchTime: Math.floor(duration / 1000),
        bandwidth
      });
      
      // Trigger analytics aggregation (async)
      this.aggregateVideoAnalytics(videoId).catch(error => {
        logger.error('Analytics aggregation failed', {
          videoId,
          error: error.message
        });
      });
      
      logger.debug('Video view tracked', {
        videoId,
        userId,
        duration,
        quality,
        bandwidth
      });
      
    } catch (error) {
      logger.error('Failed to track video view', {
        videoId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Track bandwidth usage for a user
   */
  async trackBandwidthUsage(userId, bytes, operation = 'add') {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const timestamp = new Date();
      
      if (operation === 'add') {
        // Insert bandwidth usage record
        await sequelize.query(`
          INSERT INTO user_bandwidth_usage (user_id, date, bytes_transferred, created_at)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          bytes_transferred = bytes_transferred + VALUES(bytes_transferred),
          updated_at = VALUES(created_at)
        `, {
          replacements: [userId, date, bytes, timestamp]
        });
        
        // Update Redis cache
        const cacheKey = this.CACHE_KEYS.BANDWIDTH_USAGE(userId, date);
        await this.redis.incrby(cacheKey, bytes);
        await this.redis.expire(cacheKey, this.CACHE_TTL.BANDWIDTH_USAGE);
      }
      
      logger.debug('Bandwidth usage tracked', {
        userId,
        bytes,
        operation,
        date
      });
      
    } catch (error) {
      logger.error('Failed to track bandwidth usage', {
        userId,
        bytes,
        operation,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Track storage usage for a user
   */
  async trackStorageUsage(userId, bytes, operation = 'add') {
    try {
      const timestamp = new Date();
      
      if (operation === 'add') {
        await sequelize.query(`
          INSERT INTO user_storage_usage (user_id, bytes_used, created_at)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          bytes_used = bytes_used + VALUES(bytes_used),
          updated_at = VALUES(created_at)
        `, {
          replacements: [userId, bytes, timestamp]
        });
      } else if (operation === 'remove') {
        await sequelize.query(`
          UPDATE user_storage_usage 
          SET bytes_used = GREATEST(0, bytes_used - ?), updated_at = ?
          WHERE user_id = ?
        `, {
          replacements: [bytes, timestamp, userId]
        });
      } else if (operation === 'set') {
        await sequelize.query(`
          INSERT INTO user_storage_usage (user_id, bytes_used, created_at)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          bytes_used = VALUES(bytes_used),
          updated_at = VALUES(created_at)
        `, {
          replacements: [userId, bytes, timestamp]
        });
      }
      
      // Clear cache
      await this.redis.del(this.CACHE_KEYS.STORAGE_USAGE(userId));
      
      logger.debug('Storage usage tracked', {
        userId,
        bytes,
        operation
      });
      
    } catch (error) {
      logger.error('Failed to track storage usage', {
        userId,
        bytes,
        operation,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId, dateFrom = null, dateTo = null) {
    try {
      // Set default date range (last 30 days)
      if (!dateFrom) {
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      if (!dateTo) {
        dateTo = new Date().toISOString().split('T')[0];
      }
      
      // Check cache first
      const cacheKey = this.CACHE_KEYS.USER_ANALYTICS(userId, dateFrom, dateTo);
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get video statistics
      const [videoStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_videos,
          SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_videos,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_videos,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_videos,
          SUM(storage_size_bytes) as total_storage_bytes
        FROM video_metadata 
        WHERE user_id = ? AND created_at BETWEEN ? AND ?
      `, {
        replacements: [userId, dateFrom + ' 00:00:00', dateTo + ' 23:59:59'],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get view statistics
      const [viewStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_views,
          SUM(duration_seconds) as total_watch_time_seconds,
          AVG(duration_seconds) as avg_watch_time_seconds,
          SUM(bandwidth_bytes) as total_bandwidth_bytes,
          COUNT(DISTINCT country) as unique_countries,
          COUNT(DISTINCT ip_address) as unique_viewers
        FROM video_views vv
        JOIN video_metadata vm ON vv.video_id = vm.bunny_video_id
        WHERE vm.user_id = ? AND vv.created_at BETWEEN ? AND ?
      `, {
        replacements: [userId, dateFrom + ' 00:00:00', dateTo + ' 23:59:59'],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get bandwidth usage by day
      const bandwidthByDay = await sequelize.query(`
        SELECT date, SUM(bytes_transferred) as bytes
        FROM user_bandwidth_usage
        WHERE user_id = ? AND date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date
      `, {
        replacements: [userId, dateFrom, dateTo],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get top performing videos
      const topVideos = await sequelize.query(`
        SELECT 
          vm.bunny_video_id,
          vm.title,
          vas.total_views,
          vas.total_watch_time_seconds,
          vas.engagement_score
        FROM video_metadata vm
        LEFT JOIN video_analytics_summary vas ON vm.bunny_video_id = vas.video_id
        WHERE vm.user_id = ? AND vm.created_at BETWEEN ? AND ?
        ORDER BY vas.total_views DESC
        LIMIT 10
      `, {
        replacements: [userId, dateFrom + ' 00:00:00', dateTo + ' 23:59:59'],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get current storage usage
      const [storageUsage] = await sequelize.query(`
        SELECT bytes_used
        FROM user_storage_usage
        WHERE user_id = ?
      `, {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      const analytics = {
        dateRange: { from: dateFrom, to: dateTo },
        videos: {
          totalCount: videoStats.total_videos || 0,
          readyCount: videoStats.ready_videos || 0,
          processingCount: videoStats.processing_videos || 0,
          failedCount: videoStats.failed_videos || 0,
          topPerforming: topVideos || []
        },
        views: {
          totalCount: viewStats.total_views || 0,
          uniqueViewers: viewStats.unique_viewers || 0,
          uniqueCountries: viewStats.unique_countries || 0
        },
        watchTime: {
          totalSeconds: viewStats.total_watch_time_seconds || 0,
          averageSeconds: Math.round(viewStats.avg_watch_time_seconds || 0),
          totalHours: Math.round((viewStats.total_watch_time_seconds || 0) / 3600 * 100) / 100
        },
        storage: {
          totalBytes: storageUsage.bytes_used || 0,
          totalMB: Math.round((storageUsage.bytes_used || 0) / 1024 / 1024 * 100) / 100,
          totalGB: Math.round((storageUsage.bytes_used || 0) / 1024 / 1024 / 1024 * 100) / 100
        },
        bandwidth: {
          totalBytes: viewStats.total_bandwidth_bytes || 0,
          totalMB: Math.round((viewStats.total_bandwidth_bytes || 0) / 1024 / 1024 * 100) / 100,
          totalGB: Math.round((viewStats.total_bandwidth_bytes || 0) / 1024 / 1024 / 1024 * 100) / 100,
          byDay: bandwidthByDay || []
        },
        engagement: {
          averageViewDuration: Math.round(viewStats.avg_watch_time_seconds || 0),
          viewsPerVideo: videoStats.total_videos > 0 ? 
            Math.round((viewStats.total_views || 0) / videoStats.total_videos * 100) / 100 : 0
        }
      };
      
      // Cache the results
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.USER_ANALYTICS,
        JSON.stringify(analytics)
      );
      
      return analytics;
      
    } catch (error) {
      logger.error('Failed to get user analytics', {
        userId,
        dateFrom,
        dateTo,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get video-specific analytics
   */
  async getVideoAnalytics(videoId) {
    try {
      // Check cache first
      const cacheKey = this.CACHE_KEYS.VIDEO_ANALYTICS(videoId);
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get video analytics from summary table
      const [summary] = await sequelize.query(`
        SELECT * FROM video_analytics_summary WHERE video_id = ?
      `, {
        replacements: [videoId],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get detailed view data
      const viewDetails = await sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as views,
          SUM(duration_seconds) as watch_time,
          AVG(duration_seconds) as avg_duration,
          COUNT(DISTINCT country) as countries,
          quality,
          COUNT(*) as quality_views
        FROM video_views 
        WHERE video_id = ? 
        GROUP BY DATE(created_at), quality
        ORDER BY date DESC, quality_views DESC
        LIMIT 30
      `, {
        replacements: [videoId],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get geographic distribution
      const geoData = await sequelize.query(`
        SELECT 
          country,
          COUNT(*) as views,
          SUM(duration_seconds) as watch_time
        FROM video_views 
        WHERE video_id = ? AND country IS NOT NULL
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `, {
        replacements: [videoId],
        type: sequelize.QueryTypes.SELECT
      });
      
      const analytics = {
        summary: summary || {
          total_views: 0,
          total_watch_time_seconds: 0,
          avg_watch_time_seconds: 0,
          total_bandwidth_bytes: 0,
          engagement_score: 0,
          unique_viewers: 0
        },
        viewsByDate: this.groupViewsByDate(viewDetails),
        qualityDistribution: this.getQualityDistribution(viewDetails),
        geographicDistribution: geoData || [],
        engagementMetrics: {
          completionRate: this.calculateCompletionRate(viewDetails),
          averageViewDuration: summary?.avg_watch_time_seconds || 0,
          retentionRate: this.calculateRetentionRate(viewDetails)
        }
      };
      
      // Cache the results
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.VIDEO_ANALYTICS,
        JSON.stringify(analytics)
      );
      
      return analytics;
      
    } catch (error) {
      logger.error('Failed to get video analytics', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Update real-time analytics in Redis
   */
  async updateRealTimeAnalytics(videoId, userId, metrics) {
    try {
      const pipeline = this.redis.pipeline();
      const today = new Date().toISOString().split('T')[0];
      
      // Update video metrics
      if (metrics.view) {
        pipeline.hincrby(`video:${videoId}:stats`, 'views', metrics.view);
        pipeline.hincrby(`video:${videoId}:stats:${today}`, 'views', metrics.view);
      }
      
      if (metrics.watchTime) {
        pipeline.hincrby(`video:${videoId}:stats`, 'watchTime', metrics.watchTime);
        pipeline.hincrby(`video:${videoId}:stats:${today}`, 'watchTime', metrics.watchTime);
      }
      
      if (metrics.bandwidth && userId) {
        pipeline.hincrby(`user:${userId}:stats:${today}`, 'bandwidth', metrics.bandwidth);
      }
      
      // Set expiration for daily stats (7 days)
      pipeline.expire(`video:${videoId}:stats:${today}`, 7 * 24 * 60 * 60);
      if (userId) {
        pipeline.expire(`user:${userId}:stats:${today}`, 7 * 24 * 60 * 60);
      }
      
      await pipeline.exec();
      
    } catch (error) {
      logger.error('Failed to update real-time analytics', {
        videoId,
        userId,
        metrics,
        error: error.message
      });
    }
  }
  
  /**
   * Aggregate video analytics (run periodically)
   */
  async aggregateVideoAnalytics(videoId) {
    try {
      const [analytics] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_views,
          SUM(duration_seconds) as total_watch_time_seconds,
          AVG(duration_seconds) as avg_watch_time_seconds,
          SUM(bandwidth_bytes) as total_bandwidth_bytes,
          COUNT(DISTINCT COALESCE(user_id, ip_address)) as unique_viewers
        FROM video_views 
        WHERE video_id = ?
      `, {
        replacements: [videoId],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (analytics) {
        const engagementScore = this.calculateEngagementScore(analytics);
        
        await sequelize.query(`
          INSERT INTO video_analytics_summary (
            video_id, total_views, total_watch_time_seconds, 
            avg_watch_time_seconds, total_bandwidth_bytes, 
            engagement_score, unique_viewers, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            total_views = VALUES(total_views),
            total_watch_time_seconds = VALUES(total_watch_time_seconds),
            avg_watch_time_seconds = VALUES(avg_watch_time_seconds),
            total_bandwidth_bytes = VALUES(total_bandwidth_bytes),
            engagement_score = VALUES(engagement_score),
            unique_viewers = VALUES(unique_viewers),
            updated_at = VALUES(updated_at)
        `, {
          replacements: [
            videoId,
            analytics.total_views,
            analytics.total_watch_time_seconds,
            analytics.avg_watch_time_seconds,
            analytics.total_bandwidth_bytes,
            engagementScore,
            analytics.unique_viewers
          ]
        });
        
        // Clear cache
        await this.redis.del(this.CACHE_KEYS.VIDEO_ANALYTICS(videoId));
      }
      
    } catch (error) {
      logger.error('Failed to aggregate video analytics', {
        videoId,
        error: error.message
      });
    }
  }
  
  // Helper methods
  
  groupViewsByDate(viewDetails) {
    const grouped = {};
    viewDetails.forEach(view => {
      if (!grouped[view.date]) {
        grouped[view.date] = {
          date: view.date,
          views: 0,
          watchTime: 0
        };
      }
      grouped[view.date].views += view.views;
      grouped[view.date].watchTime += view.watch_time;
    });
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  getQualityDistribution(viewDetails) {
    const distribution = {};
    viewDetails.forEach(view => {
      if (!distribution[view.quality]) {
        distribution[view.quality] = 0;
      }
      distribution[view.quality] += view.quality_views;
    });
    return distribution;
  }
  
  calculateCompletionRate(viewDetails) {
    // This would need video duration data to calculate properly
    // For now, return a placeholder
    return 0;
  }
  
  calculateRetentionRate(viewDetails) {
    // This would need more detailed viewing data
    // For now, return a placeholder
    return 0;
  }
  
  calculateEngagementScore(analytics) {
    if (!analytics || analytics.total_views === 0) {
      return 0;
    }
    
    const avgWatchTime = analytics.avg_watch_time_seconds || 0;
    const totalViews = analytics.total_views || 0;
    const uniqueViewers = analytics.unique_viewers || 0;
    
    // Engagement score calculation (0-100)
    let score = 0;
    
    // Watch time component (0-50 points)
    score += Math.min(avgWatchTime / 60, 50);
    
    // View count component (0-30 points)
    score += Math.min(Math.log10(totalViews + 1) * 10, 30);
    
    // Unique viewers component (0-20 points)
    if (totalViews > 0) {
      const uniqueRatio = uniqueViewers / totalViews;
      score += uniqueRatio * 20;
    }
    
    return Math.round(Math.min(score, 100));
  }

  /**
   * Send event to Google Analytics 4
   * @param {Object} event - Event data
   * @param {string} clientId - Client ID
   */
  async sendToGoogleAnalytics(event, clientId) {
    if (!this.gaEnabled || !this.gaMeasurementId || !this.gaApiSecret) {
      return;
    }

    try {
      const payload = {
        client_id: clientId,
        events: [event]
      };

      const response = await axios.post(
        `https://www.google-analytics.com/mp/collect?measurement_id=${this.gaMeasurementId}&api_secret=${this.gaApiSecret}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      logger.debug('Event sent to Google Analytics', { event: event.event_name, clientId });
    } catch (error) {
      logger.error('Error sending event to Google Analytics:', error);
    }
  }

  /**
   * Track video play event for Google Analytics
   * @param {Object} eventData - Event data
   */
  async trackGAVideoPlay(eventData) {
    if (!this.gaEnabled) return;

    try {
      const { videoId, userId, sessionId, clientId, playerConfig } = eventData;

      await this.sendToGoogleAnalytics({
        event_name: 'video_play',
        parameters: {
          video_id: videoId,
          user_id: userId,
          session_id: sessionId,
          custom_parameter_1: 'hostreamly_video',
          engagement_time_msec: 1000,
          content_group1: 'video_content'
        }
      }, clientId || `user_${userId}`);

      logger.info('GA video play event tracked', { videoId, userId });
    } catch (error) {
      logger.error('Error tracking GA video play:', error);
    }
  }

  /**
   * Track video completion event for Google Analytics
   * @param {Object} eventData - Event data
   */
  async trackGAVideoComplete(eventData) {
    if (!this.gaEnabled) return;

    try {
      const { videoId, userId, sessionId, clientId, watchTime, totalDuration } = eventData;

      await this.sendToGoogleAnalytics({
        event_name: 'video_complete',
        parameters: {
          video_id: videoId,
          user_id: userId,
          session_id: sessionId,
          watch_time: Math.round(watchTime),
          completion_rate: Math.round((watchTime / totalDuration) * 100),
          engagement_time_msec: Math.round(watchTime * 1000)
        }
      }, clientId || `user_${userId}`);

      logger.info('GA video completion event tracked', { videoId, userId, watchTime });
    } catch (error) {
      logger.error('Error tracking GA video completion:', error);
    }
  }

  /**
   * Track video progress milestones for Google Analytics
   * @param {Object} eventData - Event data
   */
  async trackGAVideoProgress(eventData) {
    if (!this.gaEnabled) return;

    try {
      const { videoId, userId, sessionId, clientId, progress, currentTime } = eventData;

      await this.sendToGoogleAnalytics({
        event_name: 'video_progress',
        parameters: {
          video_id: videoId,
          user_id: userId,
          session_id: sessionId,
          progress_percentage: progress,
          milestone: `${progress}%`,
          engagement_time_msec: Math.round(currentTime * 1000)
        }
      }, clientId || `user_${userId}`);

      logger.info('GA video progress event tracked', { videoId, progress });
    } catch (error) {
      logger.error('Error tracking GA video progress:', error);
    }
  }

  /**
   * Track embed view event for Google Analytics
   * @param {Object} eventData - Event data
   */
  async trackGAEmbedView(eventData) {
    if (!this.gaEnabled) return;

    try {
      const { videoId, embedToken, domain, referrer } = eventData;

      await this.sendToGoogleAnalytics({
        event_name: 'embed_view',
        parameters: {
          video_id: videoId,
          embed_domain: domain,
          content_group1: 'embedded_video',
          engagement_time_msec: 1000
        }
      }, embedToken);

      logger.info('GA embed view event tracked', { videoId, domain });
    } catch (error) {
      logger.error('Error tracking GA embed view:', error);
    }
  }

  /**
   * Track video upload event for Google Analytics
   * @param {Object} eventData - Event data
   */
  async trackGAVideoUpload(eventData) {
    if (!this.gaEnabled) return;

    try {
      const { videoId, userId, fileSize, duration, format } = eventData;

      await this.sendToGoogleAnalytics({
        event_name: 'video_upload',
        parameters: {
          video_id: videoId,
          user_id: userId,
          file_size_mb: Math.round(fileSize / (1024 * 1024)),
          video_duration: Math.round(duration),
          video_format: format,
          content_group1: 'user_content'
        }
      }, `user_${userId}`);

      logger.info('GA video upload event tracked', { videoId, userId });
    } catch (error) {
      logger.error('Error tracking GA video upload:', error);
    }
  }
}

module.exports = new AnalyticsService();