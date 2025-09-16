const jwt = require('jsonwebtoken');

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

// ✅ Middleware to check role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: No access' });
    }
    next();
  };
};

// ✅ Middleware to enforce read-only access for manager role globally (non-GET blocked)
// Place this AFTER auth in the middleware chain (e.g., app.use(auth, readOnlyForManagers) )
// Or attach selectively on route groups.
const readOnlyForManagers = (req, res, next) => {
  try {
    if (req.user?.role === 'manager' && req.method !== 'GET') {
      return res.status(403).json({ error: 'Managers have read-only access' });
    }
  } catch (e) {
    // fall-through; if something unexpected happens, proceed (auth should have handled user)
  }
  next();
};

module.exports = { auth, authorizeRoles, readOnlyForManagers };
