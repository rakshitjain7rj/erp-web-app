const { Op } = require('sequelize');
// Utility to filter by unit
const getMachineRange = (unit) => {
  if (unit === '1') return { [Op.between]: [1, 9] };
  if (unit === '2') return { [Op.between]: [10, 21] };
  return undefined;
};

const {
  ASUDailyMachineData,
  ASUProductionEfficiency,
  ASUMainsReading,
  ASUWeeklyData
} = require('../models/ASUModels');



// Submit daily data (all forms combined)
const submitDailyData = async (req, res) => {
  try {
    const { dailyMachineData, productionEfficiency, mainsReading, weeklyData } = req.body;

    // Create records in parallel
    const results = await Promise.all([
      ASUDailyMachineData.create(dailyMachineData),
      ASUProductionEfficiency.create(productionEfficiency),
      ASUMainsReading.upsert(mainsReading), // Upsert for mains reading (one per day)
      ASUWeeklyData.upsert(weeklyData) // Upsert for weekly data
    ]);

    res.status(201).json({
      success: true,
      data: {
        dailyMachine: results[0],
        production: results[1],
        mainsReading: results[2][0], // upsert returns [instance, created]
        weekly: results[3][0]
      }
    });
  } catch (error) {
    console.error('Error submitting daily data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get daily machine data with pagination and filters
const getDailyMachineData = async (req, res) => {
  try {
    const { page = 1, limit = 20, machine, karigarName, dateFrom, dateTo, unit } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (machine) where.machine = machine;
    else if (unit) where.machine = getMachineRange(unit);
    if (karigarName) where.karigarName = { [Op.iLike]: `%${karigarName}%` };
    if (dateFrom && dateTo) {
      where.date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      where.date = { [Op.lte]: dateTo };
    }

    const { count, rows } = await ASUDailyMachineData.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['machine', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching daily machine data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get production efficiency data
const getProductionEfficiency = async (req, res) => {
  try {
    const { page = 1, limit = 20, machine, dateFrom, dateTo, unit } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (machine) where.machine = machine;
    else if (unit) where.machine = getMachineRange(unit);

    if (dateFrom && dateTo) {
      where.date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      where.date = { [Op.lte]: dateTo };
    }

    const { count, rows } = await ASUProductionEfficiency.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['machine', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching production efficiency data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get mains readings
const getMainsReadings = async (req, res) => {
  try {
    const { page = 1, limit = 20, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (dateFrom && dateTo) {
      where.date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      where.date = { [Op.lte]: dateTo };
    }

    const { count, rows } = await ASUMainsReading.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mains readings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get weekly data
const getWeeklyData = async (req, res) => {
  try {
    const { page = 1, limit = 20, machine, weekStartDate, unit } = req.query;

    const offset = (page - 1) * limit;

    const where = {};
    if (machine) where.machine = machine;
    else if (unit) where.machine = getMachineRange(unit);
    if (weekStartDate) where.weekStartDate = weekStartDate;

    const { count, rows } = await ASUWeeklyData.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['weekStartDate', 'DESC'], ['machine', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get summary stats
const getStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { unit } = req.query;
    const machineFilter = unit ? { machine: getMachineRange(unit) } : {};

    
    // Set default date range to last 7 days if not provided
    const endDate = dateTo || new Date().toISOString().split('T')[0];
    const startDate = dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dateFilter = {
      date: { [Op.between]: [startDate, endDate] }
    };

    // Get production stats
    const productionStats = await ASUProductionEfficiency.findAll({
      where: {...dateFilter, ...machineFilter},
      attributes: [
        'machine',
        [require('sequelize').fn('SUM', require('sequelize').col('kgs_produced')), 'totalProduction'],
        [require('sequelize').fn('AVG', require('sequelize').literal('kgs_produced / NULLIF(machine_hours_working, 0)')), 'avgEfficiency']
      ],
      group: ['machine'],
      raw: true
    });

    // Get power consumption
    const powerStats = await ASUMainsReading.findAll({
      where: dateFilter,
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').literal('reading_8pm - reading_8am')), 'totalConsumption']
      ],
      raw: true
    });

    // Calculate summary
    const totalProduction = productionStats.reduce((sum, stat) => sum + parseFloat(stat.totalProduction || 0), 0);
    const avgEfficiency = productionStats.length > 0 
      ? productionStats.reduce((sum, stat) => sum + parseFloat(stat.avgEfficiency || 0), 0) / productionStats.length
      : 0;
    const totalPowerConsumption = parseFloat(powerStats[0]?.totalConsumption || 0);

    // Get active machines (machines with data in the date range)
    const activeMachines = new Set(productionStats.map(stat => stat.machine)).size;
    const totalMachines = unit === '1' ? 9 : unit === '2' ? 12 : 21;

    // Calculate previous week comparison (simplified)
    const prevWeekStart = new Date(new Date(startDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevWeekEnd = new Date(new Date(endDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const prevProductionStats = await ASUProductionEfficiency.findAll({
      where: {
        date: { [Op.between]: [prevWeekStart, prevWeekEnd] }
      },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('kgs_produced')), 'totalProduction'],
        [require('sequelize').fn('AVG', require('sequelize').literal('kgs_produced / NULLIF(machine_hours_working, 0)')), 'avgEfficiency']
      ],
      raw: true
    });

    const prevPowerStats = await ASUMainsReading.findAll({
      where: {
        date: { [Op.between]: [prevWeekStart, prevWeekEnd] }
      },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').literal('reading_8pm - reading_8am')), 'totalConsumption']
      ],
      raw: true
    });

    const prevTotalProduction = parseFloat(prevProductionStats[0]?.totalProduction || 0);
    const prevAvgEfficiency = parseFloat(prevProductionStats[0]?.avgEfficiency || 0);
    const prevTotalPowerConsumption = parseFloat(prevPowerStats[0]?.totalConsumption || 0);

    const productionChange = prevTotalProduction > 0 
      ? ((totalProduction - prevTotalProduction) / prevTotalProduction) * 100 
      : 0;
    const efficiencyChange = prevAvgEfficiency > 0 
      ? ((avgEfficiency - prevAvgEfficiency) / prevAvgEfficiency) * 100 
      : 0;
    const powerChange = prevTotalPowerConsumption > 0 
      ? ((totalPowerConsumption - prevTotalPowerConsumption) / prevTotalPowerConsumption) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        totalMachines,
        activeMachines,
        totalProduction,
        averageEfficiency: avgEfficiency,
        totalPowerConsumption,
        lastWeekComparison: {
          production: {
            current: totalProduction,
            previous: prevTotalProduction,
            change: productionChange
          },
          efficiency: {
            current: avgEfficiency,
            previous: prevAvgEfficiency,
            change: efficiencyChange
          },
          power: {
            current: totalPowerConsumption,
            previous: prevTotalPowerConsumption,
            change: powerChange
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update daily machine data
const updateDailyMachineData = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await ASUDailyMachineData.update(req.body, {
      where: { id },
      returning: true
    });

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Daily machine data not found'
      });
    }

    const updatedRecord = await ASUDailyMachineData.findByPk(id);
    res.json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating daily machine data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete daily machine data
const deleteDailyMachineData = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ASUDailyMachineData.destroy({
      where: { id }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Daily machine data not found'
      });
    }

    res.json({
      success: true,
      message: 'Daily machine data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting daily machine data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  submitDailyData,
  getDailyMachineData,
  getProductionEfficiency,
  getMainsReadings,
  getWeeklyData,
  getStats,
  updateDailyMachineData,
  deleteDailyMachineData
};
