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
    // Removed Unit 2 option from validation
    validate: {
      isIn: [[1]]
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
    { fields: ['machine_no'] }
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
