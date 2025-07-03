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
      if (value) {
        this.setDataValue('address', value.trim());
      }
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
      if (value) {
        this.setDataValue('contact', value.trim());
      }
    },
  },
  dyeingFirm: {
    type: DataTypes.STRING,
    allowNull: true,
    set(value) {
      if (value) {
        this.setDataValue('dyeingFirm', value.trim());
      }
    },
  },
}, {
  tableName: 'Parties',
  timestamps: true,
});

module.exports = Party;
