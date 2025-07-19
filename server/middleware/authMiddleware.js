const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// ✅ Middleware to verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded token data to req.user
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Alias for 'auth' for better naming
const validateToken = auth;

// ✅ Middleware to check role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: No access' });
    }
    next();
  };
};

// ✅ Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn('Non-admin user attempted to access admin-only route', {
      userId: req.user.id,
      username: req.user.name,
      role: req.user.role
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = { 
  auth, 
  validateToken, 
  authorizeRoles, 
  requireAdmin 
};
