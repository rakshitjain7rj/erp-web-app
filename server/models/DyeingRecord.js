// models/DyeingRecord.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const DyeingRecord = sequelize.define('DyeingRecord', {
  yarnType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Yarn type is required'
      }
    }
  },
  sentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Sent date must be a valid date'
      },
      notInFuture(value) {
        if (new Date(value) > new Date()) {
          throw new Error('Sent date cannot be in the future');
        }
      }
    }
  },
  expectedArrivalDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Expected arrival date must be a valid date'
      },
      isAfterSentDate(value) {
        if (this.sentDate && new Date(value) <= new Date(this.sentDate)) {
          throw new Error('Expected arrival date must be after sent date');
        }
      }
    }
  },
  arrivalDate: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Arrival date must be a valid date'
      }
    }
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'DyeingRecords',
  timestamps: true,
  // Add virtual field for isOverdue
  getterMethods: {
    isOverdue() {
      if (this.arrivalDate) return false;
      return new Date() > new Date(this.expectedArrivalDate);
    }
  }
});

module.exports = DyeingRecord;