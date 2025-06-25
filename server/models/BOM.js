const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const BOM = sequelize.define('BOM', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'BOMs',
  timestamps: true
});

module.exports = BOM;
