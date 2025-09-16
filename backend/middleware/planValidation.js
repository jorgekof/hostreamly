const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * Determina el plan del usuario basándose en los límites configurados
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
 * Middleware para validar que el usuario tenga un plan específico
 */
const validatePlan = (requiredPlans) => {
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
      
      // Normalizar planes requeridos a minúsculas
      const normalizedRequiredPlans = Array.isArray(requiredPlans) 
        ? requiredPlans.map(p => p.toLowerCase())
        : [requiredPlans.toLowerCase()];
      
      // Verificar si el usuario tiene alguno de los planes requeridos o superior
      const hasValidPlan = normalizedRequiredPlans.some(requiredPlan => {
        const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
        return userPlanIndex >= requiredPlanIndex;
      });
      
      if (!hasValidPlan) {
        const highestRequiredPlan = normalizedRequiredPlans.reduce((highest, current) => {
          const currentIndex = planHierarchy.indexOf(current);
          const highestIndex = planHierarchy.indexOf(highest);
          return currentIndex > highestIndex ? current : highest;
        });
        
        logger.security('Access denied - insufficient plan', {
          userId: user.id,
          userPlan,
          requiredPlans: normalizedRequiredPlans,
          endpoint: req.originalUrl,
          ip: req.ip
        });
        
        return res.status(403).json({
          error: 'Plan upgrade required',
          message: `This feature requires ${highestRequiredPlan} plan or higher. Please upgrade your plan.`,
          currentPlan: userPlan,
          requiredPlan: highestRequiredPlan,
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

/**
 * Middleware que requiere plan profesional o superior
 */
const requireProfessionalPlan = validatePlan(['professional', 'enterprise']);

/**
 * Middleware que requiere plan empresarial
 */
const requireEnterprisePlan = validatePlan(['enterprise']);

// Alias para compatibilidad
const requirePlan = validatePlan;

module.exports = {
  getUserPlan,
  validatePlan,
  requirePlan,
  requireProfessionalPlan,
  requireEnterprisePlan
};