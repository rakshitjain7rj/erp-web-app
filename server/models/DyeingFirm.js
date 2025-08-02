// server/models/DyeingFirm.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const DyeingFirm = sequelize.define('DyeingFirm', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Dyeing firm name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Dyeing firm name must be between 2 and 255 characters'
      }
    }
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'Contact person name cannot exceed 255 characters'
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 20],
        msg: 'Phone number cannot exceed 20 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'DyeingFirms',
  timestamps: true,
  indexes: [
    {
      fields: ['name'],
      unique: true
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
DyeingFirm.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

// Class methods
DyeingFirm.findByNameIgnoreCase = async function(name) {
  return await this.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      sequelize.fn('LOWER', name)
    )
  });
};

DyeingFirm.getActiveList = async function() {
  return await this.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
    attributes: ['id', 'name', 'contactPerson', 'phoneNumber']
  });
};

module.exports = DyeingFirm;
