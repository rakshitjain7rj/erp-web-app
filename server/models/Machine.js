const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Machine = sequelize.define('Machine', {
  machineId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    // Format: M-01, M-02, etc.
  },
  
  machineName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Machine name is required'
      }
    }
  },
  
  machineType: {
    type: DataTypes.STRING,
    allowNull: false,
    // e.g., 'Spinning', 'Weaving', 'Dyeing', 'Quality Control'
  },
  
  capacity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    // Capacity per hour/day in kg or units
  },
  
  capacityUnit: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'kg/hour'
  },
  
  status: {
    type: DataTypes.ENUM('Active', 'Maintenance', 'Breakdown', 'Idle'),
    allowNull: false,
    defaultValue: 'Active'
  },
  
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  installationDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  lastMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  nextMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    // Store technical specifications as JSON
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
}, {
  tableName: 'Machines',
  timestamps: true,
  indexes: [
    {
      fields: ['machineId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['machineType']
    }
  ]
});

module.exports = Machine;
