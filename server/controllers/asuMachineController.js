const ASUMachine = require('../models/ASUMachine');

/**
 * Get all active ASU machines
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} JSON response with machines or error message
 */
const getAllMachines = async (req, res) => {
  try {
    const machines = await ASUMachine.findAll({
      where: {
        isActive: true
      },
      order: [['machineNo', 'ASC']] // Sort by machine number
    });

    res.json({
      success: true,
      data: machines
    });
  } catch (error) {
    console.error('Error fetching ASU machines:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch ASU machines: ${error.message}` 
    });
  }
};

module.exports = {
  getAllMachines
};
