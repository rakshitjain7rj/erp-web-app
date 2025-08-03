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

    // Start a transaction to ensure data integrity
    const result = await sequelize.transaction(async (t) => {
      // Find the machine to get productionAt100 if theoreticalProduction is not provided
      let finalTheoreticalProduction = theoreticalProduction;
      let machine = null;
      
      // Find the machine
      try {
        machine = await ASUMachine.findOne({
          where: { 
            machineNo: parseInt(machineNumber),
            unit: 1 
          },
          transaction: t
        });
        
        if (!machine) {
          throw new Error(`Machine number ${machineNumber} not found`);
        }
        
        if (machine.productionAt100) {
          finalTheoreticalProduction = machine.productionAt100;
        }
      } catch (error) {
        console.error('Error finding machine for theoretical production:', error);
        throw error;
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
        },
        transaction: t
      });

      if (existingEntry) {
        throw new Error(`Production entry for Machine ${machineNumber} on ${date} (${shift} shift) already exists. Please edit the existing entry instead.`);
      }

      // Create the production entry
      const entry = await ASUProductionEntry.create({
        unit: 1, // Always use unit 1
        machineNumber: parseInt(machineNumber),
        date,
        shift,
        actualProduction: actualProduction !== undefined && actualProduction !== null ? parseFloat(actualProduction) : 0,
        theoreticalProduction: finalTheoreticalProduction ? parseFloat(finalTheoreticalProduction) : null,
        efficiency,
        remarks: remarks || null
      }, { transaction: t });
      
      console.log('Production entry created:', {
        id: entry.id,
        machineNumber: entry.machineNumber,
        date: entry.date,
        shift: entry.shift,
        actualProduction: entry.actualProduction,
        type: typeof entry.actualProduction
      });
      
      // Only save machine configuration if there's actual production
      // This ensures we only save configurations that were actually used in production
      if (actualProduction > 0 && machine) {
        const MachineConfiguration = require('../models/MachineConfiguration');
        
        // Check if we need to save a new machine configuration
        // Get the most recent configuration for this machine
        const latestConfig = await MachineConfiguration.findOne({
          where: { 
            machineId: machine.id
          },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        
        // Function to normalize values for comparison (avoids issues like 343 vs 343.00)
        const normalizeNumber = (value) => {
          if (value === null || value === undefined) return 0;
          return parseFloat(parseFloat(value).toFixed(2));
        };
        
        // Check if the configuration has changed since last saved - use normalized values
        const shouldSaveNewConfig = !latestConfig || 
          normalizeNumber(latestConfig.spindleCount) !== normalizeNumber(machine.spindles) || 
          (latestConfig.yarnType || '').trim() !== (machine.yarnType || '').trim() || 
          normalizeNumber(latestConfig.productionAt100) !== normalizeNumber(machine.productionAt100);
        
        // If configuration changed, save a new one
        if (shouldSaveNewConfig) {
          console.log('Saving new machine configuration with production entry');
          
          // If there's an active config (with null endDate), close it
          if (latestConfig && latestConfig.endDate === null) {
            await latestConfig.update(
              { endDate: date }, // Use the production entry date as the end date
              { transaction: t }
            );
          }
          
          // Create a new machine configuration record
          await MachineConfiguration.create({
            machineId: machine.id,
            spindleCount: machine.spindles || 0,
            yarnType: machine.yarnType || 'Default',
            efficiencyAt100Percent: machine.productionAt100 || 0,
            startDate: date, // Use production entry date as start date
            endDate: null    // This is the new active configuration
          }, { transaction: t });
        }
      }
      
      return entry;
    });

    res.status(201).json({
      success: true,
      data: result
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

    // Start a transaction for updating
    const result = await sequelize.transaction(async (t) => {
      // Calculate new efficiency
      let efficiency = entry.efficiency;
      const newActual = actualProduction !== undefined ? parseFloat(actualProduction) : entry.actualProduction;
      let machine = null;
      
      // Try to get theoreticalProduction from the machine's productionAt100 if not provided
      let newTheoretical = theoreticalProduction !== undefined ? parseFloat(theoreticalProduction) : entry.theoreticalProduction;
      
      // If still no theoretical production, try to get it from the machine
      if (!newTheoretical) {
        try {
          machine = await ASUMachine.findOne({
            where: { 
              machineNo: entry.machineNumber,
              unit: 1 
            },
            transaction: t
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

      await entry.update(updateData, { transaction: t });
      
      // Only consider saving machine configuration if:
      // 1. We have found the machine
      // 2. The entry now has actual production (wasn't 0 before or isn't being set to 0)
      // 3. The actualProduction value has changed from 0 to a positive number
      if (machine && newActual > 0 && (entry.actualProduction === 0 || entry.actualProduction === null)) {
        const MachineConfiguration = require('../models/MachineConfiguration');
        
        // Check if we need to save a new machine configuration
        // Get the most recent configuration for this machine
        const latestConfig = await MachineConfiguration.findOne({
          where: { 
            machineId: machine.id
          },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        
        // Function to normalize values for comparison (avoids issues like 343 vs 343.00)
        const normalizeNumber = (value) => {
          if (value === null || value === undefined) return 0;
          return parseFloat(parseFloat(value).toFixed(2));
        };
        
        // Check if the configuration has changed since last saved - use normalized values
        const shouldSaveNewConfig = !latestConfig || 
          normalizeNumber(latestConfig.spindleCount) !== normalizeNumber(machine.spindles) || 
          (latestConfig.yarnType || '').trim() !== (machine.yarnType || '').trim() || 
          normalizeNumber(latestConfig.productionAt100) !== normalizeNumber(machine.productionAt100);
        
        // If configuration changed, save a new one
        if (shouldSaveNewConfig) {
          console.log('Saving new machine configuration with updated production entry');
          
          // If there's an active config (with null endDate), close it
          if (latestConfig && latestConfig.endDate === null) {
            await latestConfig.update(
              { endDate: entry.date }, // Use the production entry date as the end date
              { transaction: t }
            );
          }
          
          // Create a new machine configuration record
          await MachineConfiguration.create({
            machineId: machine.id,
            spindleCount: machine.spindles || 0,
            yarnType: machine.yarnType || 'Default',
            efficiencyAt100Percent: machine.productionAt100 || 0,
            startDate: entry.date, // Use production entry date as start date
            endDate: null    // This is the new active configuration
          }, { transaction: t });
        }
      }
      
      return entry;
    });

    res.json({
      success: true,
      data: result
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
      machine_name, // Added machine_name extraction
      count, 
      yarnType,
      spindles, 
      speed, 
      productionAt100
    } = req.body;
    
    // Ensure machineNo is properly parsed as a number
    const parsedMachineNo = typeof machineNo === 'string' ? parseInt(machineNo, 10) : Number(machineNo);
    console.log(`Creating machine - received machineNo: ${machineNo}, parsed as: ${parsedMachineNo}`);

    // Validate required fields
    if (!machineNo || !count) {
      return res.status(400).json({ 
        success: false, 
        error: 'Machine number and count are required' 
      });
    }

    // Log the machine creation request for debugging
    console.log('Creating machine with data:', { 
      machineNo, 
      machine_name, 
      count, 
      yarnType, 
      spindles, 
      speed, 
      productionAt100 
    });

    // Create machine with unit always set to 1
    const machine = await ASUMachine.create({
      machineNo: parsedMachineNo, // Use the explicitly parsed machine number
      machineName: machine_name || `Machine ${parsedMachineNo}`, // Save machine_name to machineName field
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

    // Log the received data for debugging
    console.log('Update machine request received:', {
      id,
      machineNo,
      machine_number,
      machine_name,
      isActive,
      status,
      count,
      yarnType,
      spindles,
      speed,
      productionAt100
    });
    
    // Prepare update data, handling both frontend and backend field names
    const updateData = {
      machineNo: machineNo !== undefined ? machineNo : 
                 machine_number !== undefined ? (isNaN(Number(machine_number)) ? machine.machineNo : Number(machine_number)) : 
                 machine.machineNo,
      count: count !== undefined ? count : machine.count,
      yarnType: yarnType || machine.yarnType,
      spindles: spindles !== undefined ? spindles : machine.spindles,
      speed: speed !== undefined ? speed : machine.speed,
      productionAt100: productionAt100 !== undefined ? productionAt100 : machine.productionAt100,
      isActive: isActive !== undefined ? Boolean(isActive) : 
                status !== undefined ? String(status).toLowerCase() === 'active' : 
                machine.isActive,
      // Always store machine_name in the database (we've confirmed the column exists)
      // No need to check if the model has the field since we've fixed the model
      machineName: machine_name || machine.machineName || `Machine ${machineNo || machine_number || machine.machineNo}`
    };
    
    // Log what we're updating to
    console.log('Updating machine with data:', updateData);
    
    await machine.update(updateData);
    
    // Log the updated machine for verification
    console.log('Machine updated successfully:', machine.toJSON());

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

// Delete an ASU Machine
const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Machine ID is required'
      });
    }

    // Find the machine first
    const machine = await ASUMachine.findByPk(id);
    
    if (!machine) {
      return res.status(404).json({
        success: false,
        error: `Machine with ID ${id} not found`
      });
    }

    // Check if this machine has production entries
    // ASUProductionEntry is already imported at the top of the file
    // Find the machine's machineNo first
    const machineNo = machine.machineNo;
    
    const relatedEntries = await ASUProductionEntry.count({
      where: { machineNumber: machineNo }
    });

    if (relatedEntries > 0 && force !== 'true') {
      return res.status(409).json({
        success: false,
        error: `Cannot delete machine with ID ${id} because it has ${relatedEntries} production entries associated with it`,
        hasRelatedEntries: true,
        entriesCount: relatedEntries
      });
    }

    // If force=true, delete related entries first
    if (force === 'true' && relatedEntries > 0) {
      await ASUProductionEntry.destroy({
        where: { machineNumber: machineNo }
      });
    }

    // Delete the machine
    await machine.destroy();
    
    return res.status(200).json({
      success: true,
      message: `Machine with ID ${id} has been deleted${force === 'true' ? ' along with all its production entries' : ''}`
    });
  } catch (error) {
    console.error('Error deleting ASU machine:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Archive a machine instead of deleting it
 * This keeps all related data intact but marks the machine as inactive
 */
const archiveMachine = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Machine ID is required'
      });
    }

    // Find the machine first
    const machine = await ASUMachine.findByPk(id);
    
    if (!machine) {
      return res.status(404).json({
        success: false,
        error: `Machine with ID ${id} not found`
      });
    }

    // Update the machine to mark it as archived/inactive
    await machine.update({
      isActive: false,
      archivedAt: new Date(),
      status: 'ARCHIVED'
    });
    
    return res.status(200).json({
      success: true,
      message: `Machine with ID ${id} has been archived`
    });
  } catch (error) {
    console.error('Error archiving ASU machine:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
  updateMachineYarnTypeAndCount,
  deleteMachine,
  archiveMachine
};
