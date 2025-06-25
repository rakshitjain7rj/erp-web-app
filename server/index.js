const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, connectPostgres } = require('./config/postgres');
const DyeingRecord = require('./models/DyeingRecord');
const User = require('./models/User'); // Load User model
require('./models/DyeingFollowUp'); // 👈 load this model for sync
require('./models/ProductionJob'); // Load ProductionJob model
require('./models/Machine'); // Load Machine model


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
const productionRoutes = require('./routes/productionRoutes');



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit
});

const app = express();

// Middleware
app.use(cors());
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
app.use('/api/production', productionRoutes);



// Error Handler
app.use(errorHandler);

// PostgreSQL Connection & Sync
const PORT = process.env.PORT || 5000;
connectPostgres()
  .then(async () => {
    console.log('✅ PostgreSQL connected');
    
    // First, ensure system user exists
    const User = require('./models/User');
    await User.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        name: 'System User',
        email: 'system@example.com',
        password: '$2b$10$example',
        role: 'admin'
      }
    });
    console.log('✅ System user ensured');
    
    // Force sync to ensure all columns are added
    return sequelize.sync({ alter: true, force: false }); // Sync all models
  })
  .then(() => {
    console.log('✅ PostgreSQL tables synced');
    
    // Additional check to ensure the DyeingFollowUp table has correct structure
    return sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'DyeingFollowUps'
    `);
  })
  .then((results) => {
    console.log('DyeingFollowUps columns:', results[0].map(row => row.column_name));
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ PostgreSQL error:', err);
  });
