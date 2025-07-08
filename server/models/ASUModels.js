const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

// Import new ASU Unit 1 models
const ASUMachine = require('./ASUMachine');
const ASUProductionEntry = require('./ASUProductionEntry');

const ASUDailyMachineData = sequelize.define('ASUDailyMachineData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 21 }
  },
  karigarName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'karigar_name'
  },
  reading8AM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reading_8am'
  },
  reading8PM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reading_8pm'
  },
  machineHoursWorked: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 24 },
    field: 'machine_hours_worked'
  },
  extraHours: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true,
    defaultValue: 0,
    validate: { min: 0, max: 24 },
    field: 'extra_hours'
  },
  yarn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  unit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: { min: 1, max: 2 }
  }
}, {
  tableName: 'asu_daily_machine_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['machine', 'date'] },
    { fields: ['karigarName'] }, // ✅ fixed index key
    { fields: ['date'] },
    { fields: ['unit'] },
    { fields: ['unit', 'date'] } // ✅ recommended for filtering
  ]
});

const ASUProductionEfficiency = sequelize.define('ASUProductionEfficiency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 21 }
  },
  kgsProduced: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'kgs_produced'
  },
  machineHoursWorking: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 24 },
    field: 'machine_hours_working'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  unit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: { min: 1, max: 2 }
  }
}, {
  tableName: 'asu_production_efficiency',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['machine', 'date'] },
    { fields: ['date'] },
    { fields: ['unit'] },
    { fields: ['unit', 'date'] } // ✅ added for consistency
  ]
});

const ASUMainsReading = sequelize.define('ASUMainsReading', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reading8AM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reading_8am'
  },
  reading8PM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reading_8pm'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  unit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: { min: 1, max: 2 }
  }
}, {
  tableName: 'asu_mains_readings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['date'] },
    { fields: ['unit'] },
    { fields: ['unit', 'date'] } // ✅ optional perf boost
  ]
});

const ASUWeeklyData = sequelize.define('ASUWeeklyData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 21 }
  },
  numberOfThreads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'number_of_threads'
  },
  tenMinWeight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'ten_min_weight'
  },
  ideal12Hr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'ideal_12hr'
  },
  ideal85Percent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'ideal_85_percent'
  },
  speed: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0
  },
  weekStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'week_start_date'
  },
  unit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: { min: 1, max: 2 }
  }
}, {
  tableName: 'asu_weekly_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['machine', 'weekStartDate'] },
    { fields: ['weekStartDate'] },
    { fields: ['unit'] }
  ]
});

// Setup associations
// Note: ASUProductionEntry uses machine_number field instead of foreign key relationship
// Associations will be handled through queries when needed

module.exports = {
  ASUDailyMachineData,
  ASUProductionEfficiency,
  ASUMainsReading,
  ASUWeeklyData,
  ASUMachine,
  ASUProductionEntry
};
