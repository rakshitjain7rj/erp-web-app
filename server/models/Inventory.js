const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'pcs'
  }
}, {
  tableName: 'Inventory',
  timestamps: true
});

module.exports = Inventory;
