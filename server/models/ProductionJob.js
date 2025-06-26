const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');

class ProductionJob extends Model {
  static associate(models) {
    // A production job belongs to a machine
    ProductionJob.belongsTo(models.Machine, {
      foreignKey: 'machineId',
      as: 'machine'
    });
  }

  // Generate next job ID
  static async generateNextJobId() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `PJ${year}${month}`;
    
    const lastJob = await ProductionJob.findOne({
      where: {
        jobId: {
          [sequelize.Sequelize.Op.like]: `${prefix}%`
        }
      },
      order: [['jobId', 'DESC']]
    });

    let nextNumber = 1;
    if (lastJob) {
      const lastNumber = parseInt(lastJob.jobId.slice(-4));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }
}

ProductionJob.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jobId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  productType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'kg',
    validate: {
      notEmpty: true
    }
  },
  machineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'machines',
      key: 'id'
    }
  },
  workerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  actualHours: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  partyName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  dyeingOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Detailed Job Card Fields
  theoreticalEfficiency: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: 'Theoretical efficiency targets and benchmarks'
  },
  qualityTargets: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: 'Quality targets and specifications'
  },
  shiftAssignments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Shift assignments and operator details'
  },
  initialUtilityReadings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: 'Initial utility readings at job start'
  },
  finalUtilityReadings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: 'Final utility readings at job completion'
  },
  hourlyUtilityReadings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Hourly utility readings during production'
  },
  hourlyEfficiency: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Hourly efficiency tracking data'
  },
  overallEfficiency: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Overall efficiency percentage'
  },
  totalDowntime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Total downtime in minutes'
  },
  qualityScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Quality score percentage'
  },
  costPerUnit: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Cost per unit produced'
  },
  processParameters: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Process parameters and settings'
  },
  qualityControlData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Quality control test results and data'
  },
  
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ProductionJob',
  tableName: 'production_jobs',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['jobId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['machineId']
    },
    {
      fields: ['workerId']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = ProductionJob;
