const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');

class Machine extends Model {
  static associate(models) {
    // Machine associations can be added here if needed
  }
}

Machine.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machineId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  type: {
    type: DataTypes.ENUM('dyeing', 'spinning', 'weaving', 'finishing', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  capacity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  },
  specifications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Machine',
  tableName: 'machines',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['machineId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Machine;
