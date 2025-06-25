const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const ProductionJob = sequelize.define('ProductionJob', {
  jobId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    // Auto-generated format: JB-001, JB-002, etc.
  },
  
  // Product Information
  productType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Product type is required'
      }
    }
  },
  
  // Production Details
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Quantity must be a valid number'
      },
      min: {
        args: [0.01],
        msg: 'Quantity must be greater than 0'
      }
    }
  },
  
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'kg'
  },
  
  // Assignment Information
  machineId: {
    type: DataTypes.STRING,
    allowNull: true,
    // References machine master (to be created)
  },
  
  workerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  workerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // References User model for workers
  },
  
  // Status Management
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'On Hold', 'Quality Check'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    allowNull: false,
    defaultValue: 'Medium'
  },
  
  // Date Management
  scheduledStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  actualStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  expectedCompletionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  actualCompletionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // Integration with existing systems
  partyName: {
    type: DataTypes.STRING,
    allowNull: true,
    // Links to Party Master
  },
  
  dyeingOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // Links to DyeingRecord if this job is related to dyeing
  },
  
  // Additional Production Details
  yarnType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  shade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  count: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  // Quality and Tracking
  qualityGrade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'Rejected'),
    allowNull: true,
  },
  
  defectPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  
  // Notes and Documentation
  productionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  qualityNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  // Created by information
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
    createdByName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'System User',
  },
  
  // Extended fields for comprehensive job card system
  theoreticalEfficiency: {
    type: DataTypes.TEXT, // JSON string containing theoretical parameters
    allowNull: true,
    comment: 'JSON data: numberOfThreads, yarnWeight10Min, idealPerformance12Hours, benchmarkEfficiency, machineSpeed'
  },
  
  qualityTargets: {
    type: DataTypes.TEXT, // JSON string containing quality parameters
    allowNull: true,
    comment: 'JSON data: targetYarnCount, minStrength, maxUnevenness, maxHairiness'
  },
  
  shiftAssignments: {
    type: DataTypes.TEXT, // JSON string containing shift data
    allowNull: true,
    comment: 'JSON data: Array of shift assignments with supervisors and operators'
  },
  
  initialUtilityReadings: {
    type: DataTypes.TEXT, // JSON string containing initial utility readings
    allowNull: true,
    comment: 'JSON data: Initial utility readings at job start'
  },
  
  hourlyEfficiency: {
    type: DataTypes.TEXT, // JSON string containing hourly efficiency data
    allowNull: true,
    comment: 'JSON data: Hourly efficiency tracking data'
  },
  
  dailyUtilityReadings: {
    type: DataTypes.TEXT, // JSON string containing daily utility readings
    allowNull: true,
    comment: 'JSON data: Daily utility readings at 8AM and 8PM'
  },
  
  actualEfficiency: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Calculated actual efficiency percentage'
  },
  
  efficiencyVariance: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Difference from benchmark efficiency'
  },
  
  totalDowntime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total downtime in minutes'
  },
  
  qualityActual: {
    type: DataTypes.TEXT, // JSON string containing actual quality measurements
    allowNull: true,
    comment: 'JSON data: Actual quality measurements vs targets'
  },
  
}, {
  tableName: 'ProductionJobs',
  timestamps: true,
  indexes: [
    {
      fields: ['jobId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['machineId']
    },
    {
      fields: ['workerId']
    },
    {
      fields: ['partyName']
    },
    {
      fields: ['dyeingOrderId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
ProductionJob.prototype.isOverdue = function () {
  if (this.status === 'Completed' || !this.expectedCompletionDate) return false;
  return new Date() > new Date(this.expectedCompletionDate);
};

ProductionJob.prototype.getDurationDays = function () {
  if (!this.actualStartDate) return null;
  const endDate = this.actualCompletionDate || new Date();
  const startDate = new Date(this.actualStartDate);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
};

// Class method to generate next job ID
ProductionJob.generateNextJobId = async function() {
  const lastJob = await ProductionJob.findOne({
    order: [['createdAt', 'DESC']],
    attributes: ['jobId']
  });
  
  if (!lastJob) {
    return 'JB-001';
  }
  
  const lastNumber = parseInt(lastJob.jobId.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `JB-${nextNumber.toString().padStart(3, '0')}`;
};

module.exports = ProductionJob;
