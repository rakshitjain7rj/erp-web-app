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
  tableName: 'DyeingFollowUps',
  timestamps: true,
  // Add indexes for performance
  indexes: [
    {
      fields: ['dyeingRecordId']
    },
    {
      fields: ['addedBy']
    }
  ]
});

module.exports = DyeingFollowUp;
