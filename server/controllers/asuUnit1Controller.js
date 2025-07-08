const { Op } = require('sequelize');
const ASUMachine = require('../models/ASUMachine');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const { sequelize } = require('../config/postgres');

// Get all ASU machines for Unit 1
const getASUMachines = async (req, res) => {
  try {
    const { unit = 1 } = req.query;
    
    const machines = await ASUMachine.findAll({
      where: {
        unit: unit,
        isActive: true
      },
      order: [['machineNo', 'ASC']]
    });

    res.json({
      success: true,
      data: machines
    });
  } catch (error) {
    console.error('Error fetching ASU machines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get production entries for specific criteria
const getProductionEntries = async (req, res) => {
  try {
    const { machineNumber, unit = 1, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { unit: parseInt(unit) };
    
    if (machineNumber) {
      where.machineNumber = parseInt(machineNumber);
    }
    
    if (dateFrom && dateTo) {
      where.date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      where.date = { [Op.lte]: dateTo };
    }

    const { count, rows } = await ASUProductionEntry.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['machineNumber', 'ASC'], ['shift', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        items: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching production entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new production entry
const createProductionEntry = async (req, res) => {
  try {
    const { 
      unit = 1, 
      machineNumber, 
      date, 
      shift, 
      actualProduction, 
      theoreticalProduction, 
      remarks 
    } = req.body;

    if (!machineNumber || !date || !shift) {
      return res.status(400).json({ 
        success: false, 
        error: 'Machine number, date, and shift are required' 
      });
    }

    // Validate shift
    if (!['day', 'night'].includes(shift)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Shift must be either "day" or "night"' 
      });
    }

    // Calculate efficiency
    let efficiency = null;
    if (actualProduction && theoreticalProduction && theoreticalProduction > 0) {
      efficiency = parseFloat(((actualProduction / theoreticalProduction) * 100).toFixed(2));
    }

    // Check if entry already exists for this combination
    const existingEntry = await ASUProductionEntry.findOne({
      where: { 
        unit: parseInt(unit),
        machineNumber: parseInt(machineNumber), 
        date, 
        shift 
      }
    });

    if (existingEntry) {
      return res.status(409).json({ 
        success: false, 
        error: 'Production entry already exists for this machine, date, and shift combination' 
      });
    }

    const entry = await ASUProductionEntry.create({
      unit: parseInt(unit),
      machineNumber: parseInt(machineNumber),
      date,
      shift,
      actualProduction: actualProduction ? parseFloat(actualProduction) : null,
      theoreticalProduction: theoreticalProduction ? parseFloat(theoreticalProduction) : null,
      efficiency,
      remarks: remarks || null
    });

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error creating production entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update production entry
const updateProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualProduction, theoreticalProduction, remarks } = req.body;

    const entry = await ASUProductionEntry.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Production entry not found' });
    }

    // Calculate new efficiency
    let efficiency = entry.efficiency;
    const newActual = actualProduction !== undefined ? parseFloat(actualProduction) : entry.actualProduction;
    const newTheoretical = theoreticalProduction !== undefined ? parseFloat(theoreticalProduction) : entry.theoreticalProduction;
    
    if (newActual && newTheoretical && newTheoretical > 0) {
      efficiency = parseFloat(((newActual / newTheoretical) * 100).toFixed(2));
    }

    const updateData = {};
    if (actualProduction !== undefined) updateData.actualProduction = newActual;
    if (theoreticalProduction !== undefined) updateData.theoreticalProduction = newTheoretical;
    if (remarks !== undefined) updateData.remarks = remarks;
    updateData.efficiency = efficiency;

    await entry.update(updateData);

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error updating production entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete production entry
const deleteProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ASUProductionEntry.destroy({
      where: { id }
    });

    if (deleted === 0) {
      return res.status(404).json({ success: false, error: 'Production entry not found' });
    }

    res.json({
      success: true,
      message: 'Production entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get production statistics
const getProductionStats = async (req, res) => {
  try {
    const { unit = 1, machineNumber, dateFrom, dateTo } = req.query;
    const { QueryTypes } = require('sequelize');

    // Check if tables exist before querying
    const tableCheck = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('asu_machines', 'asu_production_entries')
    `, { type: QueryTypes.SELECT });

    if (tableCheck.length < 2) {
      return res.status(500).json({
        success: false,
        error: 'Database tables not found. Please run the ASU Unit 1 migration script first.',
        missingTables: ['asu_machines', 'asu_production_entries'].filter(
          table => !tableCheck.find(t => t.table_name === table)
        )
      });
    }

    // Check if unit column exists
    const columnCheck = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      AND column_name = 'unit'
    `, { type: QueryTypes.SELECT });

    const unitColumnExists = columnCheck.length > 0;
    
    // If unit column doesn't exist, add it
    if (!unitColumnExists) {
      console.log('Adding unit column to asu_production_entries table');
      await sequelize.query(`
        ALTER TABLE asu_production_entries 
        ADD COLUMN unit INTEGER NOT NULL DEFAULT 1 
        CHECK (unit IN (1, 2))
      `);
      console.log('Added unit column to the table');
    }
    
    // Build SQL conditions
    let conditions = '';
    if (machineNumber) {
      conditions += ` AND machine_number = ${parseInt(machineNumber)}`;
    }
    
    // Date conditions
    let defaultDate = '';
    if (dateFrom && dateTo) {
      conditions += ` AND date BETWEEN '${dateFrom}' AND '${dateTo}'`;
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      defaultDate = thirtyDaysAgo.toISOString().split('T')[0];
      conditions += ` AND date >= '${defaultDate}'`;
    }
    
    // Unit condition (now we know it exists)
    conditions += ` AND unit = ${parseInt(unit)}`;
    
    // Get total and active machines count for the unit using raw SQL
    const [machinesResult] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_machines,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_machines
      FROM asu_machines
      WHERE unit = ${parseInt(unit)}
    `, { type: QueryTypes.SELECT });
    
    const totalMachines = parseInt(machinesResult.total_machines || 0);
    const activeMachines = parseInt(machinesResult.active_machines || 0);

    // Get today's entries count for the unit using raw SQL
    const today = new Date().toISOString().split('T')[0];
    const [todayResult] = await sequelize.query(`
      SELECT COUNT(*) as today_entries 
      FROM asu_production_entries
      WHERE date = '${today}' AND unit = ${parseInt(unit)}
    `, { type: QueryTypes.SELECT });
    
    const todayEntries = parseInt(todayResult.today_entries || 0);

    // Get aggregated statistics with null checks using raw SQL
    const [stats] = await sequelize.query(`
      SELECT 
        AVG(efficiency) as avg_efficiency,
        SUM(actual_production) as total_actual_production,
        SUM(theoretical_production) as total_theoretical_production,
        COUNT(*) as total_entries
      FROM asu_production_entries
      WHERE unit = ${parseInt(unit)} ${conditions}
    `, { type: QueryTypes.SELECT });

    // Get top performing machine by average efficiency
    const [topMachine] = await sequelize.query(`
      SELECT 
        machine_number,
        AVG(efficiency) as avg_efficiency,
        COUNT(*) as entry_count
      FROM asu_production_entries 
      WHERE unit = ${parseInt(unit)} AND efficiency IS NOT NULL ${conditions}
      GROUP BY machine_number 
      HAVING COUNT(*) > 0
      ORDER BY AVG(efficiency) DESC 
      LIMIT 1
    `, { type: QueryTypes.SELECT });

    // Calculate overall efficiency from totals
    const totalActual = parseFloat(stats?.total_actual_production || 0);
    const totalTheoretical = parseFloat(stats?.total_theoretical_production || 0);
    const overallEfficiency = totalTheoretical > 0 ? (totalActual / totalTheoretical) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalMachines,
        activeMachines,
        todayEntries,
        averageEfficiency: parseFloat(stats?.avg_efficiency || 0),
        overallEfficiency: parseFloat(overallEfficiency.toFixed(2)),
        totalActualProduction: totalActual,
        totalTheoreticalProduction: totalTheoretical,
        totalEntries: parseInt(stats?.total_entries || 0),
        topPerformingMachine: topMachine ? {
          machineNumber: parseInt(topMachine.machine_number),
          avgEfficiency: parseFloat(topMachine.avg_efficiency || 0),
          entryCount: parseInt(topMachine.entry_count || 0)
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching production stats:', error);
    
    // Provide helpful error message for missing tables
    if (error.message && error.message.includes('does not exist')) {
      return res.status(500).json({
        success: false,
        error: 'Database tables not found. Please run the ASU Unit 1 migration script first.',
        details: error.message
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getASUMachines,
  getProductionEntries,
  createProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
  getProductionStats
};
