# Production Job Cards System - PostgreSQL ERP

A comprehensive Production Job Cards management system built with Node.js, Express, Sequelize (PostgreSQL), and React TypeScript. This system is designed specifically for yarn manufacturing ERP with detailed job tracking, machine efficiency monitoring, and production analytics.

## 🚀 Features

### Backend Features
- **PostgreSQL Database**: Complete PostgreSQL integration with Sequelize ORM
- **Production Job Management**: Create, track, and manage production jobs
- **Machine Management**: Manage manufacturing machines and equipment
- **Detailed Job Cards**: Support for theoretical efficiency, quality targets, shift assignments
- **Utility Readings**: Track steam, water, power consumption hourly
- **Hourly Efficiency**: Monitor production efficiency hour by hour
- **Production Analytics**: Comprehensive statistics and reporting
- **RESTful API**: Complete REST API with proper error handling

### Frontend Features
- **Modern React UI**: Built with TypeScript and Tailwind CSS
- **Production Dashboard**: Visual stats and job overview
- **Job Management**: Create, edit, view, and manage production jobs
- **Real-time Updates**: Live status updates and notifications
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Full TypeScript support

## 🏗️ Architecture

```
├── server/                 # Backend (Node.js + Express + Sequelize)
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   └── middleware/       # Express middleware
├── erp-frontend/         # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── api/          # API client functions
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── types/        # TypeScript definitions
└── *.sql                # Database migration scripts
```

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **PostgreSQL** 12+ database server
- **Git** for version control

## 🔧 Installation & Setup

### 1. Database Setup

First, create and set up your PostgreSQL database:

```sql
-- Create database
CREATE DATABASE yarn_erp;

-- Create a user (optional)
CREATE USER yarn_erp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE yarn_erp TO yarn_erp_user;
```

### 2. Run Database Migrations

Execute the database schema migration:

```bash
# Connect to your PostgreSQL database and run:
psql -d yarn_erp -f production_schema_migration.sql
```

This will create all necessary tables:
- `machines` - Manufacturing machines and equipment
- `production_jobs` - Production job cards with detailed tracking
- `users` - User management (if not exists)
- `Costings` - Costing records (if not exists)

### 3. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=yarn_erp
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret
# PORT=5000

# Test the models (optional)
node test-models.js

# Start the server
npm run dev
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd erp-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Database Schema

### Machines Table
```sql
- id (Primary Key)
- machineId (Unique identifier)
- name (Machine name)
- type (dyeing, spinning, weaving, finishing, other)
- location, capacity, status
- specifications (JSONB)
- createdAt, updatedAt
```

### Production Jobs Table
```sql
- id (Primary Key)
- jobId (Unique job identifier)
- productType, quantity, unit
- machineId (Foreign Key to machines)
- workerId (Foreign Key to users)
- status (pending, in_progress, completed, cancelled)
- priority (low, medium, high, urgent)
- startDate, endDate, dueDate
- estimatedHours, actualHours
- partyName, dyeingOrderId, notes

# Detailed Job Card Fields (JSONB):
- theoreticalEfficiency (targets and benchmarks)
- qualityTargets (specifications)
- shiftAssignments (operator assignments)
- initialUtilityReadings, finalUtilityReadings
- hourlyUtilityReadings (steam, water, power consumption)
- hourlyEfficiency (production tracking by hour)
- overallEfficiency, totalDowntime, qualityScore
- costPerUnit, processParameters, qualityControlData
```

## 🔗 API Endpoints

### Production Jobs
- `GET /api/production` - Get all production jobs (with filters & pagination)
- `POST /api/production` - Create new production job
- `POST /api/production/detailed` - Create detailed production job
- `GET /api/production/:id` - Get production job by ID
- `PUT /api/production/:id` - Update production job
- `DELETE /api/production/:id` - Delete production job
- `PATCH /api/production/:id/status` - Update job status
- `POST /api/production/:id/start` - Start production job
- `POST /api/production/:id/complete` - Complete production job
- `POST /api/production/:id/efficiency` - Add hourly efficiency entry
- `POST /api/production/:id/utility-reading` - Add utility reading
- `GET /api/production/stats` - Get production statistics

### Machines
- `GET /api/production/machines` - Get all machines
- `POST /api/production/machines` - Create new machine
- `GET /api/production/machines/:id` - Get machine by ID
- `PUT /api/production/machines/:id` - Update machine
- `DELETE /api/production/machines/:id` - Delete machine
- `GET /api/production/machines/type/:type` - Get machines by type
- `GET /api/production/machines/active` - Get active machines

## 💡 Usage Examples

### Creating a Production Job

```javascript
// Frontend API call
const jobData = {
  productName: "Cotton Yarn 30s",
  quantity: 500,
  unit: "kg",
  machineId: 1,
  priority: "high",
  dueDate: "2025-01-15",
  partyName: "ABC Textiles",
  theoreticalEfficiency: {
    targetEfficiencyPercent: 85,
    standardProductionRate: 50,
    idealCycleTime: 60,
    qualityTargetPercent: 98
  },
  qualityTargets: {
    colorMatchingTolerance: 0.5,
    strengthRetention: 95,
    shrinkageLimit: 2,
    defectRate: 1
  }
};

const response = await productionApi.createDetailed(jobData);
```

### Adding Hourly Efficiency

```javascript
const efficiencyData = {
  hour: 1,
  actualProduction: 45,
  targetProduction: 50,
  downtimeMinutes: 15,
  qualityIssues: 2,
  notes: "Minor adjustment needed"
};

await productionApi.addHourlyEfficiency(jobId, efficiencyData);
```

## 🛠️ Development

### Running Tests
```bash
# Backend model tests
cd server
node test-models.js

# Frontend type checking
cd erp-frontend
npm run type-check
```

### Building for Production
```bash
# Backend (already production ready)
cd server
npm start

# Frontend
cd erp-frontend
npm run build
```

## 🗃️ Key Differences from MongoDB

This system is built entirely for **PostgreSQL** with the following advantages:

1. **ACID Compliance**: Full transaction support for data integrity
2. **Complex Queries**: Advanced SQL queries and joins for reporting
3. **JSONB Support**: Flexible JSON storage for dynamic fields
4. **Performance**: Better performance for complex analytical queries
5. **Data Relationships**: Proper foreign key constraints and referential integrity
6. **Scalability**: Better horizontal and vertical scaling options

## 🔒 Security Features

- JWT token-based authentication
- Input validation and sanitization
- SQL injection prevention via Sequelize ORM
- CORS configuration
- Rate limiting
- Helmet.js security headers

## 📈 Monitoring & Analytics

The system provides comprehensive analytics:
- Overall production efficiency
- Machine utilization rates
- Quality metrics tracking
- Downtime analysis
- Cost per unit calculations
- Real-time job status monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software for yarn manufacturing ERP systems.

## 🆘 Support & Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service is running
   - Verify database credentials in .env file
   - Ensure database exists

2. **Migration Errors**
   - Run the SQL migration script manually
   - Check for existing table conflicts
   - Verify user permissions

3. **API Errors**
   - Check server logs for detailed error messages
   - Verify all environment variables are set
   - Ensure all dependencies are installed

### Environment Variables

Required environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yarn_erp
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

For support, check the console logs and error messages. The system provides detailed error logging for troubleshooting.
