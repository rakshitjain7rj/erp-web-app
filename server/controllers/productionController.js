const asyncHandler = require("express-async-handler");
const ProductionJob = require("../models/ProductionJob");
const Machine = require("../models/Machine");
const DyeingRecord = require("../models/DyeingRecord");
const { sequelize } = require('../config/postgres');
const { Op } = require('sequelize');

// ✅ Create a new production job
const createProductionJob = asyncHandler(async (req, res) => {
  const {
    productName, productType, quantity, unit, machineId, assignedTo,
    priority, dueDate, estimatedHours, partyName,
    dyeingOrderId, notes,
    // Detailed job card fields
    theoreticalEfficiency,
    qualityTargets,
    shiftAssignments,
    initialUtilityReadings,
    processParameters
  } = req.body;

  // Generate unique job ID
  const jobId = await ProductionJob.generateNextJobId();

  const newJob = await ProductionJob.create({
    jobId,
    productType: productName || productType,
    quantity,
    unit: unit || 'kg',
    machineId,
    workerId: assignedTo,
    priority: priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
    estimatedHours,
    partyName,
    dyeingOrderId,
    notes,
    // Store detailed parameters as JSONB
    theoreticalEfficiency,
    qualityTargets,
    shiftAssignments: shiftAssignments || [],
    initialUtilityReadings,
    processParameters: processParameters || {}
  });

  // Include machine details in response
  const jobWithMachine = await ProductionJob.findByPk(newJob.id, {
    include: [{
      model: Machine,
      as: 'machine'
    }]
  });
  
  console.log('✅ Created Job With Machine:', JSON.stringify(jobWithMachine?.toJSON?.() || jobWithMachine, null, 2));


  res.status(201).json({
    success: true,
    message: 'Production job created successfully',
    data: jobWithMachine
  });
});

// // ✅ Create detailed production job
const createDetailedProductionJob = asyncHandler(async (req, res) => {
  const jobData = req.body;

  // Generate unique job ID
  const jobId = await ProductionJob.generateNextJobId();

  // Create the production job
  const newJob = await ProductionJob.create({
    ...jobData,
    jobId,
    productType: jobData.productName || jobData.productType,
    unit: jobData.unit || 'kg',
    priority: jobData.priority || 'medium',
    dueDate: jobData.dueDate ? new Date(jobData.dueDate) : null,
    shiftAssignments: jobData.shiftAssignments || [],
    processParameters: jobData.processParameters || {},
    qualityControlData: {}
  });

  // Refetch with machine included
  const jobWithMachine = await ProductionJob.findByPk(newJob.id, {
    include: [
      {
        model: Machine,
        as: 'machine'
      }
    ]
  });

  const plainJob = jobWithMachine?.toJSON?.() || jobWithMachine;

  console.log('✅ Created Job With Machine:', JSON.stringify(plainJob, null, 2));

  res.status(201).json({
    success: true,
    message: 'Detailed production job created successfully',
    data: plainJob
  });
});

