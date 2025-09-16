const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { corsOptions, allowedOrigins, applyCors } = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { setupProcessHandlers } = require('./utils/errorHandlers');

// ------------------- Environment Configuration (moved early) -------------------
// Load environment file explicitly based on NODE_ENV before requiring DB config.
const INIT_NODE_ENV = process.env.NODE_ENV || 'development';
const envFileSpecificEarly = path.resolve(__dirname, `.env.${INIT_NODE_ENV}`);
const envFileDefaultEarly = path.resolve(__dirname, '.env');
let loadedPathEarly = null;
if (require('fs').existsSync(envFileSpecificEarly)) {
  dotenv.config({ path: envFileSpecificEarly });
  loadedPathEarly = envFileSpecificEarly;
} else if (require('fs').existsSync(envFileDefaultEarly)) {
  dotenv.config({ path: envFileDefaultEarly });
  loadedPathEarly = envFileDefaultEarly;
} else {
  dotenv.config();
  loadedPathEarly = 'process.env only (no .env file found)';
}
console.log(`🔧 Loaded environment (${INIT_NODE_ENV}) from: ${loadedPathEarly}`);
console.log('🌐 NODE_ENV:', INIT_NODE_ENV);

// Now require database (will respect already-loaded env vars)
let sequelize, connectPostgres, sequelizeInstance;
({ sequelize, connectPostgres } = require('./config/postgres'));
sequelizeInstance = sequelize;

// Ensure ASU machines are unique per unit at DB level (idempotent)
async function ensureASUMachineCompositeUnique() {
  const sql = `
BEGIN;
-- Drop any single-column unique constraint on machine_no
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'asu_machines'
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND (
        SELECT attname FROM pg_attribute 
        WHERE attrelid = t.oid AND attnum = c.conkey[1]
      ) = 'machine_no'
  ) LOOP
    EXECUTE format('ALTER TABLE public.asu_machines DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Drop any standalone unique index on machine_no
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT i.indexrelid::regclass::text AS index_name
    FROM pg_index i
    JOIN pg_class ic ON ic.oid = i.indexrelid
    JOIN pg_class tc ON tc.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = tc.relnamespace
    WHERE n.nspname = 'public'
      AND tc.relname = 'asu_machines'
      AND i.indisunique = true
      AND i.indnatts = 1
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
      AND EXISTS (
        SELECT 1 FROM pg_attribute a 
        WHERE a.attrelid = tc.oid AND a.attnum = ANY(i.indkey) AND a.attname = 'machine_no'
      )
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || r.index_name;
  END LOOP;
END $$;

-- Add composite unique (unit, machine_no)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'asu_machines'
      AND c.contype = 'u'
      AND c.conname = 'unique_unit_machine_no'
  ) THEN
    ALTER TABLE public.asu_machines ADD CONSTRAINT unique_unit_machine_no UNIQUE (unit, machine_no);
  END IF;
END $$;

-- Helpful index on unit
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_asu_machines_unit') THEN
    CREATE INDEX idx_asu_machines_unit ON public.asu_machines(unit);
  END IF;
END $$;

COMMIT;`;
  try {
    await sequelizeInstance.query(sql);
    console.log('✅ Ensured composite unique (unit, machine_no) on asu_machines');
  } catch (e) {
    console.warn('⚠️ Failed ensuring composite unique (unit, machine_no):', e.message);
  }
}

// (Environment loading moved to top)

// ------------------- Load Models -------------------
const DyeingRecord = require('./models/DyeingRecord');
const User = require('./models/User');
const Machine = require('./models/Machine');
const DyeingFollowUp = require('./models/DyeingFollowUp');
const CountProduct = require('./models/CountProduct');
const CountProductFollowUp = require('./models/CountProductFollowUp');
const DyeingFirm = require('./models/DyeingFirm');
const ASUMachine = require('./models/ASUMachine');
const ASUProductionEntry = require('./models/ASUProductionEntry');
const Inventory = require('./models/InventoryPostgres'); // Add PostgreSQL Inventory model
const Party = require('./models/Party'); // Add Party model
const MachineConfiguration = require('./models/MachineConfiguration'); // Add Machine Configuration model

