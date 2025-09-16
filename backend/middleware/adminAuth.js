const logger = require('../utils/logger');

/**
 * Admin authentication middleware
 * Requires user to have admin or super_admin role
 */
const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role;
  const adminRoles = ['admin', 'super_admin'];

  if (!adminRoles.includes(userRole)) {
    logger.security('Admin access denied', {
      userId: req.user.id,
      userRole,
      endpoint: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }

  next();
};

module.exports = adminAuth;