const ASUMachine = require('./ASUMachine');
const MachineConfiguration = require('./MachineConfiguration');

// Define associations
MachineConfiguration.belongsTo(ASUMachine, {
  foreignKey: 'machineId',
  as: 'machine',
  onDelete: 'CASCADE'
});

ASUMachine.hasMany(MachineConfiguration, {
  foreignKey: 'machineId',
  as: 'configurations'
});

module.exports = {
  ASUMachine,
  MachineConfiguration
};
