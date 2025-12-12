const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Party = sequelize.define('Party', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Party name must be unique',
    },
    validate: {
      notEmpty: {
        msg: 'Party name is required',
      },
    },
    set(value) {
      this.setDataValue('name', value.trim());
    },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    set(value) {
      this.setDataValue('address', value ? value.trim() : null);
    },
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[\d+\-()\s]+$/i,
        msg: 'Contact must be a valid phone number',
      },
    },
    set(value) {
      this.setDataValue('contact', value ? value.trim() : null);
    },
  },
  dyeingFirm: {
    type: DataTypes.STRING,
    allowNull: true,
    set(value) {
      this.setDataValue('dyeingFirm', value ? value.trim() : null);
    },
  },
  // Editable metrics (optional overrides)
  totalOrders: {
    type: DataTypes.INTEGER,
  allowNull: true,
  },
  totalYarn: {
    type: DataTypes.DECIMAL(12, 2),
  allowNull: true,
  },
  pendingYarn: {
    type: DataTypes.DECIMAL(12, 2),
  allowNull: true,
  },
  reprocessingYarn: {
    type: DataTypes.DECIMAL(12, 2),
  allowNull: true,
  },
  arrivedYarn: {
    type: DataTypes.DECIMAL(12, 2),
  allowNull: true,
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Parties',
  timestamps: true,
});

module.exports = Party;