// ✅ Get all production jobs with filtering and pagination
const getAllProductionJobs = asyncHandler(async (req, res) => {
  const { 
    status, 
    machineId, 
    workerId, 
    partyName, 
    priority,
    startDate, 
    endDate,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const whereClause = {};
  
  if (status) whereClause.status = status;
  if (machineId) whereClause.machineId = machineId;
  if (workerId) whereClause.workerId = workerId;
  if (priority) whereClause.priority = priority;
  if (partyName) whereClause.partyName = { [Op.iLike]: `%${partyName}%` };
  
  if (search) {
    whereClause[Op.or] = [
      { jobId: { [Op.iLike]: `%${search}%` } },
      { productType: { [Op.iLike]: `%${search}%` } },
      { partyName: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await ProductionJob.findAndCountAll({
    where: whereClause,
    include: [{
      model: Machine,
      as: 'machine'
    }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // ✅ Final fixed structure - match frontend expectations
  res.status(200).json({
    success: true,
    data: {
      data: rows,         // 👈 changed from rows to data to match frontend expectation
      total: count,       // 👈 changed from count to total to match frontend expectation
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  });
});

// ✅ Get production job by ID
const getProductionJobById = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id, {
    include: [{
      model: Machine,
      as: 'machine'
    }]
  });
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }
  
  res.status(200).json({
    success: true,
    data: job
  });
});

// ✅ Update production job
const updateProductionJob = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  const allowedUpdates = [
    'productType', 'quantity', 'unit', 'machineId', 'workerId',
    'status', 'priority', 'startDate', 'endDate', 'dueDate',
    'estimatedHours', 'actualHours', 'partyName', 'dyeingOrderId',
    'notes', 'theoreticalEfficiency', 'qualityTargets', 
    'shiftAssignments', 'processParameters', 'qualityControlData'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();
  
  // Return with machine details
  const updatedJob = await ProductionJob.findByPk(job.id, {
    include: [{
      model: Machine,
      as: 'machine'
    }]
  });
  
  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// ✅ Update job status with additional actions
const updateJobStatus = asyncHandler(async (req, res) => {
  const { status, actualHours, finalUtilityReadings, qualityControlData, notes } = req.body;
  
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  job.status = status;
  
  // Auto-set dates and additional data based on status
  if (status === 'in_progress' && !job.startDate) {
    job.startDate = new Date();
  }
  
  if (status === 'completed') {
    job.endDate = new Date();
    if (actualHours) job.actualHours = actualHours;
    if (finalUtilityReadings) job.finalUtilityReadings = finalUtilityReadings;
    if (qualityControlData) job.qualityControlData = qualityControlData;
    if (notes) job.notes = notes;
    
    // Calculate overall efficiency if hourly data exists
    if (job.hourlyEfficiency && job.hourlyEfficiency.length > 0) {
      const totalEfficiency = job.hourlyEfficiency.reduce((sum, hour) => sum + hour.efficiencyPercent, 0);
      job.overallEfficiency = totalEfficiency / job.hourlyEfficiency.length;
      
      const totalDowntime = job.hourlyEfficiency.reduce((sum, hour) => sum + (hour.downtimeMinutes || 0), 0);
      job.totalDowntime = totalDowntime;
    }
  }

  await job.save();
  
  const updatedJob = await ProductionJob.findByPk(job.id, {
    include: [{
      model: Machine,
      as: 'machine'
    }]
  });
  
  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// ✅ Start production job
const startProductionJob = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  if (job.status !== 'pending') {
    res.status(400);
    throw new Error("Job can only be started from pending status");
  }

  job.status = 'in_progress';
  job.startDate = new Date();
  
  await job.save();
  
  const updatedJob = await ProductionJob.findByPk(job.id, {
    include: [{
      model: Machine,
      as: 'machine'
    }]
  });
  
  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// ✅ Complete production job
const completeProductionJob = asyncHandler(async (req, res) => {
  const { actualHours, finalUtilityReadings, qualityControlData, notes } = req.body;
  
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  if (job.status !== 'in_progress') {
    res.status(400);
    throw new Error("Job can only be completed from in-progress status");
  }

  job.status = 'completed';
  job.endDate = new Date();
  
  if (actualHours) job.actualHours = actualHours;
  if (finalUtilityReadings) job.finalUtilityReadings = finalUtilityReadings;
  if (qualityControlData) job.qualityControlData = qualityControlData;
  if (notes) job.notes = (job.notes || '') + (notes ? '\n' + notes : '');
  
  // Calculate metrics if hourly data exists
  if (job.hourlyEfficiency && job.hourlyEfficiency.length > 0) {
    const totalEfficiency = job.hourlyEfficiency.reduce((sum, hour) => sum + hour.efficiencyPercent, 0);
    job.overallEfficiency = totalEfficiency / job.hourlyEfficiency.length;
    
    const totalDowntime = job.hourlyEfficiency.reduce((sum, hour) => sum + (hour.downtimeMinutes || 0), 0);
    job.totalDowntime = totalDowntime;
  }

  await job.save();
  
  const updatedJob = await ProductionJob.findByPk(job.id, {
    include: [{
      model: Machine,
      as: 'machine'
    }]
  });
  
  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// ✅ Delete production job
const deleteProductionJob = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  await job.destroy();
  res.status(200).json({ 
    success: true,
    message: "Production job deleted successfully" 
  });
});

// ✅ Add hourly efficiency entry
const addHourlyEfficiency = asyncHandler(async (req, res) => {
  const { hour, actualProduction, targetProduction, downtimeMinutes, qualityIssues, notes } = req.body;
  
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  const efficiencyPercent = targetProduction > 0 ? (actualProduction / targetProduction) * 100 : 0;
  
  const newEfficiencyEntry = {
    hour,
    actualProduction,
    targetProduction,
    efficiencyPercent: Math.round(efficiencyPercent * 100) / 100,
    downtimeMinutes: downtimeMinutes || 0,
    qualityIssues: qualityIssues || 0,
    notes: notes || '',
    timestamp: new Date()
  };

  // Initialize array if null
  if (!job.hourlyEfficiency) {
    job.hourlyEfficiency = [];
  }

  // Find existing entry for this hour or add new one
  const existingIndex = job.hourlyEfficiency.findIndex(entry => entry.hour === hour);
  if (existingIndex >= 0) {
    job.hourlyEfficiency[existingIndex] = newEfficiencyEntry;
  } else {
    job.hourlyEfficiency.push(newEfficiencyEntry);
  }

  // Sort by hour
  job.hourlyEfficiency.sort((a, b) => a.hour - b.hour);

  await job.save();
  
  res.status(200).json({
    success: true,
    data: job
  });
});

// ✅ Add utility reading
const addUtilityReading = asyncHandler(async (req, res) => {
  const readingData = req.body;
  
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  const newReading = {
    timestamp: readingData.timestamp || new Date(),
    ...readingData
  };

  // Initialize array if null
  if (!job.hourlyUtilityReadings) {
    job.hourlyUtilityReadings = [];
  }

  job.hourlyUtilityReadings.push(newReading);

  await job.save();
  
  res.status(200).json({
    success: true,
    data: job
  });
});

// ✅ Get production job statistics
const getProductionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, machineId, status } = req.query;
  
  const whereClause = {};
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
  }
  
  if (machineId) whereClause.machineId = machineId;
  if (status) whereClause.status = status;

  // Get basic counts
  const totalJobs = await ProductionJob.count({ where: whereClause });
  const activeJobs = await ProductionJob.count({ 
    where: { ...whereClause, status: 'in_progress' } 
  });
  const completedJobs = await ProductionJob.count({ 
    where: { ...whereClause, status: 'completed' } 
  });
  const pendingJobs = await ProductionJob.count({ 
    where: { ...whereClause, status: 'pending' } 
  });

  // Calculate average efficiency
  const completedWithEfficiency = await ProductionJob.findAll({
    where: { 
      ...whereClause, 
      status: 'completed',
      overallEfficiency: { [Op.not]: null }
    },
    attributes: ['overallEfficiency']
  });

  const averageEfficiency = completedWithEfficiency.length > 0
    ? completedWithEfficiency.reduce((sum, job) => sum + parseFloat(job.overallEfficiency), 0) / completedWithEfficiency.length
    : 0;

  // Calculate total downtime
  const jobsWithDowntime = await ProductionJob.findAll({
    where: { 
      ...whereClause,
      totalDowntime: { [Op.not]: null }
    },
    attributes: ['totalDowntime']
  });

  const totalDowntime = jobsWithDowntime.reduce((sum, job) => sum + parseInt(job.totalDowntime), 0);

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      completedJobs,
      pendingJobs,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      totalDowntime
    }
  });
});

