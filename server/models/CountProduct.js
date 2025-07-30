// server/models/CountProduct.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const CountProduct = sequelize.define('CountProduct', {
  partyName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Party name is required'
      }
    }
  },
  dyeingFirm: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Dyeing firm is required'
      }
    }
  },
  yarnType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Yarn type is required'
      }
    }
  },
  count: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Count is required'
      }
    }
  },
  shade: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Shade is required'
      }
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Quantity must be positive'
      }
    }
  },
  completedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Completed date must be a valid date'
      }
    }
  },
  qualityGrade: {
    type: DataTypes.ENUM('A', 'B', 'C'),
    allowNull: false,
    defaultValue: 'A'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lotNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Lot number is required'
      }
    }
  },
  processedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'System'
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Customer name is required'
      }
    }
  },
  sentToDye: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  received: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  receivedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  receivedQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Received quantity must be positive'
      }
    }
  },
  dispatch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  dispatchDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dispatchQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Dispatch quantity must be positive'
      }
    }
  },
  middleman: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Direct Supply'
  }
}, {
  tableName: 'CountProducts',
  timestamps: true,
  // Add indexes for performance
  indexes: [
    {
      fields: ['partyName']
    },
    {
      fields: ['dyeingFirm']
    },
    {
      fields: ['completedDate']
    },
    {
      fields: ['lotNumber'],
      unique: true
    }
  ]
});

module.exports = CountProduct;
