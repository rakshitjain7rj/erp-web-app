const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const ASUProductionEntry = sequelize.define('ASUProductionEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // unit field is referenced in a raw SQL query but might not exist in DB yet
  unit: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed to allow null for compatibility 
    validate: {
      isIn: [[1, 2]]
    }
  },
  machineNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'machine_number'
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
      fields: ['unit', 'machine_number', 'date', 'shift'],
      name: 'unique_unit_machine_date_shift'
    },
    {
      fields: ['date']
    },
    {
      fields: ['unit']
    },
    {
      fields: ['machine_number']
    }
  ]
});

// Define associations
ASUProductionEntry.associate = (models) => {
  // No direct foreign key relationship since we use machine_number instead of machine_id
  // We'll handle the relationship through queries when needed
};

module.exports = ASUProductionEntry;
