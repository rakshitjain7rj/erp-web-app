const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Costing = sequelize.define('Costing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  materialCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  laborCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'Costings',
  timestamps: true
});

module.exports = Costing;
