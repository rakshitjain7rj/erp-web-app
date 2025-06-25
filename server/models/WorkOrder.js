const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const WorkOrder = sequelize.define('WorkOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  }
}, {
  tableName: 'WorkOrders',
  timestamps: true
});

module.exports = WorkOrder;
