const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const ASUMachine = sequelize.define('ASUMachine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machineNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'machine_no'
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  yarnType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Cotton',
    field: 'yarn_type'
  },
  spindles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  speed: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  productionAt100: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'production_at_100'
  },
  unit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    // Removed Unit 2 option from validation
    validate: {
      isIn: [[1]]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'asu_machines',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ASUMachine.associate = (models) => {
  // No direct foreign key associations currently
};

module.exports = ASUMachine;
