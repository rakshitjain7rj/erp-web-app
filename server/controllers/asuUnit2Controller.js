const { Op } = require('sequelize');
const ASUMachine = require('../models/ASUMachine');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const { sequelize } = require('../config/postgres');

// Helper to ensure unit scoping
const UNIT = 2;

// Get all ASU machines (Unit 2)
const getASUMachines = async (req, res) => {
  try {
    const machines = await ASUMachine.findAll({
      where: { unit: UNIT, isActive: true },
      order: [['machineNo', 'ASC']]
    });

    res.json({ success: true, data: machines });
  } catch (error) {
    console.error('Error fetching ASU Unit 2 machines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all ASU machines with complete details (Unit 2)
const getAllMachines = async (req, res) => {
  try {
    const machines = await ASUMachine.findAll({
      where: { unit: UNIT },
      order: [['machineNo', 'ASC']]
    });

    res.json({ success: true, data: machines });
  } catch (error) {
    console.error('Error fetching all ASU Unit 2 machines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get production entries (Unit 2)
const getProductionEntries = async (req, res) => {
  try {
    const { machineNumber, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { unit: UNIT };
    if (machineNumber) where.machineNumber = parseInt(machineNumber);
    if (dateFrom && dateTo) where.date = { [Op.between]: [dateFrom, dateTo] };
    else if (dateFrom) where.date = { [Op.gte]: dateFrom };
    else if (dateTo) where.date = { [Op.lte]: dateTo };

    const { count, rows } = await ASUProductionEntry.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['machineNumber', 'ASC'], ['shift', 'ASC']],
      include: [{
        model: ASUMachine,
        as: 'machine',
        attributes: ['id', 'machineNo', 'productionAt100', 'isActive', 'spindles', 'speed', 'count', 'yarnType'],
        where: { unit: UNIT },
        required: false
      }]
    });

    res.json({
      success: true,
      data: { items: rows, total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    console.error('Error fetching Unit 2 production entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new production entry (Unit 2)
const createProductionEntry = async (req, res) => {
  try {
    const { machineNumber, date, shift, actualProduction, theoreticalProduction, remarks, yarnType, workerName, mainsReading } = req.body;

    if (!machineNumber || !date || !shift) {
      return res.status(400).json({ success: false, error: 'Machine number, date, and shift are required' });
    }
    if (!['day', 'night'].includes(shift)) {
      return res.status(400).json({ success: false, error: 'Shift must be either "day" or "night"' });
    }

    const result = await sequelize.transaction(async (t) => {
      let finalTheoreticalProduction = theoreticalProduction;
      let machine = await ASUMachine.findOne({ where: { machineNo: parseInt(machineNumber), unit: UNIT }, transaction: t });
      if (!machine) throw new Error(`Machine number ${machineNumber} not found`);
      if (machine.productionAt100) finalTheoreticalProduction = machine.productionAt100;
      const machineYarnType = machine.yarnType || 'Cotton';

      const existingEntry = await ASUProductionEntry.findOne({ where: { unit: UNIT, machineNumber: parseInt(machineNumber), date, shift }, transaction: t });
      if (existingEntry) {
        throw new Error(`Production entry for Machine ${machineNumber} on ${date} (${shift} shift) already exists. Please edit the existing entry instead.`);
      }

      const efficiency = actualProduction && finalTheoreticalProduction && finalTheoreticalProduction > 0
        ? parseFloat(((actualProduction / finalTheoreticalProduction) * 100).toFixed(2))
        : null;

      const entry = await ASUProductionEntry.create({
        unit: UNIT,
        machineNumber: parseInt(machineNumber),
        date,
        shift,
        yarnType: yarnType || machineYarnType,
        actualProduction: actualProduction !== undefined && actualProduction !== null ? parseFloat(actualProduction) : 0,
        theoreticalProduction: finalTheoreticalProduction ? parseFloat(finalTheoreticalProduction) : null,
        productionAt100: finalTheoreticalProduction ? parseFloat(finalTheoreticalProduction) : null,
        efficiency,
        remarks: remarks || null,
        workerName: workerName || null,
        mainsReading: mainsReading !== undefined && mainsReading !== null ? parseFloat(mainsReading) : null
      }, { transaction: t });

      return entry;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating Unit 2 production entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update production entry (Unit 2)
const updateProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualProduction, theoreticalProduction, remarks, yarnType, date, workerName, mainsReading } = req.body;

    const entry = await ASUProductionEntry.findByPk(id);
    if (!entry) return res.status(404).json({ success: false, error: 'Production entry not found' });

    const result = await sequelize.transaction(async (t) => {
      let efficiency = entry.efficiency;
      const newActual = actualProduction !== undefined ? parseFloat(actualProduction) : entry.actualProduction;
      let theoreticalForCalculation = entry.productionAt100 || entry.theoreticalProduction;

      if (!theoreticalForCalculation) {
        const machine = await ASUMachine.findOne({ where: { machineNo: entry.machineNumber, unit: UNIT }, transaction: t });
        if (machine && machine.productionAt100) {
          theoreticalForCalculation = machine.productionAt100;
          await entry.update({ productionAt100: theoreticalForCalculation }, { transaction: t });
        }
      }

      if (newActual && theoreticalForCalculation && theoreticalForCalculation > 0) {
        efficiency = parseFloat(((newActual / theoreticalForCalculation) * 100).toFixed(2));
      }

      const updateData = {};
      if (actualProduction !== undefined) updateData.actualProduction = newActual;
      if (theoreticalProduction !== undefined) updateData.theoreticalProduction = parseFloat(theoreticalProduction);
      if (remarks !== undefined) updateData.remarks = remarks;
      if (date !== undefined) updateData.date = date;
      if (yarnType !== undefined) updateData.yarnType = yarnType;
      if (workerName !== undefined) updateData.workerName = workerName;
      if (mainsReading !== undefined) updateData.mainsReading = mainsReading !== null ? parseFloat(mainsReading) : null;
      updateData.efficiency = efficiency;

      await entry.update(updateData, { transaction: t });
      return entry;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating Unit 2 production entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete production entry (Unit 2)
const deleteProductionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ASUProductionEntry.destroy({ where: { id } });
    if (deleted === 0) return res.status(404).json({ success: false, error: 'Production entry not found' });
    res.json({ success: true, message: 'Production entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting Unit 2 production entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get production statistics (Unit 2)
const getProductionStats = async (req, res) => {
  try {
    const { machineNumber, dateFrom, dateTo } = req.query;
    const { QueryTypes } = require('sequelize');

    const tableCheck = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('asu_machines', 'asu_production_entries')
    `, { type: QueryTypes.SELECT });

    if (tableCheck.length < 2) {
      return res.status(500).json({ success: false, error: 'Database tables not found. Please run the ASU migration script first.' });
    }

    // Date conditions
    let conditions = '';
    if (machineNumber) conditions += ` AND machine_no = ${parseInt(machineNumber)}`;
    if (dateFrom && dateTo) conditions += ` AND date BETWEEN '${dateFrom}' AND '${dateTo}'`;
    else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const defaultDate = thirtyDaysAgo.toISOString().split('T')[0];
      conditions += ` AND date >= '${defaultDate}'`;
    }
    conditions += ` AND unit = ${UNIT}`;

    const [machinesResult] = await sequelize.query(`
      SELECT COUNT(*) as total_machines,
             SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_machines
      FROM asu_machines
      WHERE unit = ${UNIT}
    `, { type: QueryTypes.SELECT });

    const totalMachines = parseInt(machinesResult.total_machines || 0);
    const activeMachines = parseInt(machinesResult.active_machines || 0);

    const today = new Date().toISOString().split('T')[0];
    const [todayResult] = await sequelize.query(`
      SELECT COUNT(*) as today_entries 
      FROM asu_production_entries
      WHERE date = '${today}' AND unit = ${UNIT}
    `, { type: QueryTypes.SELECT });
    const todayEntries = parseInt(todayResult.today_entries || 0);

    const [stats] = await sequelize.query(`
      SELECT 
        AVG(efficiency) as avg_efficiency,
        SUM(actual_production) as total_actual_production,
        SUM(theoretical_production) as total_theoretical_production,
        COUNT(*) as total_entries
      FROM asu_production_entries
      WHERE unit = ${UNIT} ${conditions}
    `, { type: QueryTypes.SELECT });

    const [topMachine] = await sequelize.query(`
      SELECT machine_no, AVG(efficiency) as avg_efficiency, COUNT(*) as entry_count
      FROM asu_production_entries 
      WHERE unit = ${UNIT} AND efficiency IS NOT NULL ${conditions}
      GROUP BY machine_no 
      HAVING COUNT(*) > 0
      ORDER BY AVG(efficiency) DESC 
      LIMIT 1
    `, { type: QueryTypes.SELECT });

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
    console.error('Error fetching Unit 2 production stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new ASU Machine (Unit 2)
const createMachine = async (req, res) => {
  try {
    const { machineNo, machine_name, count, yarnType, spindles, speed, productionAt100 } = req.body;
    const parsedMachineNo = typeof machineNo === 'string' ? parseInt(machineNo, 10) : Number(machineNo);
    if (!machineNo || !count) {
      return res.status(400).json({ success: false, error: 'Machine number and count are required' });
    }

    const machine = await ASUMachine.create({
      machineNo: parsedMachineNo,
      machineName: machine_name || `Machine ${parsedMachineNo}`,
      count,
      yarnType: yarnType || 'Cotton',
      spindles,
      speed,
      productionAt100,
      unit: UNIT,
      isActive: true
    });

    res.status(201).json({ success: true, data: machine });
  } catch (error) {
    console.error('Error creating ASU Unit 2 machine:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, error: `Machine number ${req.body.machineNo} already exists for another unit because of an old constraint. Please restart the server to apply the per-unit uniqueness fix, or run the migration to enforce UNIQUE(unit, machine_no).` });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update an ASU Machine (Unit 2)
const updateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { machineNo, machine_number, machine_name, count, yarnType, spindles, speed, productionAt100, isActive, status } = req.body;

    const machine = await ASUMachine.findOne({ where: { id, unit: UNIT } });
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });

    const updateData = {
      machineNo: machineNo !== undefined ? machineNo : machine_number !== undefined ? (isNaN(Number(machine_number)) ? machine.machineNo : Number(machine_number)) : machine.machineNo,
      count: count !== undefined ? count : machine.count,
      yarnType: yarnType || machine.yarnType,
      spindles: spindles !== undefined ? spindles : machine.spindles,
      speed: speed !== undefined ? speed : machine.speed,
      productionAt100: productionAt100 !== undefined ? productionAt100 : machine.productionAt100,
      isActive: isActive !== undefined ? Boolean(isActive) : status !== undefined ? String(status).toLowerCase() === 'active' : machine.isActive,
      machineName: machine_name || machine.machineName || `Machine ${machineNo || machine_number || machine.machineNo}`
    };

    await machine.update(updateData);
    res.json({ success: true, data: machine });
  } catch (error) {
    console.error('Error updating ASU Unit 2 machine:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, error: `Machine with number ${req.body.machineNo} already exists` });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update machine yarn type and count (Unit 2)
const updateMachineYarnTypeAndCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { yarnType, count, productionAt100 } = req.body;

    const machine = await ASUMachine.findOne({ where: { id, unit: UNIT } });
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });

    const updateData = {};
    if (yarnType !== undefined) updateData.yarnType = yarnType;
    if (count !== undefined) updateData.count = parseFloat(count);
    if (productionAt100 !== undefined) updateData.productionAt100 = parseFloat(productionAt100);

    await machine.update(updateData);
    res.json({ success: true, data: machine });
  } catch (error) {
    console.error('Error updating ASU Unit 2 machine yarn type and count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete an ASU Machine (Unit 2)
const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'Machine ID is required' });

    const machine = await ASUMachine.findOne({ where: { id, unit: UNIT } });
    if (!machine) return res.status(404).json({ success: false, error: `Machine with ID ${id} not found` });

    const machineNo = machine.machineNo;
    const relatedEntries = await ASUProductionEntry.count({ where: { machineNumber: machineNo, unit: UNIT } });

    if (relatedEntries > 0 && force !== 'true') {
      return res.status(409).json({ success: false, error: `Cannot delete machine with ID ${id} because it has ${relatedEntries} production entries associated with it`, hasRelatedEntries: true, entriesCount: relatedEntries });
    }

    if (force === 'true' && relatedEntries > 0) {
      await ASUProductionEntry.destroy({ where: { machineNumber: machineNo, unit: UNIT } });
    }

    await machine.destroy();
    return res.status(200).json({ success: true, message: `Machine with ID ${id} has been deleted${force === 'true' ? ' along with all its production entries' : ''}` });
  } catch (error) {
    console.error('Error deleting ASU Unit 2 machine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const archiveMachine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Machine ID is required' });

    const machine = await ASUMachine.findOne({ where: { id, unit: UNIT } });
    if (!machine) return res.status(404).json({ success: false, error: `Machine with ID ${id} not found` });

    await machine.update({ isActive: false, archivedAt: new Date(), status: 'ARCHIVED' });
    res.json({ success: true, message: `Machine with ID ${id} has been archived` });
  } catch (error) {
    console.error('Error archiving ASU Unit 2 machine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Batch update production entries (Unit 2)
const batchUpdateProductionEntry = async (req, res) => {
  try {
    const { machineNumber, date, dayShift, nightShift, yarnType, dayShiftWorker, nightShiftWorker, dayMainsReading, nightMainsReading } = req.body;

    if (!machineNumber || !date) {
      return res.status(400).json({ success: false, error: 'Machine number and date are required' });
    }

    const result = await sequelize.transaction(async (t) => {
      // Helper to update or create entry
      const updateOrCreateShift = async (shift, production, worker, mains) => {
        let entry = await ASUProductionEntry.findOne({ 
          where: { unit: UNIT, machineNumber: parseInt(machineNumber), date, shift },
          transaction: t 
        });

        if (entry) {
          // Update existing
          const updateData = {};
          if (production !== undefined) updateData.actualProduction = parseFloat(production);
          if (yarnType !== undefined) updateData.yarnType = yarnType;
          if (worker !== undefined) updateData.workerName = worker;
          if (mains !== undefined) updateData.mainsReading = mains !== null ? parseFloat(mains) : null;
          
          // Recalculate efficiency
          let theoretical = entry.productionAt100 || entry.theoreticalProduction;
          if (!theoretical) {
             const machine = await ASUMachine.findOne({ where: { machineNo: parseInt(machineNumber), unit: UNIT }, transaction: t });
             if (machine) theoretical = machine.productionAt100;
          }
          
          if (production !== undefined && theoretical > 0) {
            updateData.efficiency = parseFloat(((parseFloat(production) / theoretical) * 100).toFixed(2));
          }
          
          await entry.update(updateData, { transaction: t });
          return entry;
        } else if (production > 0) {
          // Create new if production > 0
          const machine = await ASUMachine.findOne({ where: { machineNo: parseInt(machineNumber), unit: UNIT }, transaction: t });
          const theoretical = machine ? machine.productionAt100 : 400;
          
          const newEntry = await ASUProductionEntry.create({
            unit: UNIT,
            machineNumber: parseInt(machineNumber),
            date,
            shift,
            yarnType: yarnType || (machine ? machine.yarnType : 'Cotton'),
            actualProduction: parseFloat(production),
            theoreticalProduction: theoretical,
            productionAt100: theoretical,
            efficiency: theoretical > 0 ? parseFloat(((parseFloat(production) / theoretical) * 100).toFixed(2)) : 0,
            workerName: worker || null,
            mainsReading: mains !== undefined && mains !== null ? parseFloat(mains) : null
          }, { transaction: t });
          return newEntry;
        }
        return null;
      };

      const dayEntry = await updateOrCreateShift('day', dayShift, dayShiftWorker, dayMainsReading);
      const nightEntry = await updateOrCreateShift('night', nightShift, nightShiftWorker, nightMainsReading);

      return { day: dayEntry, night: nightEntry };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error batch updating Unit 2 production entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Batch create production entries (Unit 2)
const batchCreateProductionEntry = async (req, res) => {
  try {
    const { machineNumber, date, dayShift, nightShift, yarnType, dayShiftWorker, nightShiftWorker, dayMainsReading, nightMainsReading, productionAt100 } = req.body;

    if (!machineNumber || !date) {
      return res.status(400).json({ success: false, error: 'Machine number and date are required' });
    }

    const result = await sequelize.transaction(async (t) => {
      let machine = await ASUMachine.findOne({ where: { machineNo: parseInt(machineNumber), unit: UNIT }, transaction: t });
      if (!machine) throw new Error(`Machine number ${machineNumber} not found`);
      
      const theoretical = productionAt100 || machine.productionAt100 || 400;
      const entryYarnType = yarnType || machine.yarnType || 'Cotton';

      // Check for existing entries
      const existingDay = await ASUProductionEntry.findOne({ where: { unit: UNIT, machineNumber: parseInt(machineNumber), date, shift: 'day' }, transaction: t });
      const existingNight = await ASUProductionEntry.findOne({ where: { unit: UNIT, machineNumber: parseInt(machineNumber), date, shift: 'night' }, transaction: t });

      if (existingDay || existingNight) {
          throw new Error(`Production entries for Machine ${machineNumber} on ${date} already exist.`);
      }

      const createEntry = async (shift, production, worker, mains) => {
          if (production !== undefined && production !== null && parseFloat(production) > 0) {
             return await ASUProductionEntry.create({
                unit: UNIT,
                machineNumber: parseInt(machineNumber),
                date,
                shift,
                yarnType: entryYarnType,
                actualProduction: parseFloat(production),
                theoreticalProduction: theoretical,
                productionAt100: theoretical,
                efficiency: theoretical > 0 ? parseFloat(((parseFloat(production) / theoretical) * 100).toFixed(2)) : 0,
                workerName: worker || null,
                mainsReading: mains !== undefined && mains !== null ? parseFloat(mains) : null
             }, { transaction: t });
          }
          return null;
      };

      const dayEntry = await createEntry('day', dayShift, dayShiftWorker, dayMainsReading);
      const nightEntry = await createEntry('night', nightShift, nightShiftWorker, nightMainsReading);

      if (!dayEntry && !nightEntry) {
        throw new Error('At least one shift must have production greater than 0');
      }

      return { day: dayEntry, night: nightEntry };
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error batch creating Unit 2 production entries:', error);
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
  updateMachineYarnTypeAndCount,
  deleteMachine,
  archiveMachine,
  batchUpdateProductionEntry,
  batchCreateProductionEntry
};


