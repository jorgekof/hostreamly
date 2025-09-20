const logger = require('../utils/logger');
const User = require('../models/User');
const Video = require('../models/Video');
const LiveStream = require('../models/LiveStream');
const { Op } = require('sequelize');

/**
 * Middleware para validar límites de uso según el plan del usuario
 * Incluye validaciones para storage, bandwidth, live streaming y usuarios
 */

// Definir límites por plan (sincronizado con frontend)
const PLAN_LIMITS = {
  starter: {
    storage: 100, // GB
    bandwidth: 0.5, // TB
    videos: 100,
    users: 1,
    liveStreamingHours: 0,
    viewingHours: 50,
    maxConcurrentViewers: 0
  },
  professional: {
    storage: 500, // GB
    bandwidth: 2, // TB
    videos: 1000,
    users: 3,
    liveStreamingHours: 0, // No live streaming
    viewingHours: 200,
    maxConcurrentViewers: 0
  },
  enterprise: {
    storage: 3500, // GB
    bandwidth: 35000, // GB
    videos: -1, // unlimited
    users: 15,
    liveStreamingHours: 15, // 4K quality
    viewingHours: 500,
    maxConcurrentViewers: 60
  }
};

/**
 * Obtener el plan del usuario basado en sus límites
 */
const getUserPlan = (user) => {
  if (user.role === 'admin' || user.role === 'super_admin') {
    return 'enterprise';
  }
  
  const storageGB = user.storage_limit / (1024 * 1024 * 1024);
  const bandwidthTB = user.bandwidth_limit_month / (1024 * 1024 * 1024 * 1024);
  
  if (storageGB >= 1000 && bandwidthTB >= 10) {
    return 'enterprise';
  }
  
  if (storageGB >= 500 && bandwidthTB >= 2) {
    return 'professional';
  }
  
  return 'starter';
};

/**
 * Calcular uso actual del usuario
 */
const calculateCurrentUsage = async (userId) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Calcular storage usado
    const storageResult = await Video.sum('file_size', {
      where: {
        user_id: userId,
        status: 'processed'
      }
    });
    
    // Calcular bandwidth usado este mes
    const bandwidthResult = await Video.sum('bandwidth_used', {
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: currentMonth,
          [Op.lt]: nextMonth
        }
      }
    });
    
    // Calcular horas de live streaming este mes
    const liveStreamingResult = await LiveStream.sum('duration_minutes', {
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: currentMonth,
          [Op.lt]: nextMonth
        },
        status: ['completed', 'live']
      }
    });
    
    // Contar videos totales
    const videoCount = await Video.count({
      where: {
        user_id: userId,
        status: 'processed'
      }
    });
    
    return {
      storage: storageResult || 0, // bytes
      bandwidth: bandwidthResult || 0, // bytes
      videos: videoCount,
      liveStreamingHours: Math.round((liveStreamingResult || 0) / 60), // convertir minutos a horas
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error calculating usage', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Middleware para validar límites de storage antes de upload
 */
const validateStorageLimit = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Authentication required'
      });
    }
    
    const userPlan = getUserPlan(user);
    const planLimits = PLAN_LIMITS[userPlan];
    const usage = await calculateCurrentUsage(user.id);
    
    const fileSize = req.body.fileSize || req.headers['content-length'] || 0;
    const storageUsedGB = usage.storage / (1024 * 1024 * 1024);
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);
    
    if (storageUsedGB + fileSizeGB > planLimits.storage) {
      logger.security('Storage limit exceeded', {
        userId: user.id,
        userPlan,
        currentUsageGB: storageUsedGB,
        fileSizeGB,
        limitGB: planLimits.storage,
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({
        error: 'Storage limit exceeded',
        message: `Your ${userPlan} plan allows ${planLimits.storage}GB of storage. You are currently using ${storageUsedGB.toFixed(2)}GB.`,
        currentUsage: {
          storage: storageUsedGB,
          limit: planLimits.storage,
          percentage: (storageUsedGB / planLimits.storage) * 100
        },
        upgradeUrl: '/pricing'
      });
    }
    
    req.userPlan = userPlan;
    req.planLimits = planLimits;
    req.currentUsage = usage;
    
    next();
  } catch (error) {
    logger.error('Storage validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error validating storage limits'
    });
  }
};

/**
 * Middleware para validar límites de live streaming
 */
