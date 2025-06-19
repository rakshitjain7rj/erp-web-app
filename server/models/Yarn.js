const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Yarn = sequelize.define('Yarn', {
  lotNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color: DataTypes.STRING,
  status: DataTypes.STRING,
}, {});

module.exports = Yarn;
