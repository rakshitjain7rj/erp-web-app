const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, connectPostgres } = require('./config/postgres');

dotenv.config();

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
const countProductRoutes = require('./routes/countProductRoutes');
const dyeingFirmRoutes = require('./routes/dyeingFirmRoutes');
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
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180'
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
app.use('/api/count-products', countProductRoutes);
app.use('/api/dyeing-firms', dyeingFirmRoutes);
// app.use('/api/workorders', workOrderRoutes);
// app.use('/api/bom', bomRoutes);
// app.use('/api/costings', costingRoutes);
// app.use('/api/reports', reportRoutes);

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Machine performance routes
app.use('/api/machines', require('./routes/machinePerformanceRoutes'));

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

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
      console.log(`🔧 CORS enabled for: http://localhost:5173, http://localhost:5174, http://localhost:5175, http://localhost:5176, http://localhost:5177, http://localhost:5178, http://localhost:5179, http://localhost:5180`);
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
      console.log(`🔧 CORS enabled for: http://localhost:5173, http://localhost:5174, http://localhost:5175, http://localhost:5176, http://localhost:5177, http://localhost:5178, http://localhost:5179, http://localhost:5180`);
    });
  });
