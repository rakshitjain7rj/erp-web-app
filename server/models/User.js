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
    // Password is excluded by default in queries
    select: false,
  },  role: {
    type: DataTypes.ENUM('admin', 'manager', 'storekeeper'),
    allowNull: false,
    defaultValue: 'storekeeper',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  loginHistory: {
    type: DataTypes.TEXT, // Change from JSONB to TEXT to avoid casting issues
    allowNull: true,
    defaultValue: '[]', // Store as JSON string
    get() {
      const rawValue = this.getDataValue('loginHistory');
      try {
        return JSON.parse(rawValue || '[]');
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('loginHistory', JSON.stringify(value || []));
    }
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
