// Centralized CORS configuration
// Requirements:
//  1. Allow localhost dev frontend and Netlify production
//  2. Support credentials (cookies / auth headers)
//  3. Apply uniformly to all routes
//  4. Allow optional extension via env var CORS_ORIGINS (comma separated)
//  5. Production safe: explicit methods, headers, short preflight cache

const DEFAULT_ALLOWED = [
  'http://localhost:5173',
  'https://asuerp.netlify.app'
];

// Build a Set for O(1) lookups
const allowedOriginsSet = new Set(DEFAULT_ALLOWED);

if (process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGINS.split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .forEach(o => allowedOriginsSet.add(o));
}

// Export as array for logging / inspection
const allowedOrigins = Array.from(allowedOriginsSet);

// Core options object used by cors middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / curl / same-origin requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOriginsSet.has(origin)) return callback(null, true);
    // Fail silently for disallowed origins to avoid leaking list (optional)
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }
    return callback(new Error('CORS: Origin not allowed: ' + origin));
  },
  credentials: true,
  methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: [
    'Origin','X-Requested-With','Content-Type','Accept','Authorization'
  ],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 600, // cache preflight for 10 minutes
  optionsSuccessStatus: 204,
};

/**
 * Helper to apply CORS consistently (including Vary header + OPTIONS handling)
 * @param {import('express').Express} app
 */
function applyCors(app) {
  const cors = require('cors');
  // Ensure caches differentiate per Origin
  app.use((req, res, next) => { res.header('Vary', 'Origin'); next(); });
  app.use(cors(corsOptions));
  // Express 5 (path-to-regexp v6) no longer accepts '*' as a valid path pattern.
  // The cors middleware already handles preflight (OPTIONS) requests for matched routes.
  // If you still want an explicit catch-all, use a regex instead of '*':
  // app.options(/.*/, cors(corsOptions));
}

module.exports = { corsOptions, allowedOrigins, applyCors };