// ------------------- Set Up Associations -------------------
const models = {
  Machine,
  User,
  CountProduct,
  CountProductFollowUp,
  DyeingFirm,
  ASUMachine,
  ASUProductionEntry,
  Inventory, // Add Inventory to models
  Party, // Add Party to models
  MachineConfiguration, // Add MachineConfiguration to models
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// ------------------- Load Routes -------------------
const authRoutes = require('./routes/authRoutes');
const dyeingRoutes = require('./routes/dyeingRoutes');
const partyRoutes = require('./routes/partyRoutes');
const asuUnit1Routes = require('./routes/asuUnit1Routes');
const asuUnit2Routes = require('./routes/asuUnit2Routes');
const asuMachineRoutes = require('./routes/asuMachineRoutes');
const yarnProductionRoutes = require('./routes/yarnProductionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const countProductRoutes = require('./routes/countProductRoutes');
const dyeingFirmRoutes = require('./routes/dyeingFirmRoutes');
const machineConfigRoutes = require('./routes/machineConfigurationRoutes');
const userRoutes = require('./routes/user'); // <-- Users (RBAC & approvals)
const { auth } = require('./middleware/authMiddleware');
const managerReadOnly = require('./middleware/roleReadOnly');
// const workOrderRoutes = require('./routes/workOrderRoutes');
// const bomRoutes = require('./routes/bomRoutes');
// const costingRoutes = require('./routes/costingRoutes');
// const reportRoutes = require('./routes/reportRoutes');

// ------------------- Rate Limiting -------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit for testing and internal use
});

// ------------------- Express App Init -------------------
const app = express();

// Set up global error handlers for the Node.js process
setupProcessHandlers();

console.log('🔧 Allowed CORS Origins:', allowedOrigins.join(', '));

// ------------------- Middleware -------------------
// Apply centralized CORS (must be early)
applyCors(app);
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
// app.use(limiter); // Uncomment for production
// Routes must be before errorHandler
// Primary auth route mount
app.use('/api/auth', authRoutes);
// Defensive alias: if frontend accidentally calls without /api prefix (legacy bundle / mis-set VITE_API_URL), still serve.
app.use('/auth', (req, res, next) => {
  console.warn('⚠️ Received auth request without /api prefix. Consider fixing frontend base URL. Path:', req.path);
  next();
}, authRoutes);
app.use('/api/dyeing', dyeingRoutes);

// Debug party routes registration
console.log('🔧 Registering party routes at /api/parties...');
console.log('🔧 partyRoutes type:', typeof partyRoutes);
console.log('🔧 partyRoutes object:', Object.keys(partyRoutes));
app.use('/api/parties', partyRoutes);
console.log('✅ Party routes registered at /api/parties');

app.use('/api/asu-unit1', asuUnit1Routes);
console.log('✅ Registered ASU Unit 1 routes at /api/asu-unit1');
app.use('/api/asu-unit2', asuUnit2Routes);
console.log('✅ Registered ASU Unit 2 routes at /api/asu-unit2');
app.use('/api/asu-machines', asuMachineRoutes);
app.use('/api/yarn', yarnProductionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/count-products', countProductRoutes);
app.use('/api/dyeing-firms', dyeingFirmRoutes);
// Apply manager read-only enforcement for all subsequent API routes (requires token)
app.use('/api', (req, res, next) => {
  // Quick JWT extraction (reuse logic from auth middleware lightly to avoid double verify if already run)
  if (!req.user) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try { req.user = require('jsonwebtoken').verify(token, process.env.JWT_SECRET); } catch (_) {}
    }
  }
  managerReadOnly(req, res, next);
});
// Users (RBAC & approval workflow)
app.use('/api/users', userRoutes);
// Optional legacy alias without /api (warn & continue) – remove later when frontend stabilized
app.use('/users', (req, res, next) => { 
  console.warn('⚠️ Received users request without /api prefix. Consider updating frontend. Path:', req.path); 
  next(); 
}, userRoutes);
// app.use('/api/workorders', workOrderRoutes);
// app.use('/api/bom', bomRoutes);
// app.use('/api/costings', costingRoutes);
// app.use('/api/reports', reportRoutes);

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Machine performance routes
app.use('/api/machines', require('./routes/machinePerformanceRoutes'));
app.use('/api', machineConfigRoutes);

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/test',
      'GET /api/inventory',
      'POST /api/inventory',
      'GET /api/parties/summary',
      'POST /api/parties',
      'POST /api/parties-direct',
      'POST /api/test-post',
      'GET /api/machines/performance'
    ]
  });
});

