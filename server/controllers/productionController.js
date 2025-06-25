const asyncHandler = require("express-async-handler");
const ProductionJob = require("../models/ProductionJob");
const Machine = require("../models/Machine");
const DyeingRecord = require("../models/DyeingRecord");
const { sequelize } = require('../config/postgres');
const { Op } = require('sequelize');

// ✅ Create a new production job
const createProductionJob = asyncHandler(async (req, res) => {
  const {
    productName, quantity, unit, machineId, assignedTo,
    priority, dueDate, estimatedHours, partyName,
    dyeingOrderId, notes,
    // Detailed job card fields
    theoreticalEfficiency,
    qualityTargets,
    shiftAssignments,
    initialUtilityReadings
  } = req.body;

  // Generate unique job ID
  const jobId = await ProductionJob.generateNextJobId();

  const newJob = await ProductionJob.create({
    jobId,
    productName,
    quantity,
    unit: unit || 'kg',
    machineId,
    assignedTo,
    priority: priority || 'medium',
    dueDate,
    estimatedHours,
    partyName,
    dyeingOrderId,
    notes,
    // Store detailed parameters as JSON
    theoreticalEfficiency: theoreticalEfficiency ? JSON.stringify(theoreticalEfficiency) : null,
    qualityTargets: qualityTargets ? JSON.stringify(qualityTargets) : null,
    shiftAssignments: shiftAssignments ? JSON.stringify(shiftAssignments) : null,
    initialUtilityReadings: initialUtilityReadings ? JSON.stringify(initialUtilityReadings) : null,
    createdBy: req.user?.id || 1,
    createdByName: req.user?.name || 'System User'
  });

  res.status(201).json({
    success: true,
    message: 'Production job created successfully',
    data: newJob
  });
});

// ✅ Get all production jobs with filtering and pagination
const getAllProductionJobs = asyncHandler(async (req, res) => {
  const { 
    status, 
    machineId, 
    workerId, 
    partyName, 
    startDate, 
    endDate,
    page = 1,
    limit = 50
  } = req.query;

  const whereClause = {};
  
  if (status) whereClause.status = status;
  if (machineId) whereClause.machineId = machineId;
  if (workerId) whereClause.workerId = workerId;
  if (partyName) whereClause.partyName = { [Op.iLike]: `%${partyName}%` };
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
  }

  const offset = (page - 1) * limit;

  const { rows: jobs, count: totalJobs } = await ProductionJob.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    jobs,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
      hasNext: page * limit < totalJobs,
      hasPrev: page > 1
    }
  });
});

// ✅ Get production job by ID
const getProductionJobById = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }
  
  res.status(200).json(job);
});

// ✅ Update production job
const updateProductionJob = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  const allowedUpdates = [
    'productType', 'quantity', 'unit', 'machineId', 'workerName', 'workerId',
    'status', 'priority', 'scheduledStartDate', 'actualStartDate',
    'expectedCompletionDate', 'actualCompletionDate', 'partyName',
    'yarnType', 'shade', 'count', 'qualityGrade', 'defectPercentage',
    'productionNotes', 'qualityNotes'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();
  res.status(200).json(job);
});

// ✅ Update job status
const updateJobStatus = asyncHandler(async (req, res) => {
  const { status, actualStartDate, actualCompletionDate, qualityGrade, qualityNotes } = req.body;
  
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  job.status = status;
  
  // Auto-set dates based on status
  if (status === 'In Progress' && !job.actualStartDate) {
    job.actualStartDate = actualStartDate || new Date();
  }
  
  if (status === 'Completed') {
    job.actualCompletionDate = actualCompletionDate || new Date();
    if (qualityGrade) job.qualityGrade = qualityGrade;
    if (qualityNotes) job.qualityNotes = qualityNotes;
  }

  await job.save();
  res.status(200).json(job);
});

