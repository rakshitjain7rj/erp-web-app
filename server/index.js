const express = require('express');
const mongoose = require('mongoose');
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


dotenv.config();

// Routes
const authRoutes = require('./routes/authRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const bomRoutes = require('./routes/bomRoutes');
const costingRoutes = require('./routes/costingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dyeingRoutes = require('./routes/dyeingRoutes');



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(limiter);
app.use(errorHandler); // Always after all routes & parsers
// Comment
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/costings', costingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dyeing', dyeingRoutes);



// Error Handler
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

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
