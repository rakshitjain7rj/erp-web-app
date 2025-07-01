const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, connectPostgres } = require('./config/postgres');

// Load models for Sequelize sync
const DyeingRecord = require('./models/DyeingRecord');
const User = require('./models/User');
const Machine = require('./models/Machine');
require('./models/DyeingFollowUp');
require('./models/ASUModels');

// Set up model associations
const models = { Machine, User };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

dotenv.config();

// Routes
const authRoutes = require('./routes/authRoutes');
// const workOrderRoutes = require('./routes/workOrderRoutes');
// const inventoryRoutes = require('./routes/inventoryRoutes');
// const bomRoutes = require('./routes/bomRoutes');
// const costingRoutes = require('./routes/costingRoutes');
// const reportRoutes = require('./routes/reportRoutes');
const dyeingRoutes = require('./routes/dyeingRoutes');
const partyRoutes = require('./routes/partyRoutes');
const asuRoutes = require('./routes/asuRoutes');



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit
});

const app = express();

// Debug CORS configuration
console.log('🔧 CORS Origin:', process.env.CORS_ORIGIN || 'http://localhost:3000');

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
// app.use(limiter); // Temporarily disabled for testing
app.use(errorHandler); // Always after all routes & parsers
// Comment
// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/workorders', workOrderRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/bom', bomRoutes);
// app.use('/api/costings', costingRoutes);
// app.use('/api/reports', reportRoutes);
app.use('/api/dyeing', dyeingRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/asu-unit2', asuRoutes);

// Error Handler
app.use(errorHandler);

// PostgreSQL Connection & Sync
const PORT = process.env.PORT || 5000;
connectPostgres()
  .then(async () => {
    console.log('✅ PostgreSQL connected');
    
    // Skip automatic sync to avoid column type conflicts
    console.log('✅ Skipping automatic sync - manual schema management');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ PostgreSQL error:', err);
  });