// ✅ Delete production job
const deleteProductionJob = asyncHandler(async (req, res) => {
  const job = await ProductionJob.findByPk(req.params.id);
  
  if (!job) {
    res.status(404);
    throw new Error("Production job not found");
  }

  await job.destroy();
  res.status(200).json({ message: "Production job deleted successfully" });
});

// ✅ Get production dashboard summary
const getProductionSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const whereClause = {};
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
  }

  // Get counts by status
  const statusCounts = await ProductionJob.findAll({
    where: whereClause,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  // Get machine utilization
  const machineUtilization = await ProductionJob.findAll({
    where: {
      ...whereClause,
      machineId: { [Op.not]: null },
      status: { [Op.in]: ['In Progress', 'Completed'] }
    },
    attributes: [
      'machineId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'jobCount'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
    ],
    group: ['machineId'],
    raw: true
  });

  // Get worker productivity
  const workerProductivity = await ProductionJob.findAll({
    where: {
      ...whereClause,
      workerId: { [Op.not]: null },
      status: 'Completed'
    },
    attributes: [
      'workerId',
      'workerName',
      [sequelize.fn('COUNT', sequelize.col('id')), 'completedJobs'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalProduced']
    ],
    group: ['workerId', 'workerName'],
    raw: true
  });

  // Get overdue jobs
  const today = new Date();
  const overdueJobs = await ProductionJob.findAll({
    where: {
      ...whereClause,
      status: { [Op.notIn]: ['Completed'] },
      expectedCompletionDate: { [Op.lt]: today }
    },
    order: [['expectedCompletionDate', 'ASC']],
    limit: 10
  });

  res.status(200).json({
    statusCounts,
    machineUtilization,
    workerProductivity,
    overdueJobs
  });
});

// ✅ Get production jobs by party
const getJobsByParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;
  
  const jobs = await ProductionJob.findAll({
    where: {
      partyName: { [Op.iLike]: `%${partyName}%` }
    },
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json(jobs);
});

// ✅ Create job from dyeing order
const createJobFromDyeingOrder = asyncHandler(async (req, res) => {
  const { dyeingOrderId } = req.params;
  const { productType, machineId, workerName, workerId, scheduledStartDate, expectedCompletionDate } = req.body;
  
  const dyeingOrder = await DyeingRecord.findByPk(dyeingOrderId);
  
  if (!dyeingOrder) {
    res.status(404);
    throw new Error("Dyeing order not found");
  }

  // Generate unique job ID
  const jobId = await ProductionJob.generateNextJobId();

  const newJob = await ProductionJob.create({
    jobId,
    productType: productType || `${dyeingOrder.yarnType} Production`,
    quantity: dyeingOrder.quantity,
    unit: 'kg',
    machineId,
    workerName,
    workerId,
    scheduledStartDate,
    expectedCompletionDate,
    partyName: dyeingOrder.partyName,
    dyeingOrderId: dyeingOrder.id,
    yarnType: dyeingOrder.yarnType,
    shade: dyeingOrder.shade,
    count: dyeingOrder.count,
    createdBy: req.user?.id || 1,
    createdByName: req.user?.name || 'System User'
  });
  res.status(201).json(newJob);
});

// ✅ Get all machines
const getMachines = asyncHandler(async (req, res) => {
  const machines = await Machine.findAll({
    order: [['machineName', 'ASC']]
  });
  res.status(200).json(machines);
});

// ✅ Create a new machine
const createMachine = asyncHandler(async (req, res) => {
  const { name, type, status, capacity, location, operatorId } = req.body;
  
  const newMachine = await Machine.create({
    machineName: name,
    machineType: type,
    status: status || 'Active',
    capacity,
    location,
    operatorId
  });
  
  res.status(201).json(newMachine);
});

module.exports = {
  createProductionJob,
  getAllProductionJobs,
  getProductionJobById,
  updateProductionJob,
  updateJobStatus,
  deleteProductionJob,
  getProductionSummary,
  getJobsByParty,
  createJobFromDyeingOrder,
  getMachines,
  createMachine
};
