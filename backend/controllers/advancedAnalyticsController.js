const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
// const ExcelJS = require('exceljs'); // Temporarily disabled - package not installed
// const PDFDocument = require('pdfkit'); // Temporarily disabled - package not installed
const { redis } = require('../config/redis');
const analyticsService = require('../services/AnalyticsService');

/**
 * Advanced Analytics Controller for Enterprise Features
 * 
 * Provides comprehensive analytics, custom reports, data export,
 * and enterprise-level insights.
 */
class AdvancedAnalyticsController {
  
  /**
   * Get comprehensive dashboard analytics
   * @route GET /api/analytics/dashboard
   */
  async getDashboardAnalytics(req, res, next) {
    try {
      const { period = '30d', timezone = 'UTC' } = req.query;
      const userId = req.user.id;
      
      // Cache key for dashboard analytics
      const cacheKey = `analytics:dashboard:${userId}:${period}:${timezone}`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }
      
      const [periodDays, startDate] = this.parsePeriod(period);
      
      // Parallel execution of analytics queries
      const [videoMetrics, livestreamMetrics, storageMetrics, bandwidthMetrics, 
             engagementMetrics, geographicData, deviceData, qualityMetrics] = await Promise.all([
        this.getVideoMetrics(userId, startDate, timezone),
        this.getLivestreamMetrics(userId, startDate, timezone),
        this.getStorageMetrics(userId, startDate),
        this.getBandwidthMetrics(userId, startDate),
        this.getEngagementMetrics(userId, startDate, timezone),
        this.getGeographicData(userId, startDate),
        this.getDeviceData(userId, startDate),
        this.getQualityMetrics(userId, startDate)
      ]);
      
      const dashboardData = {
        period,
        timezone,
        generated_at: new Date().toISOString(),
        video_metrics: videoMetrics,
        livestream_metrics: livestreamMetrics,
        storage_metrics: storageMetrics,
        bandwidth_metrics: bandwidthMetrics,
        engagement_metrics: engagementMetrics,
        geographic_data: geographicData,
        device_data: deviceData,
        quality_metrics: qualityMetrics
      };
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(dashboardData));
      
