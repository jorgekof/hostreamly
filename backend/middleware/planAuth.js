const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * Middleware para validar el plan del usuario
 * Determina el plan basándose en los campos existentes del usuario
 */
const getUserPlan = (user) => {
  // Si es admin o super_admin, tiene acceso completo
  if (user.role === 'admin' || user.role === 'super_admin') {
    return 'enterprise';
  }
  
  // Determinar plan basándose en límites de almacenamiento y ancho de banda
  const storageGB = user.storage_limit / (1024 * 1024 * 1024); // Convertir bytes a GB
  const bandwidthGB = user.bandwidth_limit_month / (1024 * 1024 * 1024); // Convertir bytes a GB
  
  // Plan Empresarial: 1TB almacenamiento, 5TB ancho de banda
  if (storageGB >= 1000 && bandwidthGB >= 5000) {
    return 'enterprise';
  }
  
  // Plan Profesional: 500GB almacenamiento, 2TB ancho de banda
  if (storageGB >= 500 && bandwidthGB >= 2000) {
    return 'professional';
  }
  
  // Plan Básico: 100GB almacenamiento, 500GB ancho de banda
  return 'starter';
};

/**
 * Middleware que requiere plan empresarial
 * Solo usuarios con plan empresarial pueden acceder a live streaming
 */
const requireEnterprisePlan = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }
    
    // Obtener usuario completo de la base de datos para asegurar datos actualizados
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }
    
    const userPlan = getUserPlan(user);
    
    if (userPlan !== 'enterprise') {
      logger.security('Live streaming access denied - insufficient plan', {
        userId: user.id,
        userPlan,
        requiredPlan: 'enterprise',
        endpoint: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: 'Live streaming is only available for Enterprise plan users. Please upgrade your plan to access this feature.',
        currentPlan: userPlan,
        requiredPlan: 'enterprise',
        upgradeUrl: '/pricing'
      });
    }
    
    // Agregar información del plan al request para uso posterior
    req.userPlan = userPlan;
    req.userModel = user;
    
    next();
    
  } catch (error) {
    logger.error('Plan validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      endpoint: req.originalUrl
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error validating user plan'
    });
  }
};

/**
 * Middleware que valida límites de live streaming para plan empresarial
 */
const validateLiveStreamingLimits = async (req, res, next) => {
  try {
    const user = req.userModel || await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }
    
    const userPlan = getUserPlan(user);
    
    // Solo aplicar límites a usuarios con plan empresarial
    if (userPlan === 'enterprise') {
      // Verificar límites específicos del plan empresarial
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Aquí podrías agregar lógica para verificar:
      // - 50 horas mensuales de streaming
      // - Máximo 100 espectadores simultáneos
      
      // Por ahora, establecer límites en el request para uso posterior
      req.streamingLimits = {
        maxMonthlyHours: 50,
        maxConcurrentViewers: 100,
        plan: 'enterprise'
      };
    }
    
    next();
    
  } catch (error) {
    logger.error('Live streaming limits validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      endpoint: req.originalUrl
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error validating streaming limits'
    });
  }
};

/**
 * Middleware genérico para validar planes
 */
const requirePlan = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User not found'
        });
      }
      
      const userPlan = getUserPlan(user);
      const planHierarchy = ['starter', 'professional', 'enterprise'];
      const userPlanIndex = planHierarchy.indexOf(userPlan);
      const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
      
      if (userPlanIndex < requiredPlanIndex) {
        logger.security('Access denied - insufficient plan', {
          userId: user.id,
          userPlan,
          requiredPlan,
          endpoint: req.originalUrl,
          ip: req.ip
        });
        
        return res.status(403).json({
          error: 'Plan upgrade required',
          message: `This feature requires ${requiredPlan} plan or higher. Please upgrade your plan.`,
          currentPlan: userPlan,
          requiredPlan,
          upgradeUrl: '/pricing'
        });
      }
      
      req.userPlan = userPlan;
      req.userModel = user;
      next();
      
    } catch (error) {
      logger.error('Plan validation error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        endpoint: req.originalUrl
      });
      
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error validating user plan'
      });
    }
  };
};

module.exports = {
  getUserPlan,
  requireEnterprisePlan,
  validateLiveStreamingLimits,
  requirePlan
};