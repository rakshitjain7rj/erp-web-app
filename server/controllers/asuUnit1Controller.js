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
        attributes: ['id', 'machineNo', 'productionAt100', 'isActive', 'spindles', 'speed', 'count', 'yarnType'],
        where: { unit: 1 },
        required: false
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

// Get single production entry
const getProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ASUProductionEntry.findByPk(id, {
      include: [{
        model: ASUMachine,
        as: 'machine',
        attributes: ['id', 'machineNo', 'productionAt100', 'isActive', 'spindles', 'speed', 'count', 'yarnType'],
        where: { unit: 1 },
        required: false
      }]
    });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Production entry not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching production entry:', error);
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
      remarks,
      yarnType // Added yarnType parameter
    } = req.body;

    console.log('Creating production entry with data:', req.body);
    console.log('actualProduction value:', actualProduction, 'type:', typeof actualProduction);
    console.log('yarnType value:', yarnType);

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
      let machineYarnType = null;

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

        machineYarnType = machine.yarnType || 'Cotton';
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
        const error = new Error(`Production entry for Machine ${machineNumber} on ${date} (${shift} shift) already exists. Please edit the existing entry instead.`);
        error.statusCode = 409;
        throw error;
      }

      // Create the production entry
      const entry = await ASUProductionEntry.create({
        unit: 1, // Always use unit 1
        machineNumber: parseInt(machineNumber),
        date,
        shift,
        // Use provided yarnType or fall back to machine's yarnType
        yarnType: yarnType || machineYarnType || 'Cotton',
        actualProduction: actualProduction !== undefined && actualProduction !== null ? parseFloat(actualProduction) : 0,
        theoreticalProduction: finalTheoreticalProduction ? parseFloat(finalTheoreticalProduction) : null,
        // Store the production@100% value at the time of entry creation for historical accuracy
        productionAt100: finalTheoreticalProduction ? parseFloat(finalTheoreticalProduction) : null,
        efficiency,
        remarks: remarks || null
      }, { transaction: t });

      console.log('Production entry created:', {
        id: entry.id,
        machineNumber: entry.machineNumber,
        date: entry.date,
        shift: entry.shift,
        yarnType: entry.yarnType,
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

        // Function to normalize values for comparison (avoids issues like 343 vs 343.00000)
        const normalizeNumber = (value) => {
          if (value === null || value === undefined) return 0;
          return parseFloat(parseFloat(value).toFixed(5));
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
            productionAt100: machine.productionAt100 || 0,
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
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// Update production entry
const updateProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualProduction, theoreticalProduction, remarks, yarnType, date } = req.body;

    const entry = await ASUProductionEntry.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Production entry not found' });
    }

    // Start a transaction for updating
    const result = await sequelize.transaction(async (t) => {
      // Calculate new efficiency using the ORIGINAL production@100% value stored with the entry
      let efficiency = entry.efficiency;
      const newActual = actualProduction !== undefined ? parseFloat(actualProduction) : entry.actualProduction;

      // IMPORTANT: Use the entry's stored productionAt100 value for efficiency calculation
      // This ensures efficiency calculations remain accurate regardless of machine configuration changes
      let theoreticalForCalculation = entry.productionAt100 || entry.theoreticalProduction;

      // Declare machine variable at the transaction scope level so it's available throughout
      let machine = null;
      
      // Try to find the machine for this entry
      try {
        machine = await ASUMachine.findOne({
          where: {
            machineNo: entry.machineNumber,
            unit: 1
          },
          transaction: t
        });
      } catch (error) {
        console.error('Error finding machine:', error);
      }

      // If we still don't have a theoretical value, fall back to machine's current value
      // but this should only happen for old entries created before this fix
      if (!theoreticalForCalculation) {
        try {
          if (machine && machine.productionAt100) {
            theoreticalForCalculation = machine.productionAt100;
            // Also update the entry's productionAt100 field for future consistency
            await entry.update({ productionAt100: theoreticalForCalculation }, { transaction: t });
          }
        } catch (error) {
          console.error('Error finding machine for theoretical production on update:', error);
        }
      }

      // Calculate efficiency using the historical production@100% value
      if (newActual && theoreticalForCalculation && theoreticalForCalculation > 0) {
        efficiency = parseFloat(((newActual / theoreticalForCalculation) * 100).toFixed(2));
      }

      const updateData = {};
      if (actualProduction !== undefined) updateData.actualProduction = newActual;
      // Don't update theoreticalProduction or productionAt100 - preserve historical values
      if (theoreticalProduction !== undefined) updateData.theoreticalProduction = parseFloat(theoreticalProduction);
      if (remarks !== undefined) updateData.remarks = remarks;
      if (date !== undefined) updateData.date = date;

      // IMPORTANT: Add yarnType to the update data if provided
      if (yarnType !== undefined) {
        console.log(`Updating yarnType to: ${yarnType}`);
        updateData.yarnType = yarnType;
      } else if (!entry.yarnType && machine) {
        // If entry doesn't have a yarnType, set it from the machine
        console.log(`Entry has no yarnType, setting from machine: ${machine.yarnType}`);
        updateData.yarnType = machine.yarnType || 'Cotton';
      }

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

        // Function to normalize values for comparison (avoids issues like 343 vs 343.00000)
        const normalizeNumber = (value) => {
          if (value === null || value === undefined) return 0;
          return parseFloat(parseFloat(value).toFixed(5));
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
            productionAt100: machine.productionAt100 || 0,
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

// Batch update production entry - handles both day and night shifts in one call
// This is optimized to reduce frontend API calls from 4 to 1
const batchUpdateProductionEntry = async (req, res) => {
  try {
    const { machineNumber, date, dayShift, nightShift, yarnType } = req.body;

    if (!machineNumber || !date) {
      return res.status(400).json({ 
        success: false, 
        error: 'machineNumber and date are required' 
      });
    }

    const result = await sequelize.transaction(async (t) => {
      // Find both day and night entries for this machine/date
      const entries = await ASUProductionEntry.findAll({
        where: {
          machineNumber: parseInt(machineNumber),
          date: date,
          unit: 1
        },
        transaction: t
      });

      const dayEntry = entries.find(e => e.shift === 'day');
      const nightEntry = entries.find(e => e.shift === 'night');

      // Get machine for productionAt100 if needed
      let productionAt100 = dayEntry?.productionAt100 || nightEntry?.productionAt100;
      if (!productionAt100) {
        const machine = await ASUMachine.findOne({
          where: { machineNo: parseInt(machineNumber), unit: 1 },
          transaction: t
        });
        productionAt100 = machine?.productionAt100 || 400;
      }

      const results = { day: null, night: null };
      const dayValue = parseFloat(dayShift) || 0;
      const nightValue = parseFloat(nightShift) || 0;

      // Update or create day entry
      if (dayEntry) {
        const efficiency = productionAt100 > 0 ? parseFloat(((dayValue / productionAt100) * 100).toFixed(2)) : 0;
        await dayEntry.update({
          actualProduction: dayValue,
          efficiency,
          ...(yarnType && { yarnType })
        }, { transaction: t });
        results.day = dayEntry;
      } else if (dayValue > 0) {
        const efficiency = productionAt100 > 0 ? parseFloat(((dayValue / productionAt100) * 100).toFixed(2)) : 0;
        results.day = await ASUProductionEntry.create({
          unit: 1,
          machineNumber: parseInt(machineNumber),
          date,
          shift: 'day',
          actualProduction: dayValue,
          theoreticalProduction: productionAt100,
          productionAt100,
          efficiency,
          yarnType: yarnType || 'Cotton'
        }, { transaction: t });
      }

      // Update or create night entry
      if (nightEntry) {
        const efficiency = productionAt100 > 0 ? parseFloat(((nightValue / productionAt100) * 100).toFixed(2)) : 0;
        await nightEntry.update({
          actualProduction: nightValue,
          efficiency,
          ...(yarnType && { yarnType })
        }, { transaction: t });
        results.night = nightEntry;
      } else if (nightValue > 0) {
        const efficiency = productionAt100 > 0 ? parseFloat(((nightValue / productionAt100) * 100).toFixed(2)) : 0;
        results.night = await ASUProductionEntry.create({
          unit: 1,
          machineNumber: parseInt(machineNumber),
          date,
          shift: 'night',
          actualProduction: nightValue,
          theoreticalProduction: productionAt100,
          productionAt100,
          efficiency,
          yarnType: yarnType || 'Cotton'
        }, { transaction: t });
      }

      return results;
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in batch update:', error);
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
// Get production statistics - OPTIMIZED with single combined query
const getProductionStats = async (req, res) => {
  try {
    const { machineNumber, dateFrom, dateTo } = req.query;
    const { QueryTypes } = require('sequelize');

    // Build date conditions
    let dateCondition = '';
    if (dateFrom && dateTo) {
      dateCondition = `AND date BETWEEN '${dateFrom}' AND '${dateTo}'`;
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const defaultDate = thirtyDaysAgo.toISOString().split('T')[0];
      dateCondition = `AND date >= '${defaultDate}'`;
    }

    let machineCondition = '';
    if (machineNumber) {
      machineCondition = `AND machine_no = ${parseInt(machineNumber)}`;
    }

    const today = new Date().toISOString().split('T')[0];

    // Single optimized query combining all stats
    const [result] = await sequelize.query(`
      WITH machine_stats AS (
        SELECT 
          COUNT(*) as total_machines,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_machines
        FROM asu_machines
        WHERE unit = 1
      ),
      today_stats AS (
        SELECT COUNT(*) as today_entries 
        FROM asu_production_entries
        WHERE date = '${today}' AND unit = 1
      ),
      production_stats AS (
        SELECT 
          AVG(efficiency) as avg_efficiency,
          SUM(actual_production) as total_actual_production,
          SUM(theoretical_production) as total_theoretical_production,
          COUNT(*) as total_entries
        FROM asu_production_entries
        WHERE unit = 1 ${dateCondition} ${machineCondition}
      ),
      top_machine AS (
        SELECT 
          machine_no,
          AVG(efficiency) as avg_efficiency,
          COUNT(*) as entry_count
        FROM asu_production_entries 
        WHERE unit = 1 AND efficiency IS NOT NULL ${dateCondition} ${machineCondition}
        GROUP BY machine_no 
        HAVING COUNT(*) > 0
        ORDER BY AVG(efficiency) DESC 
        LIMIT 1
      )
      SELECT 
        m.total_machines,
        m.active_machines,
        t.today_entries,
        p.avg_efficiency,
        p.total_actual_production,
        p.total_theoretical_production,
        p.total_entries,
        tm.machine_no as top_machine_no,
        tm.avg_efficiency as top_machine_efficiency,
        tm.entry_count as top_machine_entries
      FROM machine_stats m
      CROSS JOIN today_stats t
      CROSS JOIN production_stats p
      LEFT JOIN top_machine tm ON true
    `, { type: QueryTypes.SELECT });

    const stats = result || {};
    const totalActual = parseFloat(stats.total_actual_production || 0);
    const totalTheoretical = parseFloat(stats.total_theoretical_production || 0);
    const overallEfficiency = totalTheoretical > 0 ? (totalActual / totalTheoretical) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalMachines: parseInt(stats.total_machines || 0),
        activeMachines: parseInt(stats.active_machines || 0),
        todayEntries: parseInt(stats.today_entries || 0),
        averageEfficiency: parseFloat(stats.avg_efficiency || 0),
        overallEfficiency: parseFloat(overallEfficiency.toFixed(2)),
        totalActualProduction: totalActual,
        totalTheoreticalProduction: totalTheoretical,
        totalEntries: parseInt(stats.total_entries || 0),
        topPerformingMachine: stats.top_machine_no ? {
          machineNumber: parseInt(stats.top_machine_no),
          avgEfficiency: parseFloat(stats.top_machine_efficiency || 0),
          entryCount: parseInt(stats.top_machine_entries || 0)
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching production stats:', error);
    
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
      // Validate count is a number (allow decimals)
      if (isNaN(parseFloat(count))) {
        return res.status(400).json({
          success: false,
          error: 'count must be a number'
        });
      }
      updateData.count = parseFloat(count);
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
      where: { machineNumber: machineNo, unit: 1 }
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
        where: { machineNumber: machineNo, unit: 1 }
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
  getProductionEntry,
  createProductionEntry,
  updateProductionEntry,
  batchUpdateProductionEntry,
  deleteProductionEntry,
  getProductionStats,
  createMachine,
  updateMachine,
  updateMachineYarnTypeAndCount,
  deleteMachine,
  archiveMachine
};
