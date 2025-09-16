// Enforces read-only (GET, HEAD, OPTIONS) for manager users globally.
// Must be mounted after auth (so req.user is populated) and before routes.
module.exports = function managerReadOnly(req, res, next) {
  if (!req.user || req.user.role !== 'manager') return next();

  const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (readOnlyMethods.includes(req.method)) return next();

  // Allow manager to hit auth/logout or profile endpoints if any (adjust as needed)
  const allowedWritePatterns = [
    /^\/api\/auth\/logout/i,
    /^\/api\/auth\/refresh/i,
  ];
  if (allowedWritePatterns.some(r => r.test(req.path))) return next();

  return res.status(403).json({ error: 'Managers have read-only access' });
}
