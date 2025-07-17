const { Op } = require('sequelize');
const ASUMachine = require('../models/ASUMachine');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const { sequelize } = require('../config/postgres');

// Get all ASU machines (always Unit 1)
const getASUMachines = async (req, res) => {
  try {
    // Always use unit 1, removed query param
    const machines = await ASUMachine.findAll({
      where: {
        unit: 1,
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

// Get all ASU machines with complete details (for dedicated API endpoint)
const getAllMachines = async (req, res) => {
  try {
    // Find all machines with unit 1 (both active and inactive)
    const machines = await ASUMachine.findAll({
      where: {
        unit: 1
      },
      order: [['machineNo', 'ASC']]
    });

    res.json({
      success: true,
      data: machines
    });
  } catch (error) {
    console.error('Error fetching all ASU machines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get production entries for specific criteria
const getProductionEntries = async (req, res) => {
  try {
    // Removed unit parameter - always use unit 1
    const { machineNumber, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { unit: 1 };
    
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
      order: [['date', 'DESC'], ['machineNumber', 'ASC'], ['shift', 'ASC']],
      include: [{
        model: ASUMachine,
        as: 'machine',
        attributes: ['id', 'machineNo', 'productionAt100', 'isActive', 'spindles', 'speed', 'count', 'yarnType']
      }]
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
      // Removed unit param - always use unit 1
      machineNumber, 
      date, 
      shift, 
      actualProduction, 
      theoreticalProduction, 
      remarks 
    } = req.body;

    console.log('Creating production entry with data:', req.body);
    console.log('actualProduction value:', actualProduction, 'type:', typeof actualProduction);

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

    // Find the machine to get productionAt100 if theoreticalProduction is not provided
    let finalTheoreticalProduction = theoreticalProduction;
    
    if (!finalTheoreticalProduction) {
      try {
        const machine = await ASUMachine.findOne({
          where: { 
            machineNo: parseInt(machineNumber),
            unit: 1 
          }
        });
        
        if (machine && machine.productionAt100) {
          finalTheoreticalProduction = machine.productionAt100;
        }
      } catch (error) {
        console.error('Error finding machine for theoretical production:', error);
      }
    }
    
    // Calculate efficiency
    let efficiency = null;
    if (actualProduction && finalTheoreticalProduction && finalTheoreticalProduction > 0) {
      efficiency = parseFloat(((actualProduction / finalTheoreticalProduction) * 100).toFixed(2));
    }

    // Check if entry already exists for this combination
    const existingEntry = await ASUProductionEntry.findOne({
      where: { 
        unit: 1,
        machineNumber: parseInt(machineNumber), 
        date, 
        shift 
      }
    });

    if (existingEntry) {
      return res.status(409).json({ 
        success: false, 
        error: `Production entry for Machine ${machineNumber} on ${date} (${shift} shift) already exists. Please edit the existing entry instead.` 
      });
    }

    const entry = await ASUProductionEntry.create({
      unit: 1, // Always use unit 1
      machineNumber: parseInt(machineNumber),
      date,
      shift,
      actualProduction: actualProduction !== undefined && actualProduction !== null ? parseFloat(actualProduction) : null,
      theoreticalProduction: finalTheoreticalProduction ? parseFloat(finalTheoreticalProduction) : null,
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
    
    // Try to get theoreticalProduction from the machine's productionAt100 if not provided
    let newTheoretical = theoreticalProduction !== undefined ? parseFloat(theoreticalProduction) : entry.theoreticalProduction;
    
    // If still no theoretical production, try to get it from the machine
    if (!newTheoretical) {
      try {
        const machine = await ASUMachine.findOne({
          where: { 
            machineNo: entry.machineNumber,
            unit: 1 
          }
        });
        
        if (machine && machine.productionAt100) {
          newTheoretical = machine.productionAt100;
        }
      } catch (error) {
        console.error('Error finding machine for theoretical production on update:', error);
      }
    }
    
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
    console.log('Attempting to delete production entry with ID:', id);

    // Log the entry we're trying to delete
    const entryToDelete = await ASUProductionEntry.findByPk(id);
    console.log('Entry to delete:', entryToDelete);

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
    // Removed unit parameter - always use unit 1
    const { machineNumber, dateFrom, dateTo } = req.query;
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
      conditions += ` AND machine_no = ${parseInt(machineNumber)}`;
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
    
    // Hardcoded to unit 1 only
    conditions += ` AND unit = 1`;
    
    // Get total and active machines count for unit 1 using raw SQL
    const [machinesResult] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_machines,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_machines
      FROM asu_machines
      WHERE unit = 1
    `, { type: QueryTypes.SELECT });
    
    const totalMachines = parseInt(machinesResult.total_machines || 0);
    const activeMachines = parseInt(machinesResult.active_machines || 0);

    // Get today's entries count for unit 1 using raw SQL
    const today = new Date().toISOString().split('T')[0];
    const [todayResult] = await sequelize.query(`
      SELECT COUNT(*) as today_entries 
      FROM asu_production_entries
      WHERE date = '${today}' AND unit = 1
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
      WHERE unit = 1 ${conditions}
    `, { type: QueryTypes.SELECT });

    // Get top performing machine by average efficiency
    const [topMachine] = await sequelize.query(`
      SELECT 
        machine_no,
        AVG(efficiency) as avg_efficiency,
        COUNT(*) as entry_count
      FROM asu_production_entries 
      WHERE unit = 1 AND efficiency IS NOT NULL ${conditions}
      GROUP BY machine_no 
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
          machineNumber: parseInt(topMachine.machine_no),
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

// Create a new ASU Machine
const createMachine = async (req, res) => {
  try {
    const { 
      machineNo, 
      count, 
      yarnType,
      spindles, 
      speed, 
      productionAt100
    } = req.body;

    // Validate required fields
    if (!machineNo || !count) {
      return res.status(400).json({ 
        success: false, 
        error: 'Machine number and count are required' 
      });
    }

    // Create machine with unit always set to 1
    const machine = await ASUMachine.create({
      machineNo,
      count,
      yarnType: yarnType || 'Cotton',
      spindles,
      speed,
      productionAt100,
      unit: 1,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error('Error creating ASU machine:', error);
    
    // Check for unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: `Machine with number ${req.body.machineNo} already exists`
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update an ASU Machine
const updateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract fields with support for both frontend and backend naming conventions
    const { 
      machineNo, 
      machine_number, // Frontend might send machine_number instead of machineNo
      machine_name, // Additional frontend field
      count, 
      yarnType,
      spindles, 
      speed, 
      productionAt100,
      isActive,
      status // Frontend might send status instead of isActive
    } = req.body;

    const machine = await ASUMachine.findByPk(id);
    
    if (!machine) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine not found' 
      });
    }

    // Prepare update data, handling both frontend and backend field names
    const updateData = {
      machineNo: machineNo !== undefined ? machineNo : 
                 machine_number !== undefined ? Number(machine_number) : 
                 machine.machineNo,
      count: count !== undefined ? count : machine.count,
      yarnType: yarnType || machine.yarnType,
      spindles: spindles !== undefined ? spindles : machine.spindles,
      speed: speed !== undefined ? speed : machine.speed,
      productionAt100: productionAt100 !== undefined ? productionAt100 : machine.productionAt100,
      isActive: isActive !== undefined ? isActive : 
                status !== undefined ? status === 'active' : 
                machine.isActive
    };
    
    // We don't store machine_name in the database, as it's a frontend display convention
    
    await machine.update(updateData);

    res.json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error('Error updating ASU machine:', error);
    
    // Check for unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: `Machine with number ${req.body.machineNo} already exists`
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update machine yarn type and count (dedicated API endpoint)
const updateMachineYarnTypeAndCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { yarnType, count, productionAt100 } = req.body;

    // Validate input
    if (!yarnType && count === undefined && productionAt100 === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one of yarnType, count, or productionAt100 must be provided' 
      });
    }

    // Find the machine
    const machine = await ASUMachine.findOne({
      where: {
        id,
        unit: 1
      }
    });
    
    if (!machine) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine not found' 
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (yarnType !== undefined) {
      // Validate yarnType is a non-empty string
      if (typeof yarnType !== 'string' || !yarnType.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'yarnType must be a non-empty string' 
        });
      }
      updateData.yarnType = yarnType;
    }
    
    if (count !== undefined) {
      // Validate count is a number
      if (isNaN(parseInt(count))) {
        return res.status(400).json({ 
          success: false, 
          error: 'count must be a number' 
        });
      }
      updateData.count = parseInt(count);
    }
    
    if (productionAt100 !== undefined) {
      // Validate productionAt100 is a number
      if (isNaN(parseFloat(productionAt100))) {
        return res.status(400).json({ 
          success: false, 
          error: 'productionAt100 must be a number' 
        });
      }
      updateData.productionAt100 = parseFloat(productionAt100);
    }

    // Update the machine
    await machine.update(updateData);

    res.json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error('Error updating ASU machine yarn type and count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getASUMachines,
  getAllMachines,
  getProductionEntries,
  createProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
  getProductionStats,
  createMachine,
  updateMachine,
  updateMachineYarnTypeAndCount
};
