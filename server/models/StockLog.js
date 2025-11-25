const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const StockLog = sequelize.define('StockLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  inventoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'inventories',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('in', 'out', 'spoilage'),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Additional fields based on type
  source: { // For 'in'
    type: DataTypes.STRING,
    allowNull: true,
  },
  usagePurpose: { // For 'out'
    type: DataTypes.STRING,
    allowNull: true,
  },
  reason: { // For 'spoilage'
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'stock_logs',
  timestamps: true,
});

module.exports = StockLog;
