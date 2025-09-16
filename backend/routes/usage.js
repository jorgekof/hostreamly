const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const { getUserUsageAndLimits, calculateCurrentUsage, getUserPlan, PLAN_LIMITS } = require('../middleware/usageLimits');
const User = require('../models/User');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limiting para endpoints de uso
const usageLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: {
    error: 'Too many usage requests',
    message: 'Please try again later'
  }
});

/**
 * @route GET /api/usage/current
 * @desc Obtener uso actual y límites del usuario
 * @access Private
 */
router.get('/current', auth, usageLimit, getUserUsageAndLimits, async (req, res) => {
  try {
    const userUsage = req.userUsage;
    
    // Formatear respuesta
    const response = {
      success: true,
      data: {
        plan: {
          name: userUsage.plan,
          limits: {
            storage: {
              limit: userUsage.limits.storage,
              unit: 'GB',
              unlimited: userUsage.limits.storage === -1
            },
            bandwidth: {
              limit: userUsage.limits.bandwidth,
              unit: 'TB',
              unlimited: userUsage.limits.bandwidth === -1
            },
            videos: {
              limit: userUsage.limits.videos,
              unlimited: userUsage.limits.videos === -1
            },
            users: {
              limit: userUsage.limits.users
            },
            liveStreamingHours: {
              limit: userUsage.limits.liveStreamingHours,
              unit: 'hours/month'
            },
            viewingHours: {
              limit: userUsage.limits.viewingHours,
              unit: 'hours/month'
            },
            maxConcurrentViewers: {
              limit: userUsage.limits.maxConcurrentViewers
            }
          }
        },
        usage: {
          storage: {
            used: Math.round(userUsage.usage.storage / (1024 * 1024 * 1024) * 100) / 100, // GB
            percentage: userUsage.percentages.storage,
            unit: 'GB'
          },
          videos: {
            used: userUsage.usage.videos,
            percentage: userUsage.percentages.videos
          },
          liveStreamingHours: {
            used: userUsage.usage.liveStreamingHours,
            percentage: userUsage.percentages.liveStreamingHours,
            unit: 'hours'
          },
          bandwidth: {
            used: Math.round(userUsage.usage.bandwidth / (1024 * 1024 * 1024) * 100) / 100, // GB
            unit: 'GB'
          }
        },
        alerts: userUsage.alerts,
        hasAlerts: userUsage.hasAlerts,
        timestamp: userUsage.usage.timestamp
      }
    };
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error getting user usage', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error retrieving usage information'
    });
  }
});

/**
 * @route GET /api/usage/alerts
 * @desc Obtener alertas de uso del usuario
 * @access Private
 */
router.get('/alerts', auth, usageLimit, getUserUsageAndLimits, async (req, res) => {
  try {
    const userUsage = req.userUsage;
    
    // Generar recomendaciones basadas en alertas
    const recommendations = [];
    
    userUsage.alerts.forEach(alert => {
      switch (alert.type) {
        case 'storage':
          if (alert.severity === 'critical') {
            recommendations.push({
              type: 'upgrade',
              message: 'Consider upgrading your plan or delete unused videos',
              action: 'upgrade_plan',
              priority: 'high'
            });
          } else {
            recommendations.push({
              type: 'cleanup',
              message: 'Review and delete unused videos to free up space',
              action: 'manage_videos',
              priority: 'medium'
            });
          }
          break;
        case 'videos':
          recommendations.push({
            type: 'upgrade',
            message: 'Upgrade your plan to upload more videos',
            action: 'upgrade_plan',
            priority: 'high'
          });
          break;
        case 'liveStreaming':
          recommendations.push({
            type: 'usage',
            message: 'Monitor your live streaming usage to avoid exceeding limits',
            action: 'monitor_streaming',
            priority: 'medium'
          });
          break;
      }
    });
    
    res.json({
      success: true,
      data: {
        alerts: userUsage.alerts,
        recommendations,
        hasAlerts: userUsage.hasAlerts,
        alertCount: userUsage.alerts.length,
        criticalAlerts: userUsage.alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: userUsage.alerts.filter(a => a.severity === 'warning').length
      }
    });
    
  } catch (error) {
    logger.error('Error getting usage alerts', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error retrieving usage alerts'
    });
  }
});

/**
 * @route GET /api/usage/history
 * @desc Obtener historial de uso del usuario
 * @access Private
 */