// Debug route to check registered routes
app.get('/api/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// Simple test POST route
app.post('/api/test-post', (req, res) => {
  console.log('🚀 Test POST route hit');
  console.log('📝 Request body:', req.body);
  res.json({ 
    message: 'POST is working!', 
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Direct party POST route for testing
app.post('/api/parties-direct', (req, res) => {
  console.log('🚀 Direct party POST route hit');
  console.log('📝 Request body:', req.body);
  res.json({ 
    message: 'Direct party POST is working!', 
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Replace simple /health with enhanced version and add /ready
// Safely remove any existing /health route (Express 5 internal structure can differ during early init)
try {
  if (app && app._router && Array.isArray(app._router.stack)) {
    app._router.stack = app._router.stack.filter(m => !(m.route && m.route.path === '/health'));
  } else {
    console.warn('⚠️ Skipping pre-existing /health route removal: router stack not initialized yet');
  }
} catch (e) {
  console.warn('⚠️ Error while attempting to remove existing /health route (continuing):', e.message);
}
app.get('/health', (req, res) => {
  const uptimeSeconds = process.uptime();
  res.json({
    status: 'ok',
    service: 'asu-erp-api',
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    uptimeHuman: `${Math.floor(uptimeSeconds/60)}m ${Math.floor(uptimeSeconds)%60}s`,
    memory: process.memoryUsage(),
    pid: process.pid
  });
});
app.get('/ready', async (req, res) => {
  // Lightweight DB readiness check
  try {
    await sequelizeInstance.query('SELECT 1');
    res.json({ status: 'ready', db: 'up', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'degraded', db: 'down', error: e.message, timestamp: new Date().toISOString() });
  }
});

// ------------------- Error Handler -------------------
app.use(errorHandler);

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL but start server regardless
connectPostgres()
  .then(async (connected) => {
    if (connected) {
      console.log('✅ PostgreSQL connected');

      // Sync models with database
      try {
        console.log('🔄 Starting database table sync...');
        
        await User.sync({ alter: true }); // This will create/update the Users table
        console.log('✅ Users table synced');
        
        await Inventory.sync({ alter: true }); // This will create/update the table
        console.log('✅ Inventory table synced');
        
        await Party.sync({ alter: true }); // This will create/update the Parties table
        console.log('✅ Party table synced');
        
        await ASUMachine.sync({ alter: true }); // This will create/update the ASU Machines table
        console.log('✅ ASU Machines table synced');
        
        await ASUProductionEntry.sync({ alter: true }); // This will create/update the ASU Production Entries table
        console.log('✅ ASU Production Entries table synced');
        
        // Sync Machine table with error handling for enum issues
        try {
          await Machine.sync({ alter: true }); // This will create/update the Machines table
          console.log('✅ Machines table synced');
        } catch (machineError) {
          console.warn('⚠️ Machines table sync error (continuing):', machineError.message);
        }
        
        await DyeingRecord.sync({ alter: true }); // This will create/update the Dyeing Records table
        console.log('✅ Dyeing Records table synced');
        
        await DyeingFollowUp.sync({ alter: true }); // This will create/update the Dyeing Follow Up table
        console.log('✅ Dyeing Follow Up table synced');
        
        await CountProduct.sync({ alter: true }); // This will create/update the Count Products table
        console.log('✅ Count Products table synced');
        
        await DyeingFirm.sync({ alter: true }); // This will create/update the Dyeing Firms table
        console.log('✅ Dyeing Firms table synced');
        
        // Sync CountProductFollowUp table
        try {
          const CountProductFollowUp = require('./models/CountProductFollowUp');
          await CountProductFollowUp.sync({ alter: true }); // This will create/update the Count Product Follow Up table
          console.log('✅ Count Product Follow Up table synced');
        } catch (error) {
          console.warn('⚠️ Count Product Follow Up table sync failed:', error.message);
        }
        
        console.log('✅ Database setup complete');
      } catch (error) {
        console.warn('⚠️ Database sync error:', error.message);
        console.warn('⚠️ Server will continue without full database sync');
      }
    } else {
      console.warn('⚠️ Running without database - some features will not work');
    }

    // Start server regardless of database connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`📦 Inventory API: http://localhost:${PORT}/api/inventory`);
      console.log(`🏢 Party API: http://localhost:${PORT}/api/parties`);
      console.log(`🧪 Test API route: http://localhost:${PORT}/api/test`);
  console.log(`🔧 CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    console.warn('⚠️ Starting server without database connection - some features will not work');
    
    // Start server even if database connection fails
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without database)`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🧪 Test API route: http://localhost:${PORT}/api/test`);
  console.log(`🔧 CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  });
