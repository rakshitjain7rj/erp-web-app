const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const ASUProductionEntry = sequelize.define('ASUProductionEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  unit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isIn: [[1, 2]]
    }
  },
  machineNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'machine_no'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  shift: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['day', 'night']]
    }
  },
  yarnType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Cotton',
    field: 'yarn_type'
  },
  actualProduction: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'actual_production'
  },
  theoreticalProduction: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'theoretical_production'
  },
  efficiency: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  productionAt100: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'production_at_100',
    comment: 'Production@100% value from machine configuration at the time of entry creation'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'asu_production_entries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['unit', 'machine_no', 'date', 'shift'],
      name: 'unique_unit_machine_date_shift'
    },
    { fields: ['date'] },
    { fields: ['unit'] },
    { fields: ['machine_no'] },
    { fields: ['yarn_type'] }
  ]
});

ASUProductionEntry.associate = (models) => {
  // Add association with ASUMachine
  ASUProductionEntry.belongsTo(models.ASUMachine, {
    foreignKey: 'machineNumber',
    targetKey: 'machineNo',
    as: 'machine'
  });
};

module.exports = ASUProductionEntry;
