const express = require('express');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const advancedAnalyticsController = require('../controllers/advancedAnalyticsController');
const { authMiddleware } = require('../middleware/auth');
const { requirePlan } = require('../middleware/planAuth');

const router = express.Router();

// Rate limiting for analytics operations
const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many analytics requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limit for export operations
const exportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 exports per hour
  message: {
    success: false,
    error: 'Export limit reached, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const validateDashboardQuery = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 7d, 30d, 90d, 1y'),
  
  query('timezone')
    .optional()
    .matches(/^[A-Za-z_\/]+$/)
    .withMessage('Invalid timezone format')
];

const validateCustomReport = [
  body('metrics')
    .isArray({ min: 1 })
    .withMessage('Metrics must be a non-empty array')
    .custom((metrics) => {
      const validMetrics = [
        'views', 'watch_time', 'engagement_score', 'completion_rate',
        'bandwidth_usage', 'storage_usage', 'unique_viewers', 'peak_viewers',
        'geographic_distribution', 'device_distribution', 'quality_distribution'
      ];
      
      for (const metric of metrics) {
        if (!validMetrics.includes(metric)) {
          throw new Error(`Invalid metric: ${metric}`);
        }
      }
      return true;
    }),
  
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  
  body('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'video', 'country', 'device', 'quality'])
    .withMessage('GroupBy must be one of: day, week, month, video, country, device, quality'),
  
  body('dateRange')
    .isObject()
    .withMessage('Date range is required')
    .custom((dateRange) => {
      if (!dateRange.start || !dateRange.end) {
        throw new Error('Date range must include start and end dates');
      }
      
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (start >= end) {
        throw new Error('Start date must be before end date');
      }
      
      // Limit to 1 year of data
      const maxDays = 365;
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      if (daysDiff > maxDays) {
        throw new Error(`Date range cannot exceed ${maxDays} days`);
      }
      
      return true;
    }),
  
  body('timezone')
    .optional()
    .matches(/^[A-Za-z_\/]+$/)
    .withMessage('Invalid timezone format'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000')
];

const validateExportRequest = [
  body('format')
    .isIn(['excel', 'csv', 'pdf', 'json'])
    .withMessage('Format must be one of: excel, csv, pdf, json'),
  
  body('reportType')
    .isIn(['dashboard', 'videos', 'livestreams', 'engagement', 'custom'])
    .withMessage('Report type must be one of: dashboard, videos, livestreams, engagement, custom'),
  
  body('dateRange')
    .isObject()
    .withMessage('Date range is required')
    .custom((dateRange) => {
      if (!dateRange.start || !dateRange.end) {
        throw new Error('Date range must include start and end dates');
      }
      
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (start >= end) {
        throw new Error('Start date must be before end date');
      }
      
      return true;
    }),
  
  body('metrics')
    .optional()
    .isArray()
    .withMessage('Metrics must be an array'),
  
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  
  body('timezone')
    .optional()
    .matches(/^[A-Za-z_\/]+$/)
    .withMessage('Invalid timezone format')
];

const validateRealtimeQuery = [
  query('metrics')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        value = [value];
      }
      if (!Array.isArray(value)) {
        throw new Error('Metrics must be an array');
      }
      
      const validMetrics = ['viewers', 'bandwidth', 'storage', 'streams'];
      for (const metric of value) {
        if (!validMetrics.includes(metric)) {
          throw new Error(`Invalid metric: ${metric}`);
        }
      }
      return true;
    })
];

const validateTrendsQuery = [
  query('metric')
    .isIn(['views', 'watch_time', 'bandwidth', 'storage', 'engagement'])
    .withMessage('Metric must be one of: views, watch_time, bandwidth, storage, engagement'),
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 7d, 30d, 90d, 1y'),
  
  query('forecast')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Forecast must be true or false')
];

const validateCompareRequest = [
  body('periods')
    .isArray({ min: 2, max: 4 })
    .withMessage('Must compare between 2 and 4 periods')
    .custom((periods) => {
      for (const period of periods) {
        if (!period.range || !period.label) {
          throw new Error('Each period must have range and label');
        }
        if (!['7d', '30d', '90d', '1y'].includes(period.range)) {
          throw new Error('Invalid period range');
        }
      }
      return true;
    }),
  
  body('metrics')
    .isArray({ min: 1 })
    .withMessage('Metrics must be a non-empty array')
    .custom((metrics) => {
      const validMetrics = [
        'views', 'watch_time', 'engagement_score', 'bandwidth_usage', 
        'storage_usage', 'unique_viewers'
      ];
      
      for (const metric of metrics) {
        if (!validMetrics.includes(metric)) {
          throw new Error(`Invalid metric: ${metric}`);
        }
      }
      return true;
    })
];

