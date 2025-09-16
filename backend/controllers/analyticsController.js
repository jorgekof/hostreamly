const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Analytics Controller with Google Analytics Integration
 * Handles video analytics tracking and reporting
 */
class AnalyticsController {
  /**
   * Track video play event
   */
  async trackVideoPlay(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const {
        sessionId,
        clientId,
        userAgent,
        referrer,
        playerConfig,
        duration = 0,
        quality = 'auto',
        bandwidth = 0
      } = req.body;

      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Track in local analytics
      await analyticsService.trackVideoView(videoId, userId, {
        duration,
        quality,
        userAgent: userAgent || req.get('User-Agent'),
        ipAddress,
        bandwidth
      });

      // Track in Google Analytics
      await analyticsService.trackGAVideoPlay({
        videoId,
        userId,
        sessionId,
        clientId,
        playerConfig
      });

      res.json({
        success: true,
        message: 'Video play event tracked successfully'
      });

    } catch (error) {
      logger.error('Error tracking video play:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track video play event'
      });
    }
  }

  /**
   * Track video completion event
   */
  async trackVideoComplete(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const {
        sessionId,
        clientId,
        watchTime,
        totalDuration
      } = req.body;

      const userId = req.user?.id;

      // Track in Google Analytics
      await analyticsService.trackGAVideoComplete({
        videoId,
        userId,
        sessionId,
        clientId,
        watchTime,
        totalDuration
      });

      res.json({
        success: true,
        message: 'Video completion event tracked successfully'
      });

    } catch (error) {
      logger.error('Error tracking video completion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track video completion event'
      });
    }
  }

  /**
   * Track video progress milestone
   */
  async trackVideoProgress(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const {
        sessionId,
        clientId,
        progress,
        currentTime
      } = req.body;

      const userId = req.user?.id;

      // Track in Google Analytics
      await analyticsService.trackGAVideoProgress({
        videoId,
        userId,
        sessionId,
        clientId,
        progress,
        currentTime
      });

      res.json({
        success: true,
        message: 'Video progress event tracked successfully'
      });

    } catch (error) {
      logger.error('Error tracking video progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track video progress event'
      });
    }
  }

  /**
   * Track embed view event
   */
  async trackEmbedView(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const {
        embedToken,
        domain,
        referrer
      } = req.body;

      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Track in Google Analytics
      await analyticsService.trackGAEmbedView({
        videoId,
        embedToken,
        domain,
        referrer,
        userAgent,
        ipAddress
      });

      res.json({
        success: true,
        message: 'Embed view event tracked successfully'
      });

    } catch (error) {
      logger.error('Error tracking embed view:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track embed view event'
      });
    }
  }

  /**
   * Track video upload event
   */
  async trackVideoUpload(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const {
        fileSize,
        duration,
        format
      } = req.body;

      const userId = req.user?.id;

      // Track in Google Analytics
      await analyticsService.trackGAVideoUpload({
        videoId,
        userId,
        fileSize,
        duration,
        format
      });

      res.json({
        success: true,
        message: 'Video upload event tracked successfully'
      });

    } catch (error) {
      logger.error('Error tracking video upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track video upload event'
      });
    }
  }

  /**
   * Get video analytics summary
   */
  async getVideoAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const { startDate, endDate, groupBy } = req.query;
      const userId = req.user?.id;

      // Get analytics from existing service
      const analytics = await analyticsService.getVideoAnalytics(videoId, {
        userId,
        dateFrom: startDate,
        dateTo: endDate
      });

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error getting video analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get video analytics'
      });
    }
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { startDate, endDate } = req.query;
      const userId = req.user?.id;

      // Get user analytics from existing service
      const analytics = await analyticsService.getUserAnalytics(userId, {
        dateFrom: startDate,
        dateTo: endDate
      });

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user analytics'
      });
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardAnalytics(req, res) {
    try {
      const { period = '7d' } = req.query;
      const userId = req.user?.id;

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Get user analytics
      const userAnalytics = await analyticsService.getUserAnalytics(userId, {
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString()
      });

      // Get bandwidth and storage usage
      const bandwidthUsage = await analyticsService.getBandwidthUsage(userId, {
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString()
      });

      const storageUsage = await analyticsService.getStorageUsage(userId);

      res.json({
        success: true,
        data: {
          period,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          analytics: userAnalytics,
          bandwidth: bandwidthUsage,
          storage: storageUsage
        }
      });

    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard analytics'
      });
    }
  }

  /**
   * Get Google Analytics configuration status
   */
  async getGAStatus(req, res) {
    try {
      const gaEnabled = analyticsService.gaEnabled;
      const hasTrackingId = !!analyticsService.gaTrackingId;
      const hasMeasurementId = !!analyticsService.gaMeasurementId;
      const hasApiSecret = !!analyticsService.gaApiSecret;

      res.json({
        success: true,
        data: {
          enabled: gaEnabled,
          configuration: {
            trackingId: hasTrackingId,
            measurementId: hasMeasurementId,
            apiSecret: hasApiSecret
          },
          status: gaEnabled ? 'configured' : 'not_configured'
        }
      });

    } catch (error) {
      logger.error('Error getting GA status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Google Analytics status'
      });
    }
  }
}

module.exports = new AnalyticsController();