router.get('/history', auth, usageLimit, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user.id;
    
    // Calcular fechas basadas en el período
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Obtener usuario y plan
    const user = await User.findByPk(userId);
    const userPlan = getUserPlan(user);
    const planLimits = PLAN_LIMITS[userPlan];
    
    // Generar datos históricos simulados (en producción, esto vendría de una tabla de métricas)
    const historyData = [];
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Calcular uso para esta fecha (simulado)
      const usage = await calculateCurrentUsage(userId);
      
      historyData.push({
        date: date.toISOString().split('T')[0],
        storage: Math.round(usage.storage / (1024 * 1024 * 1024) * 100) / 100,
        videos: usage.videos,
        bandwidth: Math.round(usage.bandwidth / (1024 * 1024 * 1024) * 100) / 100,
        liveStreamingHours: usage.liveStreamingHours
      });
    }
    
    res.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        plan: userPlan,
        limits: planLimits,
        history: historyData,
        summary: {
          totalDays: days,
          averageStorage: historyData.reduce((sum, day) => sum + day.storage, 0) / days,
          totalVideos: historyData[historyData.length - 1]?.videos || 0,
          totalBandwidth: historyData.reduce((sum, day) => sum + day.bandwidth, 0),
          totalLiveStreamingHours: historyData.reduce((sum, day) => sum + day.liveStreamingHours, 0)
        }
      }
    });
    
  } catch (error) {
    logger.error('Error getting usage history', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      period: req.query.period
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error retrieving usage history'
    });
  }
});

/**
 * @route POST /api/usage/notifications/settings
 * @desc Configurar notificaciones de uso
 * @access Private
 */
router.post('/notifications/settings', auth, async (req, res) => {
  try {
    const { 
      emailAlerts = true, 
      thresholds = { storage: 80, videos: 90, liveStreaming: 85 },
      frequency = 'daily'
    } = req.body;
    
    const userId = req.user.id;
    
    // Actualizar configuración de notificaciones del usuario
    await User.update({
      notification_settings: JSON.stringify({
        emailAlerts,
        thresholds,
        frequency,
        updatedAt: new Date()
      })
    }, {
      where: { id: userId }
    });
    
    logger.info('Usage notification settings updated', {
      userId,
      settings: { emailAlerts, thresholds, frequency }
    });
    
    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        emailAlerts,
        thresholds,
        frequency
      }
    });
    
  } catch (error) {
    logger.error('Error updating notification settings', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error updating notification settings'
    });
  }
});

/**
 * @route GET /api/usage/recommendations
 * @desc Obtener recomendaciones de optimización
 * @access Private
 */
router.get('/recommendations', auth, getUserUsageAndLimits, async (req, res) => {
  try {
    const userUsage = req.userUsage;
    const recommendations = [];
    
    // Analizar uso y generar recomendaciones
    if (userUsage.percentages.storage > 70) {
      recommendations.push({
        type: 'storage_optimization',
        priority: userUsage.percentages.storage > 90 ? 'high' : 'medium',
        title: 'Optimize Storage Usage',
        description: 'Your storage usage is high. Consider compressing videos or deleting unused content.',
        actions: [
          { label: 'Review Videos', action: 'manage_videos' },
          { label: 'Upgrade Plan', action: 'upgrade_plan' }
        ]
      });
    }
    
    if (userUsage.percentages.videos > 80) {
      recommendations.push({
        type: 'video_limit',
        priority: 'high',
        title: 'Video Limit Approaching',
        description: 'You are approaching your video upload limit. Consider upgrading your plan.',
        actions: [
          { label: 'Upgrade Plan', action: 'upgrade_plan' },
          { label: 'Delete Old Videos', action: 'cleanup_videos' }
        ]
      });
    }
    
    if (userUsage.plan === 'starter' || userUsage.plan === 'professional') {
      recommendations.push({
        type: 'feature_upgrade',
        priority: 'low',
        title: 'Unlock Advanced Features',
        description: 'Upgrade to Enterprise for live streaming, advanced analytics, and more.',
        actions: [
          { label: 'View Enterprise Features', action: 'view_enterprise' },
          { label: 'Upgrade Now', action: 'upgrade_plan' }
        ]
      });
    }
    
    res.json({
      success: true,
      data: {
        recommendations,
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
        lowPriority: recommendations.filter(r => r.priority === 'low').length
      }
    });
    
  } catch (error) {
    logger.error('Error getting recommendations', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error retrieving recommendations'
    });
  }
});

module.exports = router;