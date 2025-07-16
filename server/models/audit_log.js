const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/postgres");

const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER, // optional: associate with user table if needed
    allowNull: true,
  },

  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  yarnType: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  action: {
    type: DataTypes.ENUM("create", "update", "delete"),
    allowNull: false,
  },

  field: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  oldValue: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  newValue: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "audit_logs",
  timestamps: false,
});

module.exports = AuditLog;
