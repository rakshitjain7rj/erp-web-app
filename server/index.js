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
const ASUMachine = require('./models/ASUMachine');
const ASUProductionEntry = require('./models/ASUProductionEntry');
const Inventory = require('./models/InventoryPostgres'); // Add PostgreSQL Inventory model

// ------------------- Set Up Associations -------------------
const models = {
  Machine,
  User,
  ASUMachine,
  ASUProductionEntry,
  Inventory, // Add Inventory to models
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
app.use('/api/parties', partyRoutes);
app.use('/api/asu-unit1', asuUnit1Routes);
app.use('/api/asu-machines', asuMachineRoutes);
app.use('/api/yarn', yarnProductionRoutes);
app.use('/api/inventory', inventoryRoutes);
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
      'POST /api/inventory'
    ]
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

// Connect to PostgreSQL only
connectPostgres()
  .then(async () => {
    console.log('✅ PostgreSQL connected');

    // Sync Inventory model with database
    try {
      await Inventory.sync({ alter: true }); // This will create/update the table
      console.log('✅ Inventory table synced');
    } catch (error) {
      console.warn('⚠️ Inventory table sync warning:', error.message);
    }

    console.log('✅ Database setup complete');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`📦 Inventory API: http://localhost:${PORT}/api/inventory`);
      console.log(`🔧 CORS enabled for: http://localhost:5173, http://localhost:5174`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });
