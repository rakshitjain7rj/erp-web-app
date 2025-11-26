const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const MachineConfiguration = sequelize.define('MachineConfiguration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'machine_id',
    references: {
      model: 'asu_machines',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  count: {
    type: DataTypes.DECIMAL(12, 5),
    allowNull: true,
    defaultValue: 0
  },
  spindleCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'spindle_count'
  },
  yarnType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Cotton',
    field: 'yarn_type'
  },
  speed: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  productionAt100: {
    type: DataTypes.DECIMAL(12, 5),
    allowNull: false,
    defaultValue: 0.00,
    field: 'production_at_100'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'machine_configurations',
  timestamps: true
});

module.exports = MachineConfiguration;
