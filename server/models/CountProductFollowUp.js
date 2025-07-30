// server/models/CountProductFollowUp.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const CountProductFollowUp = sequelize.define('CountProductFollowUp', {
  countProductId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // Removed references to non-existent CountProducts table
    // Will add foreign key constraint later when CountProducts table exists
  },
  followUpDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Remarks are required'
      }
    }
  },
  addedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    // We'll add foreign key constraint later when data is stable
  },
  addedByName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'System User',
  }
}, {
  tableName: 'CountProductFollowUps',
  timestamps: true,
  // Add indexes for performance
  indexes: [
    {
      fields: ['countProductId']
    },
    {
      fields: ['addedBy']
    },
    {
      fields: ['followUpDate']
    }
  ]
});

module.exports = CountProductFollowUp;
