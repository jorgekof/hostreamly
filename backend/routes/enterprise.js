const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const enterpriseController = require('../controllers/enterpriseController');
const { authMiddleware } = require('../middleware/auth');
const { requirePlan } = require('../middleware/planValidation');

const router = express.Router();

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const reportLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 report generations per hour
  message: 'Too many report generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const slaLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 SLA requests per 5 minutes
  message: 'Too many SLA monitoring requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Apply authentication and Enterprise plan requirement to all routes
router.use(authMiddleware);
router.use(requirePlan(['enterprise']));

// SLA Monitoring Routes

/**
 * @route GET /api/enterprise/sla/metrics
 * @desc Get SLA metrics for the authenticated user
 * @access Private (Enterprise only)
 */
router.get('/sla/metrics',
  slaLimit,
  [
    query('period')
      .optional()
      .matches(/^\d+[dwmy]$/i)
      .withMessage('Period must be in format: number followed by d/w/m/y (e.g., 30d, 4w, 6m, 1y)'),
    query('metric_type')
      .optional()
      .isIn(['all', 'uptime', 'performance', 'availability', 'response_time', 'error_rate', 'sla_compliance'])
      .withMessage('Invalid metric type')
  ],
  handleValidationErrors,
  enterpriseController.getSLAMetrics
);

/**
 * @route GET /api/enterprise/sla/alerts
 * @desc Get SLA alerts for the authenticated user
 * @access Private (Enterprise only)
 */
