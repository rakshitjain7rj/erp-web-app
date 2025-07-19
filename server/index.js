const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, connectPostgres } = require('./config/postgres');
const logger = require('./utils/logger');

dotenv.config();

// ------------------- Load Models -------------------
const DyeingRecord = require('./models/DyeingRecord');
const User = require('./models/User');
const Machine = require('./models/Machine');
const DyeingFollowUp = require('./models/DyeingFollowUp');
const ASUMachine = require('./models/ASUMachine');
const ASUProductionEntry = require('./models/ASUProductionEntry');
const Inventory = require('./models/InventoryPostgres'); // Add PostgreSQL Inventory model
const Party = require('./models/Party'); // Add Party model

// ------------------- Set Up Associations -------------------
const models = {
  Machine,
  User,
  ASUMachine,
  ASUProductionEntry,
  Inventory, // Add Inventory to models
  Party, // Add Party to models
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
const asuMachineRoutes = require('./routes/asuMachineRoutes');
const yarnProductionRoutes = require('./routes/yarnProductionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
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

console.log('🔧 CORS Origin:', process.env.CORS_ORIGIN || 'http://localhost:3000');

// ------------------- Middleware -------------------
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
// app.use(limiter); // Uncomment for production
// Routes must be before errorHandler
app.use('/api/auth', authRoutes);
app.use('/api/dyeing', dyeingRoutes);

// Debug party routes registration
console.log('🔧 Registering party routes at /api/parties...');
console.log('🔧 partyRoutes type:', typeof partyRoutes);
console.log('🔧 partyRoutes object:', Object.keys(partyRoutes));
app.use('/api/parties', partyRoutes);
console.log('✅ Party routes registered at /api/parties');

app.use('/api/asu-unit1', asuUnit1Routes);
app.use('/api/asu-machines', asuMachineRoutes);
app.use('/api/yarn', yarnProductionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
// app.use('/api/workorders', workOrderRoutes);
// app.use('/api/bom', bomRoutes);
// app.use('/api/costings', costingRoutes);
// app.use('/api/reports', reportRoutes);

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
      'POST /api/test-post'
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

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ------------------- Error Handler -------------------
app.use(errorHandler);

// ------------------- Initialize Schedulers -------------------
const { initializeScheduler, dependencyStatus } = require('./schedulers/productionSummaryScheduler');

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL only
connectPostgres()
  .then(async () => {
    logger.info('✅ PostgreSQL connected');

    // Sync models with database
    try {
      await Inventory.sync({ alter: true }); // This will create/update the table
      logger.info('✅ Inventory table synced');
      
      await Party.sync({ alter: true }); // This will create/update the Parties table
      logger.info('✅ Party table synced');
    } catch (error) {
      logger.warn('⚠️ Table sync warning:', error.message);
    }

    logger.info('✅ Database setup complete');

    // Start the scheduler if dependencies are available
    if (dependencyStatus.ready) {
      try {
        await initializeScheduler();
        logger.info('📅 Production summary scheduler initialized');
      } catch (error) {
        logger.warn('⚠️ Failed to initialize scheduler:', error.message);
        logger.info('📅 Server will continue running without the scheduler');
      }
    } else {
      logger.warn(`⚠️ Scheduler dependencies missing: cron=${dependencyStatus.cron}, nodemailer=${dependencyStatus.nodemailer}`);
      logger.info('📅 Server will start without the scheduler. Install missing packages and restart.');
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API endpoints available at http://localhost:${PORT}/api`);
      logger.info(`📦 Inventory API: http://localhost:${PORT}/api/inventory`);
      logger.info(`🏢 Party API: http://localhost:${PORT}/api/parties`);
      logger.info(`🔧 CORS enabled for: http://localhost:5173, http://localhost:5174`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });
