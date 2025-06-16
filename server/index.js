const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const bomRoutes = require('./routes/bomRoutes');
const costingRoutes = require('./routes/costingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // limit each IP to 100 requests per 15 mins
});


// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(errorHandler);
app.use(morgan('dev'));
app.use(helmet());
app.use(limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/costings', costingRoutes);
app.use('/api/reports', reportRoutes);



// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection failed:', err));

// Start Server
const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