router.get('/sla/alerts',
  generalLimit,
  [
    query('status')
      .optional()
      .isIn(['all', 'active', 'resolved', 'acknowledged'])
      .withMessage('Invalid alert status'),
    query('severity')
      .optional()
      .isIn(['all', 'low', 'medium', 'high', 'critical'])
      .withMessage('Invalid alert severity'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  handleValidationErrors,
  enterpriseController.getSLAAlerts
);

/**
 * @route POST /api/enterprise/sla/alerts
 * @desc Create a new SLA alert
 * @access Private (Enterprise only)
 */
router.post('/sla/alerts',
  generalLimit,
  [
    body('metric_id')
      .isUUID()
      .withMessage('Valid metric ID is required'),
    body('threshold_value')
      .isNumeric()
      .withMessage('Threshold value must be a number'),
    body('threshold_operator')
      .isIn(['>', '<', '>=', '<=', '==', '!='])
      .withMessage('Invalid threshold operator'),
    body('severity')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    body('notification_channels')
      .isArray({ min: 1 })
      .withMessage('At least one notification channel is required'),
    body('notification_channels.*')
      .isIn(['email', 'sms', 'webhook', 'slack'])
      .withMessage('Invalid notification channel')
  ],
  handleValidationErrors,
  enterpriseController.createSLAAlert
);

// Account Management Routes

/**
 * @route GET /api/enterprise/account/overview
 * @desc Get comprehensive account overview
 * @access Private (Enterprise only)
 */
router.get('/account/overview',
  generalLimit,
  enterpriseController.getAccountOverview
);

/**
 * @route GET /api/enterprise/account/team
 * @desc Get team members
 * @access Private (Enterprise only)
 */
router.get('/account/team',
  generalLimit,
  [
    query('status')
      .optional()
      .isIn(['all', 'active', 'invited', 'suspended'])
      .withMessage('Invalid team member status'),
    query('role')
      .optional()
      .isIn(['all', 'admin', 'editor', 'viewer', 'analyst'])
      .withMessage('Invalid team member role'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  handleValidationErrors,
  enterpriseController.getTeamMembers
);

/**
 * @route POST /api/enterprise/account/team/invite
 * @desc Invite a new team member
 * @access Private (Enterprise only)
 */
router.post('/account/team/invite',
  generalLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address is required'),
    body('role')
      .isIn(['admin', 'editor', 'viewer', 'analyst'])
      .withMessage('Invalid role'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    body('permissions.*')
      .optional()
      .isIn([
        'videos.create', 'videos.edit', 'videos.delete', 'videos.view',
        'livestreams.create', 'livestreams.edit', 'livestreams.delete', 'livestreams.view',
        'analytics.view', 'analytics.export',
        'settings.edit', 'settings.view',
        'team.manage', 'team.view',
        'billing.view', 'billing.edit'
      ])
      .withMessage('Invalid permission')
  ],
  handleValidationErrors,
  enterpriseController.inviteTeamMember
);

/**
 * @route PUT /api/enterprise/account/team/:memberId
 * @desc Update team member details
 * @access Private (Enterprise only)
 */
router.put('/account/team/:memberId',
  generalLimit,
  [
    param('memberId')
      .isUUID()
      .withMessage('Valid member ID is required'),
    body('role')
      .optional()
      .isIn(['admin', 'editor', 'viewer', 'analyst'])
      .withMessage('Invalid role'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    body('status')
      .optional()
      .isIn(['active', 'suspended'])
      .withMessage('Invalid status')
  ],
  handleValidationErrors,
  enterpriseController.updateTeamMember
);

/**
 * @route DELETE /api/enterprise/account/team/:memberId
 * @desc Remove team member
 * @access Private (Enterprise only)
 */
router.delete('/account/team/:memberId',
  generalLimit,
  [
    param('memberId')
      .isUUID()
      .withMessage('Valid member ID is required')
  ],
  handleValidationErrors,
  enterpriseController.removeTeamMember
);

// Enterprise Reports Routes

/**
 * @route POST /api/enterprise/reports/generate
 * @desc Generate comprehensive enterprise reports
 * @access Private (Enterprise only)
 */
router.post('/reports/generate',
  reportLimit,
  [
    body('report_type')
      .isIn(['sla_compliance', 'account_usage', 'team_activity', 'security_audit', 'performance_analysis'])
      .withMessage('Invalid report type'),
    body('period')
      .matches(/^\d+[dwmy]$/i)
      .withMessage('Period must be in format: number followed by d/w/m/y (e.g., 30d, 4w, 6m, 1y)'),
    body('format')
      .optional()
      .isIn(['json', 'excel', 'pdf', 'csv'])
      .withMessage('Invalid export format'),
    body('include_charts')
      .optional()
      .isBoolean()
      .withMessage('Include charts must be a boolean')
  ],
  handleValidationErrors,
  enterpriseController.generateEnterpriseReport
);

/**
 * @route GET /api/enterprise/reports
 * @desc Get list of generated reports
 * @access Private (Enterprise only)
 */
router.get('/reports',
  generalLimit,
  [
    query('report_type')
      .optional()
      .isIn(['all', 'sla_compliance', 'account_usage', 'team_activity', 'security_audit', 'performance_analysis'])
      .withMessage('Invalid report type filter'),
    query('status')
      .optional()
      .isIn(['all', 'pending', 'processing', 'completed', 'failed'])
      .withMessage('Invalid status filter'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { report_type = 'all', status = 'all', limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT er.*, u.email as user_email
        FROM enterprise_reports er
        JOIN users u ON er.user_id = u.id
        WHERE er.user_id = ?
      `;
      const params = [userId];
      
      if (report_type !== 'all') {
        query += ' AND er.report_type = ?';
        params.push(report_type);
      }
      
      if (status !== 'all') {
        query += ' AND er.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY er.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const db = require('../config/database');
      const [reports] = await db.execute(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM enterprise_reports WHERE user_id = ?';
      const countParams = [userId];
      
      if (report_type !== 'all') {
        countQuery += ' AND report_type = ?';
        countParams.push(report_type);
      }
      
      if (status !== 'all') {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countRows] = await db.execute(countQuery, countParams);
      
      res.json({
        success: true,
        data: reports,
        pagination: {
          total: countRows[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: countRows[0].total > parseInt(offset) + parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting enterprise reports:', error);
      res.status(500).json({ error: 'Failed to get enterprise reports' });
    }
  }
);

/**
 * @route GET /api/enterprise/reports/:reportId
 * @desc Get specific enterprise report
 * @access Private (Enterprise only)
 */
router.get('/reports/:reportId',
  generalLimit,
  [
    param('reportId')
      .isUUID()
      .withMessage('Valid report ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { reportId } = req.params;
      
      const db = require('../config/database');
      const [reports] = await db.execute(
        'SELECT * FROM enterprise_reports WHERE id = ? AND user_id = ?',
        [reportId, userId]
      );
      
      if (!reports[0]) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      const report = reports[0];
      
      // Parse JSON data if it exists
      if (report.data) {
        try {
          report.data = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing report data:', e);
        }
      }
      
      res.json({
        success: true,
        data: report
      });
      
    } catch (error) {
      console.error('Error getting enterprise report:', error);
      res.status(500).json({ error: 'Failed to get enterprise report' });
    }
  }
);

/**
 * @route DELETE /api/enterprise/reports/:reportId
 * @desc Delete enterprise report
 * @access Private (Enterprise only)
 */
router.delete('/reports/:reportId',
  generalLimit,
  [
    param('reportId')
      .isUUID()
      .withMessage('Valid report ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { reportId } = req.params;
      
      const db = require('../config/database');
      
      // Verify ownership
      const [reports] = await db.execute(
        'SELECT * FROM enterprise_reports WHERE id = ? AND user_id = ?',
        [reportId, userId]
      );
      
      if (!reports[0]) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Delete report
      await db.execute(
        'DELETE FROM enterprise_reports WHERE id = ? AND user_id = ?',
        [reportId, userId]
      );
      
      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting enterprise report:', error);
      res.status(500).json({ error: 'Failed to delete enterprise report' });
    }
  }
);

// Enterprise Metrics and Monitoring

/**
 * @route GET /api/enterprise/metrics/available
 * @desc Get list of available enterprise metrics
 * @access Private (Enterprise only)
 */
router.get('/metrics/available',
  generalLimit,
  async (req, res) => {
    try {
      const metrics = {
        sla_metrics: [
          {
            id: 'uptime',
            name: 'Uptime',
            description: 'System uptime percentage',
            unit: 'percentage',
            category: 'availability'
          },
          {
            id: 'performance',
            name: 'Performance',
            description: 'Average response time metrics',
            unit: 'milliseconds',
            category: 'performance'
          },
          {
            id: 'availability',
            name: 'Availability',
            description: 'Service availability percentage',
            unit: 'percentage',
            category: 'availability'
          },
          {
            id: 'response_time',
            name: 'Response Time',
            description: 'API response time statistics',
            unit: 'milliseconds',
            category: 'performance'
          },
          {
            id: 'error_rate',
            name: 'Error Rate',
            description: 'Percentage of failed requests',
            unit: 'percentage',
            category: 'reliability'
          },
          {
            id: 'sla_compliance',
            name: 'SLA Compliance',
            description: 'Overall SLA compliance score',
            unit: 'percentage',
            category: 'compliance'
          }
        ],
        account_metrics: [
          {
            id: 'storage_usage',
            name: 'Storage Usage',
            description: 'Total storage consumption',
            unit: 'bytes',
            category: 'usage'
          },
          {
            id: 'bandwidth_usage',
            name: 'Bandwidth Usage',
            description: 'Total bandwidth consumption',
            unit: 'bytes',
            category: 'usage'
          },
          {
            id: 'video_count',
            name: 'Video Count',
            description: 'Total number of videos',
            unit: 'count',
            category: 'content'
          },
          {
            id: 'livestream_count',
            name: 'Livestream Count',
            description: 'Total number of livestreams',
            unit: 'count',
            category: 'content'
          },
          {
            id: 'team_activity',
            name: 'Team Activity',
            description: 'Team member activity metrics',
            unit: 'count',
            category: 'team'
          }
        ],
        security_metrics: [
          {
            id: 'failed_logins',
            name: 'Failed Logins',
            description: 'Number of failed login attempts',
            unit: 'count',
            category: 'security'
          },
          {
            id: 'suspicious_activity',
            name: 'Suspicious Activity',
            description: 'Detected suspicious activities',
            unit: 'count',
            category: 'security'
          },
          {
            id: 'api_abuse',
            name: 'API Abuse',
            description: 'Detected API abuse attempts',
            unit: 'count',
            category: 'security'
          }
        ]
      };
      
      res.json({
        success: true,
        data: metrics
      });
      
    } catch (error) {
      console.error('Error getting available metrics:', error);
      res.status(500).json({ error: 'Failed to get available metrics' });
    }
  }
);

/**
 * @route GET /api/enterprise/health
 * @desc Get enterprise account health status
 * @access Private (Enterprise only)
 */
router.get('/health',
  generalLimit,
  async (req, res) => {
    try {
      const { userId } = req.user;
      
      // Get comprehensive health metrics
      const db = require('../config/database');
      const redis = require('../config/redis');
      
      const cacheKey = `enterprise_health:${userId}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Calculate health metrics
      const [healthRows] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM videos WHERE user_id = ? AND status = 'active') as active_videos,
          (SELECT COUNT(*) FROM videos WHERE user_id = ? AND status = 'error') as error_videos,
          (SELECT COUNT(*) FROM livestreams WHERE user_id = ? AND status = 'active') as active_streams,
          (SELECT COUNT(*) FROM team_members WHERE owner_user_id = ? AND status = 'active') as team_size,
          (SELECT COUNT(*) FROM sla_alerts WHERE user_id = ? AND status = 'active') as active_alerts,
          (SELECT AVG(response_time_ms) FROM api_logs WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as avg_response_time,
          (SELECT COUNT(*) FROM api_logs WHERE user_id = ? AND status_code >= 400 AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_errors
      `, [userId, userId, userId, userId, userId, userId, userId]);
      
      const stats = healthRows[0] || {};
      
      // Calculate health score
      let healthScore = 100;
      
      // Deduct points for issues
      if (stats.error_videos > 0) healthScore -= Math.min(stats.error_videos * 5, 20);
      if (stats.active_alerts > 0) healthScore -= Math.min(stats.active_alerts * 10, 30);
      if (stats.recent_errors > 10) healthScore -= Math.min((stats.recent_errors - 10) * 2, 25);
      if (stats.avg_response_time > 500) healthScore -= 15;
      
      // Add points for good metrics
      if (stats.active_videos > 50) healthScore += 5;
      if (stats.team_size > 5) healthScore += 5;
      if (stats.avg_response_time < 200) healthScore += 10;
      
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      const healthStatus = {
        overall_score: healthScore,
        status: healthScore >= 90 ? 'excellent' : 
                healthScore >= 75 ? 'good' : 
                healthScore >= 50 ? 'fair' : 'poor',
        metrics: {
          content: {
            active_videos: stats.active_videos || 0,
            error_videos: stats.error_videos || 0,
            active_streams: stats.active_streams || 0
          },
          team: {
            size: stats.team_size || 0,
            active_alerts: stats.active_alerts || 0
          },
          performance: {
            avg_response_time: stats.avg_response_time || 0,
            recent_errors: stats.recent_errors || 0
          }
        },
        recommendations: []
      };
      
      // Add recommendations based on metrics
      if (stats.error_videos > 0) {
        healthStatus.recommendations.push({
          type: 'warning',
          message: `You have ${stats.error_videos} videos with errors. Please review and fix them.`,
          action: 'review_error_videos'
        });
      }
      
      if (stats.active_alerts > 5) {
        healthStatus.recommendations.push({
          type: 'critical',
          message: `You have ${stats.active_alerts} active SLA alerts. Immediate attention required.`,
          action: 'review_sla_alerts'
        });
      }
      
      if (stats.avg_response_time > 500) {
        healthStatus.recommendations.push({
          type: 'warning',
          message: 'Average response time is above 500ms. Consider optimizing your content delivery.',
          action: 'optimize_performance'
        });
      }
      
      if (stats.team_size === 0) {
        healthStatus.recommendations.push({
          type: 'info',
          message: 'Consider inviting team members to collaborate on your content.',
          action: 'invite_team_members'
        });
      }
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify({
        success: true,
        data: healthStatus,
        generated_at: new Date().toISOString()
      }));
      
      res.json({
        success: true,
        data: healthStatus,
        generated_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting enterprise health:', error);
      res.status(500).json({ error: 'Failed to get enterprise health status' });
    }
  }
);

module.exports = router;