// ✅ Get all machines
const getMachines = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  
  const whereClause = {};
  if (type) whereClause.type = type;
  if (status) whereClause.status = status;

  const machines = await Machine.findAll({
    where: whereClause,
    order: [['name', 'ASC']]
  });
  
  res.status(200).json({
    success: true,
    data: machines
  });
});

// ✅ Get machine by ID
const getMachineById = asyncHandler(async (req, res) => {
  const machine = await Machine.findByPk(req.params.id);
  
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }
  
  res.status(200).json({
    success: true,
    data: machine
  });
});

// ✅ Create a new machine
const createMachine = asyncHandler(async (req, res) => {
  const { machineId, name, type, status, capacity, location, specifications } = req.body;
  
  const newMachine = await Machine.create({
    machineId,
    name,
    type: type || 'other',
    status: status || 'active',
    capacity,
    location,
    specifications: specifications || {}
  });
  
  res.status(201).json({
    success: true,
    data: newMachine
  });
});

// ✅ Update machine
const updateMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findByPk(req.params.id);
  
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }

  const allowedUpdates = ['machineId', 'name', 'type', 'status', 'capacity', 'location', 'specifications'];
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      machine[field] = req.body[field];
    }
  });

  await machine.save();
  
  res.status(200).json({
    success: true,
    data: machine
  });
});

// ✅ Delete machine
const deleteMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findByPk(req.params.id);
  
  if (!machine) {
    res.status(404);
    throw new Error("Machine not found");
  }

  // Check if machine has active jobs
  const activeJobs = await ProductionJob.count({
    where: {
      machineId: req.params.id,
      status: ['pending', 'in_progress']
    }
  });

  if (activeJobs > 0) {
    res.status(400);
    throw new Error("Cannot delete machine with active production jobs");
  }

  await machine.destroy();
  
  res.status(200).json({
    success: true,
    message: "Machine deleted successfully"
  });
});

// ✅ Get machines by type
const getMachinesByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  const machines = await Machine.findAll({
    where: { type },
    order: [['name', 'ASC']]
  });
  
  res.status(200).json({
    success: true,
    data: machines
  });
});

// ✅ Get active machines
const getActiveMachines = asyncHandler(async (req, res) => {
  const machines = await Machine.findAll({
    where: { status: 'active' },
    order: [['name', 'ASC']]
  });
  
  res.status(200).json({
    success: true,
    data: machines
  });
});

module.exports = {
  createProductionJob,
  createDetailedProductionJob,
  getAllProductionJobs,
  getProductionJobById,
  updateProductionJob,
  updateJobStatus,
  startProductionJob,
  completeProductionJob,
  deleteProductionJob,
  addHourlyEfficiency,
  addUtilityReading,
  getProductionStats,
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachinesByType,
  getActiveMachines
};
