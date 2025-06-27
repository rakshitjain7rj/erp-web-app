const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    // Password is excluded by default via defaultScope
  },  role: {
    type: DataTypes.ENUM('admin', 'manager', 'storekeeper'),
    allowNull: false,
    defaultValue: 'storekeeper',
  },
  // status: {
  //   type: DataTypes.ENUM('active', 'inactive'),
  //   allowNull: false,
  //   defaultValue: 'active',
  // },
  loginHistory: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [], // Example: [{ timestamp: '...', ip: '...' }]
  }
}, {
  tableName: 'Users',
  timestamps: true, // Adds createdAt and updatedAt
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

module.exports = User;