      res.json({
        success: true,
        data: dashboardData
      });
      
    } catch (error) {
      logger.error('Failed to get dashboard analytics', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Get custom analytics report
   * @route POST /api/analytics/custom-report
   */
  async getCustomReport(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { 
        metrics, 
        filters, 
        groupBy, 
        dateRange, 
        timezone = 'UTC',
        limit = 1000 
      } = req.body;
      
      const userId = req.user.id;
      
      // Build dynamic query based on requested metrics and filters
      const reportData = await this.buildCustomReport({
        userId,
        metrics,
        filters,
        groupBy,
        dateRange,
        timezone,
        limit
      });
      
      res.json({
        success: true,
        data: {
          report: reportData,
          metadata: {
            generated_at: new Date().toISOString(),
            timezone,
            total_records: reportData.length,
            filters_applied: filters,
            metrics_included: metrics
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to generate custom report', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Export analytics data
   * @route POST /api/analytics/export
   */
  async exportAnalytics(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { 
        format, 
        reportType, 
        dateRange, 
        metrics,
        filters = {},
        timezone = 'UTC' 
      } = req.body;
      
      const userId = req.user.id;
      
      // Get data based on report type
      let data;
      switch (reportType) {
        case 'dashboard':
          data = await this.getDashboardData(userId, dateRange, timezone);
          break;
        case 'videos':
          data = await this.getVideoReportData(userId, dateRange, filters, timezone);
          break;
        case 'livestreams':
          data = await this.getLivestreamReportData(userId, dateRange, filters, timezone);
          break;
        case 'engagement':
          data = await this.getEngagementReportData(userId, dateRange, filters, timezone);
          break;
        case 'custom':
          data = await this.buildCustomReport({
            userId, metrics, filters, dateRange, timezone, limit: 10000
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid report type'
          });
      }
      
      // Generate export based on format
      let exportBuffer, contentType, filename;
      
      switch (format) {
        case 'excel':
          ({ buffer: exportBuffer, filename } = await this.generateExcelExport(data, reportType, dateRange));
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          ({ buffer: exportBuffer, filename } = await this.generateCSVExport(data, reportType, dateRange));
          contentType = 'text/csv';
          break;
        case 'pdf':
          ({ buffer: exportBuffer, filename } = await this.generatePDFExport(data, reportType, dateRange));
          contentType = 'application/pdf';
          break;
        case 'json':
          exportBuffer = Buffer.from(JSON.stringify(data, null, 2));
          contentType = 'application/json';
          filename = `${reportType}-${dateRange.start}-${dateRange.end}.json`;
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid export format'
          });
      }
      
      // Log export activity
      logger.info('Analytics export generated', {
        userId,
        reportType,
        format,
        dateRange,
        dataSize: exportBuffer.length
      });
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', exportBuffer.length);
      
      res.send(exportBuffer);
      
    } catch (error) {
      logger.error('Failed to export analytics', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Get real-time analytics
   * @route GET /api/analytics/realtime
   */
  async getRealtimeAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { metrics = ['viewers', 'bandwidth', 'storage'] } = req.query;
      
      const realtimeData = {};
      
      // Get real-time metrics from Redis
      if (metrics.includes('viewers')) {
        const activeViewers = await redis.get(`realtime:viewers:${userId}`) || 0;
        realtimeData.active_viewers = parseInt(activeViewers);
      }
      
      if (metrics.includes('bandwidth')) {
        const currentBandwidth = await redis.get(`realtime:bandwidth:${userId}`) || 0;
        realtimeData.current_bandwidth_mbps = parseFloat(currentBandwidth);
      }
      
      if (metrics.includes('storage')) {
        const [storageUsed] = await sequelize.query(`
          SELECT SUM(size) as total_size FROM videos WHERE user_id = ?
        `, {
          replacements: [userId],
          type: sequelize.QueryTypes.SELECT
        });
        realtimeData.storage_used_bytes = storageUsed?.total_size || 0;
      }
      
      if (metrics.includes('streams')) {
        const activeStreams = await redis.get(`realtime:streams:${userId}`) || 0;
        realtimeData.active_streams = parseInt(activeStreams);
      }
      
      res.json({
        success: true,
        data: {
          ...realtimeData,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Failed to get realtime analytics', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Get analytics trends and predictions
   * @route GET /api/analytics/trends
   */
  async getAnalyticsTrends(req, res, next) {
    try {
      const { metric, period = '30d', forecast = false } = req.query;
      const userId = req.user.id;
      
      const [periodDays, startDate] = this.parsePeriod(period);
      
      // Get historical data for trend analysis
      const trendData = await this.getTrendData(userId, metric, startDate, periodDays);
      
      // Calculate trend metrics
      const trends = this.calculateTrends(trendData);
      
      let forecastData = null;
      if (forecast === 'true') {
        forecastData = this.generateForecast(trendData, 7); // 7-day forecast
      }
      
      res.json({
        success: true,
        data: {
          metric,
          period,
          historical_data: trendData,
          trends,
          forecast: forecastData,
          generated_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Failed to get analytics trends', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Get comparative analytics
   * @route POST /api/analytics/compare
   */
  async getComparativeAnalytics(req, res, next) {
    try {
      const { periods, metrics } = req.body;
      const userId = req.user.id;
      
      const comparisons = [];
      
      for (const period of periods) {
        const [periodDays, startDate] = this.parsePeriod(period.range);
        const periodData = {};
        
        for (const metric of metrics) {
          periodData[metric] = await this.getMetricData(userId, metric, startDate, periodDays);
        }
        
        comparisons.push({
          period: period.range,
          label: period.label,
          data: periodData
        });
      }
      
      // Calculate percentage changes between periods
      const changes = this.calculatePeriodChanges(comparisons, metrics);
      
      res.json({
        success: true,
        data: {
          comparisons,
          changes,
          generated_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Failed to get comparative analytics', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  // Helper methods
  
  parsePeriod(period) {
    const periodMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = periodMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return [days, startDate];
  }
  
  async getVideoMetrics(userId, startDate, timezone) {
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_videos,
        SUM(size) as total_size,
        AVG(duration) as avg_duration,
        SUM(views) as total_views,
        COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_videos
      FROM videos 
      WHERE user_id = ?
    `, {
      replacements: [startDate, userId],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async getLivestreamMetrics(userId, startDate, timezone) {
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_streams,
        AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_duration,
        SUM(peak_viewers) as total_peak_viewers,
        COUNT(CASE WHEN started_at >= ? THEN 1 END) as new_streams
      FROM livestreams 
      WHERE user_id = ? AND started_at IS NOT NULL
    `, {
      replacements: [startDate, userId],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async getStorageMetrics(userId, startDate) {
    const [results] = await sequelize.query(`
      SELECT 
        SUM(size) as current_usage,
        COUNT(*) as file_count,
        AVG(size) as avg_file_size
      FROM videos 
      WHERE user_id = ?
    `, {
      replacements: [userId],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async getBandwidthMetrics(userId, startDate) {
    const [results] = await sequelize.query(`
      SELECT 
        SUM(bytes_transferred) as total_bandwidth,
        AVG(bytes_transferred) as avg_bandwidth,
        COUNT(*) as total_requests
      FROM bandwidth_usage 
      WHERE user_id = ? AND created_at >= ?
    `, {
      replacements: [userId, startDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results || { total_bandwidth: 0, avg_bandwidth: 0, total_requests: 0 };
  }
  
  async getEngagementMetrics(userId, startDate, timezone) {
    const [results] = await sequelize.query(`
      SELECT 
        AVG(watch_time / duration * 100) as avg_completion_rate,
        AVG(engagement_score) as avg_engagement_score,
        COUNT(DISTINCT video_id) as videos_with_views
      FROM video_analytics 
      WHERE user_id = ? AND created_at >= ?
    `, {
      replacements: [userId, startDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results || { avg_completion_rate: 0, avg_engagement_score: 0, videos_with_views: 0 };
  }
  
  async getGeographicData(userId, startDate) {
    const results = await sequelize.query(`
      SELECT 
        country,
        COUNT(*) as views,
        SUM(watch_time) as total_watch_time
      FROM video_views 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY country
      ORDER BY views DESC
      LIMIT 10
    `, {
      replacements: [userId, startDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async getDeviceData(userId, startDate) {
    const results = await sequelize.query(`
      SELECT 
        device_type,
        COUNT(*) as views,
        AVG(watch_time) as avg_watch_time
      FROM video_views 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY device_type
      ORDER BY views DESC
    `, {
      replacements: [userId, startDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async getQualityMetrics(userId, startDate) {
    const results = await sequelize.query(`
      SELECT 
        quality,
        COUNT(*) as views,
        AVG(bandwidth) as avg_bandwidth
      FROM video_views 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY quality
      ORDER BY views DESC
    `, {
      replacements: [userId, startDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async buildCustomReport(params) {
    const { userId, metrics, filters, groupBy, dateRange, timezone, limit } = params;
    
    // This is a simplified implementation
    // In a real scenario, you'd build dynamic SQL based on the parameters
    const results = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(views) as total_views,
        AVG(duration) as avg_duration
      FROM videos 
      WHERE user_id = ? 
        AND created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT ?
    `, {
      replacements: [userId, dateRange.start, dateRange.end, limit],
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
  }
  
  async generateExcelExport(data, reportType, dateRange) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics Report');
    
    // Add headers based on data structure
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Add data rows
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${reportType}-${dateRange.start}-${dateRange.end}.xlsx`;
    
    return { buffer, filename };
  }
  
  async generateCSVExport(data, reportType, dateRange) {
    let csv = '';
    
    if (data.length > 0) {
      // Headers
      csv += Object.keys(data[0]).join(',') + '\n';
      
      // Data rows
      data.forEach(row => {
        csv += Object.values(row).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',') + '\n';
      });
    }
    
    const buffer = Buffer.from(csv);
    const filename = `${reportType}-${dateRange.start}-${dateRange.end}.csv`;
    
    return { buffer, filename };
  }
  
  async generatePDFExport(data, reportType, dateRange) {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content to PDF
    doc.fontSize(20).text('Analytics Report', 100, 100);
    doc.fontSize(12).text(`Report Type: ${reportType}`, 100, 140);
    doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 100, 160);
    doc.text(`Generated: ${new Date().toISOString()}`, 100, 180);
    
    // Add data summary
    doc.text(`Total Records: ${data.length}`, 100, 220);
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const filename = `${reportType}-${dateRange.start}-${dateRange.end}.pdf`;
        resolve({ buffer, filename });
      });
    });
  }
  
  calculateTrends(data) {
    if (data.length < 2) return { trend: 'insufficient_data' };
    
    const values = data.map(d => d.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    const change = lastValue - firstValue;
    const percentChange = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    
    return {
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      change,
      percent_change: percentChange,
      first_value: firstValue,
      last_value: lastValue
    };
  }
  
  generateForecast(historicalData, days) {
    // Simple linear regression forecast
    if (historicalData.length < 3) return null;
    
    const values = historicalData.map(d => d.value);
    const n = values.length;
    
    // Calculate trend
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const forecastValue = intercept + slope * (n + i - 1);
      forecast.push({
        day: i,
        predicted_value: Math.max(0, forecastValue) // Ensure non-negative
      });
    }
    
    return forecast;
  }
  
  calculatePeriodChanges(comparisons, metrics) {
    const changes = {};
    
    if (comparisons.length < 2) return changes;
    
    const current = comparisons[0];
    const previous = comparisons[1];
    
    for (const metric of metrics) {
      const currentValue = current.data[metric];
      const previousValue = previous.data[metric];
      
      if (previousValue !== 0) {
        changes[metric] = {
          absolute: currentValue - previousValue,
          percentage: ((currentValue - previousValue) / previousValue) * 100
        };
      } else {
        changes[metric] = {
          absolute: currentValue,
          percentage: currentValue > 0 ? 100 : 0
        };
      }
    }
    
    return changes;
  }
}

module.exports = new AdvancedAnalyticsController();