const validateLiveStreamingLimits = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Authentication required'
      });
    }
    
    const userPlan = getUserPlan(user);
    const planLimits = PLAN_LIMITS[userPlan];
    
    // Verificar si el plan permite live streaming
    if (planLimits.liveStreamingHours === 0) {
      return res.status(403).json({
        error: 'Live streaming not available',
        message: `Live streaming is not available in your ${userPlan} plan. Please upgrade to Enterprise plan.`,
        currentPlan: userPlan,
        requiredPlan: 'enterprise',
        upgradeUrl: '/pricing'
      });
    }
    
    const usage = await calculateCurrentUsage(user.id);
    
    // Verificar límite de horas mensuales
    if (usage.liveStreamingHours >= planLimits.liveStreamingHours) {
      return res.status(403).json({
        error: 'Live streaming hours limit exceeded',
        message: `You have used ${usage.liveStreamingHours} of ${planLimits.liveStreamingHours} hours this month.`,
        currentUsage: {
          hours: usage.liveStreamingHours,
          limit: planLimits.liveStreamingHours,
          percentage: (usage.liveStreamingHours / planLimits.liveStreamingHours) * 100
        },
        upgradeUrl: '/pricing'
      });
    }
    
    // Verificar espectadores simultáneos activos
    const activeStreams = await LiveStream.count({
      where: {
        user_id: user.id,
        status: 'live'
      }
    });
    
    if (activeStreams > 0) {
      return res.status(403).json({
        error: 'Active stream limit exceeded',
        message: 'You already have an active live stream. Only one concurrent stream is allowed.',
        activeStreams
      });
    }
    
    req.userPlan = userPlan;
    req.planLimits = planLimits;
    req.currentUsage = usage;
    req.streamingLimits = {
      maxMonthlyHours: planLimits.liveStreamingHours,
      maxConcurrentViewers: planLimits.maxConcurrentViewers,
      usedHours: usage.liveStreamingHours
    };
    
    next();
  } catch (error) {
    logger.error('Live streaming validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error validating live streaming limits'
    });
  }
};

/**
 * Middleware para validar límites de videos
 */
const validateVideoLimit = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Authentication required'
      });
    }
    
    const userPlan = getUserPlan(user);
    const planLimits = PLAN_LIMITS[userPlan];
    
    // Si es ilimitado, continuar
    if (planLimits.videos === -1) {
      req.userPlan = userPlan;
      req.planLimits = planLimits;
      return next();
    }
    
    const usage = await calculateCurrentUsage(user.id);
    
    if (usage.videos >= planLimits.videos) {
      return res.status(403).json({
        error: 'Video limit exceeded',
        message: `Your ${userPlan} plan allows ${planLimits.videos} videos. You currently have ${usage.videos} videos.`,
        currentUsage: {
          videos: usage.videos,
          limit: planLimits.videos,
          percentage: (usage.videos / planLimits.videos) * 100
        },
        upgradeUrl: '/pricing'
      });
    }
    
    req.userPlan = userPlan;
    req.planLimits = planLimits;
    req.currentUsage = usage;
    
    next();
  } catch (error) {
    logger.error('Video limit validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error validating video limits'
    });
  }
};

/**
 * Obtener uso actual y límites del usuario
 */
const getUserUsageAndLimits = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Authentication required'
      });
    }
    
    const userPlan = getUserPlan(user);
    const planLimits = PLAN_LIMITS[userPlan];
    const usage = await calculateCurrentUsage(user.id);
    
    // Calcular porcentajes de uso
    const usagePercentages = {
      storage: planLimits.storage > 0 ? (usage.storage / (planLimits.storage * 1024 * 1024 * 1024)) * 100 : 0,
      videos: planLimits.videos > 0 ? (usage.videos / planLimits.videos) * 100 : 0,
      liveStreamingHours: planLimits.liveStreamingHours > 0 ? (usage.liveStreamingHours / planLimits.liveStreamingHours) * 100 : 0
    };
    
    // Detectar alertas (uso > 80%)
    const alerts = [];
    if (usagePercentages.storage > 80) {
      alerts.push({
        type: 'storage',
        severity: usagePercentages.storage > 95 ? 'critical' : 'warning',
        message: `Storage usage at ${usagePercentages.storage.toFixed(1)}%`,
        percentage: usagePercentages.storage
      });
    }
    
    if (usagePercentages.videos > 80) {
      alerts.push({
        type: 'videos',
        severity: usagePercentages.videos > 95 ? 'critical' : 'warning',
        message: `Video count at ${usagePercentages.videos.toFixed(1)}%`,
        percentage: usagePercentages.videos
      });
    }
    
    if (usagePercentages.liveStreamingHours > 80) {
      alerts.push({
        type: 'liveStreaming',
        severity: usagePercentages.liveStreamingHours > 95 ? 'critical' : 'warning',
        message: `Live streaming hours at ${usagePercentages.liveStreamingHours.toFixed(1)}%`,
        percentage: usagePercentages.liveStreamingHours
      });
    }
    
    req.userUsage = {
      plan: userPlan,
      limits: planLimits,
      usage,
      percentages: usagePercentages,
      alerts,
      hasAlerts: alerts.length > 0
    };
    
    next();
  } catch (error) {
    logger.error('Usage calculation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error calculating usage'
    });
  }
};

module.exports = {
  validateStorageLimit,
  validateLiveStreamingLimits,
  validateVideoLimit,
  getUserUsageAndLimits,
  calculateCurrentUsage,
  getUserPlan,
  PLAN_LIMITS
};