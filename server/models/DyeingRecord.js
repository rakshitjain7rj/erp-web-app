const { DataTypes } = require('sequelize');
const { sequelize }= require('../config/postgres'); // Your PostgreSQL config

const DyeingRecord = sequelize.define('DyeingRecord', {
  yarnType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  arrivalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isOverdue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'DyeingRecords',
  timestamps: true
});

module.exports =  DyeingRecord ;
