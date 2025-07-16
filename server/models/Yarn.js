// server/models/Yarn.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Yarn = sequelize.define(
'Yarn',
{
lotNumber: {
type: DataTypes.STRING,
allowNull: false,
},
yarnType: {
type: DataTypes.STRING,
allowNull: false,
},
color: {
type: DataTypes.STRING,
},
status: {
type: DataTypes.STRING,
defaultValue: 'Available', // Available | Used | Reserved | Deleted
},
costPerKg: {
type: DataTypes.FLOAT,
allowNull: true,
},
totalQuantityKg: {
type: DataTypes.FLOAT,
allowNull: false,
},
usedQuantityKg: {
type: DataTypes.FLOAT,
defaultValue: 0,
},
remarks: {
type: DataTypes.TEXT,
},
},
{
timestamps: true, // adds createdAt and updatedAt
tableName: 'yarns',
}
);

module.exports = Yarn;