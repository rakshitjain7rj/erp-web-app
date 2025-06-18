// server/models/DyeingFollowUp.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const DyeingFollowUp = sequelize.define('DyeingFollowUp', {
  dyeingRecordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  followUpDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'DyeingFollowUps',
  timestamps: true,
});

module.exports =  DyeingFollowUp ;
