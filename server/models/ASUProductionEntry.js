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
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'actual_production'
  },
  theoreticalProduction: {
    type: DataTypes.DECIMAL(15, 5),
    allowNull: true,
    field: 'theoretical_production'
  },
  efficiency: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  productionAt100: {
    type: DataTypes.DECIMAL(15, 5),
    allowNull: true,
    field: 'production_at_100',
    comment: 'Production@100% value from machine configuration at the time of entry creation'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  workerName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'worker_name'
  },
  mainsReading: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'mains_reading'
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
  // Keep association for include()s but avoid DB-level single-column FK constraints
  // because machine_no is only unique per (unit, machine_no).
  ASUProductionEntry.belongsTo(models.ASUMachine, {
    foreignKey: 'machineNumber',
    targetKey: 'machineNo',
    as: 'machine',
    constraints: false
  });
};

module.exports = ASUProductionEntry;