// Apply authentication and plan validation to all routes
router.use(authMiddleware);
// router.use(requirePlan('professional')); // Advanced analytics for Professional+ - temporarily disabled
router.use(analyticsRateLimit);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive dashboard analytics
 * @access Private (Professional+)
 */
router.get('/dashboard',
  validateDashboardQuery,
  advancedAnalyticsController.getDashboardAnalytics
);

/**
 * @route POST /api/analytics/custom-report
 * @desc Generate custom analytics report
 * @access Private (Professional+)
 */
router.post('/custom-report',
  validateCustomReport,
  advancedAnalyticsController.getCustomReport
);

/**
 * @route POST /api/analytics/export
 * @desc Export analytics data in various formats
 * @access Private (Enterprise only)
 */
router.post('/export',
  requirePlan(['enterprise']), // Export is Enterprise-only feature
  exportRateLimit,
  validateExportRequest,
  advancedAnalyticsController.exportAnalytics
);

/**
 * @route GET /api/analytics/realtime
 * @desc Get real-time analytics data
 * @access Private (Professional+)
 */
router.get('/realtime',
  validateRealtimeQuery,
  advancedAnalyticsController.getRealtimeAnalytics
);

/**
 * @route GET /api/analytics/trends
 * @desc Get analytics trends and predictions
 * @access Private (Enterprise only)
 */
router.get('/trends',
  requirePlan(['enterprise']), // Trends and forecasting is Enterprise-only
  validateTrendsQuery,
  advancedAnalyticsController.getAnalyticsTrends
);

/**
 * @route POST /api/analytics/compare
 * @desc Get comparative analytics between periods
 * @access Private (Professional+)
 */
router.post('/compare',
  validateCompareRequest,
  advancedAnalyticsController.getComparativeAnalytics
);

/**
 * @route GET /api/analytics/metrics
 * @desc Get available analytics metrics
 * @access Private (Professional+)
 */
router.get('/metrics', (req, res) => {
  const metrics = {
    basic: [
      {
        name: 'views',
        description: 'Total video views',
        type: 'counter',
        unit: 'count'
      },
      {
        name: 'watch_time',
        description: 'Total watch time in seconds',
        type: 'counter',
        unit: 'seconds'
      },
      {
        name: 'unique_viewers',
        description: 'Number of unique viewers',
        type: 'counter',
        unit: 'count'
      }
    ],
    engagement: [
      {
        name: 'engagement_score',
        description: 'Average engagement score (0-100)',
        type: 'gauge',
        unit: 'percentage'
      },
      {
        name: 'completion_rate',
        description: 'Average video completion rate',
        type: 'gauge',
        unit: 'percentage'
      },
      {
        name: 'retention_rate',
        description: 'Viewer retention rate',
        type: 'gauge',
        unit: 'percentage'
      }
    ],
    technical: [
      {
        name: 'bandwidth_usage',
        description: 'Total bandwidth consumed',
        type: 'counter',
        unit: 'bytes'
      },
      {
        name: 'storage_usage',
        description: 'Total storage used',
        type: 'gauge',
        unit: 'bytes'
      },
      {
        name: 'peak_viewers',
        description: 'Peak concurrent viewers',
        type: 'gauge',
        unit: 'count'
      }
    ],
    distribution: [
      {
        name: 'geographic_distribution',
        description: 'Views by country/region',
        type: 'distribution',
        unit: 'count'
      },
      {
        name: 'device_distribution',
        description: 'Views by device type',
        type: 'distribution',
        unit: 'count'
      },
      {
        name: 'quality_distribution',
        description: 'Views by video quality',
        type: 'distribution',
        unit: 'count'
      }
    ]
  };
  
  res.json({
    success: true,
    data: { metrics }
  });
});

/**
 * @route GET /api/analytics/export-formats
 * @desc Get available export formats
 * @access Private (Enterprise only)
 */
router.get('/export-formats',
  requirePlan(['enterprise']),
  (req, res) => {
    const formats = [
      {
        format: 'excel',
        description: 'Microsoft Excel spreadsheet (.xlsx)',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        features: ['charts', 'formatting', 'multiple_sheets']
      },
      {
        format: 'csv',
        description: 'Comma-separated values (.csv)',
        mime_type: 'text/csv',
        features: ['lightweight', 'universal_compatibility']
      },
      {
        format: 'pdf',
        description: 'Portable Document Format (.pdf)',
        mime_type: 'application/pdf',
        features: ['formatted_reports', 'charts', 'branding']
      },
      {
        format: 'json',
        description: 'JavaScript Object Notation (.json)',
        mime_type: 'application/json',
        features: ['api_integration', 'structured_data']
      }
    ];
    
    res.json({
      success: true,
      data: { formats }
    });
  }
);

module.exports = router;