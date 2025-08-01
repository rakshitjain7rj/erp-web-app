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
  machineName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'machine_name'
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
  },
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'archived_at'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ACTIVE',
    validate: {
      isIn: [['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ARCHIVED']]
    }
  }
}, {
  tableName: 'asu_machines',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ASUMachine.associate = (models) => {
  if (models.MachineConfiguration) {
    // One machine can have many configurations (historical tracking)
    ASUMachine.hasMany(models.MachineConfiguration, {
      foreignKey: 'machineId',
      as: 'configurations'
    });
  }
};

module.exports = ASUMachine;
