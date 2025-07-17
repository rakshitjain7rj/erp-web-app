const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Basic Product Information
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  rawMaterial: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Quantity & Production
  effectiveYarn: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  count: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  unitsProduced: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  initialQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  currentQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  gsm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  // Costing
  costPerKg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  totalValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  // Location & Storage
  location: {
    type: DataTypes.STRING,
    defaultValue: 'Main Warehouse',
  },
  warehouseLocation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  batchNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  supplierName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Manual Override Flags
  manualQuantity: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  manualValue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  manualYarn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Additional Information
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Available', 'Reserved', 'Out of Stock'),
    defaultValue: 'Available',
  },
}, {
  tableName: 'inventories',
  timestamps: true, // This adds createdAt and updatedAt
});

module.exports = Inventory;
