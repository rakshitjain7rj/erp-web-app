// server/controllers/dashboardController.js
const { sequelize } = require('../config/postgres');
const { Op, QueryTypes } = require('sequelize');
const ASUMachine = require('../models/ASUMachine');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const DyeingRecord = require('../models/DyeingRecord');
const Party = require('../models/Party');
const Inventory = require('../models/InventoryPostgres');

/**
 * Get comprehensive dashboard stats from across the system
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { startDate, endDate, category, machineStatus } = req.query;
    
    // 1. Get inventory metrics
    const inventoryMetrics = await getInventoryMetrics(category);
    
    // 2. Get party metrics
    const partyMetrics = await getPartyMetrics(startDate, endDate);
    
    // 3. Get production metrics
    const productionMetrics = await getProductionMetrics(startDate, endDate, machineStatus);
    
    // 4. Get time-series data for charts
    const timeSeriesData = await getTimeSeriesData(startDate, endDate);
    
    // 5. Get machine performance data
    const machinePerformanceData = await getMachinePerformanceData(startDate, endDate, machineStatus);
    
    // 6. Get quality metrics
    const qualityMetrics = await getQualityMetrics(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: {
        ...inventoryMetrics,
        ...partyMetrics,
        ...productionMetrics,
        ...timeSeriesData,
        ...machinePerformanceData,
        ...qualityMetrics
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message
    });
  }
};

/**
 * Get machine performance data for dashboard
 */
const getMachinePerformanceData = async (startDate, endDate, machineStatus) => {
  try {
    // Build date filter for machine performance queries
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = ` AND pe.date BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = ` AND pe.date >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = ` AND pe.date <= '${endDate}'`;
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = ` AND pe.date >= '${thirtyDaysAgo.toISOString().split('T')[0]}'`;
    }
    
    // Build machine status filter
    let machineFilter = '';
    if (machineStatus && machineStatus !== 'all') {
      switch (machineStatus) {
        case 'operational':
          machineFilter = ' AND m.is_active = true';
          break;
        case 'maintenance':
          machineFilter = ' AND m.is_active = false AND m."maintenanceMode" = true';
          break;
        case 'offline':
          machineFilter = ' AND m.is_active = false AND m."maintenanceMode" = false';
          break;
      }
    }
    
    // Get machine performance data
    const [machinePerformanceResults] = await sequelize.query(`
      SELECT 
        m.id, 
        m.machine_name AS name, 
        AVG(pe.efficiency) AS "avgEfficiency",
        m.is_active,
        m."maintenanceMode",
        TO_CHAR(m."lastMaintenance", 'YYYY-MM-DD') AS "lastMaintenance",
        COUNT(pe.id) AS "entriesCount",
        SUM(pe.actual_production) AS "totalProduction"
      FROM "asu_machines" m
      LEFT JOIN "asu_production_entries" pe ON m.machine_no = pe.machine_no${dateFilter}
      WHERE 1=1${machineFilter}
      GROUP BY m.id, m.machine_name, m.is_active, m."maintenanceMode", m."lastMaintenance"
      ORDER BY AVG(pe.efficiency) DESC NULLS LAST
      LIMIT 10;
    `);
    
    // Format machine performance data
    const machinePerformance = machinePerformanceResults.map(machine => {
      let status = 'operational';
      if (!machine.is_active) {
        status = machine.maintenanceMode ? 'maintenance' : 'offline';
      }
      
      return {
        id: machine.id,
        name: machine.name,
        efficiency: parseFloat(machine.avgEfficiency || 0).toFixed(2),
        status,
        lastMaintenance: machine.lastMaintenance,
        entriesCount: parseInt(machine.entriesCount || 0),
        totalProduction: parseFloat(machine.totalProduction || 0),
        wastePercentage: 0 // Default value since this field is no longer used
      };
    });
    
    return {
      machinePerformance
    };
  } catch (error) {
    console.error("Error getting machine performance data:", error);
    return {
      machinePerformance: []
    };
  }
};

/**
 * Get quality-related metrics for dashboard
 */
const getQualityMetrics = async (startDate, endDate) => {
  try {
    // Build date filter for quality metrics queries
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = ` AND date BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = ` AND date >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = ` AND date <= '${endDate}'`;
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = ` AND date >= '${thirtyDaysAgo.toISOString().split('T')[0]}'`;
    }
    
    // Get quality statistics
    const [qualityResults] = await sequelize.query(`
      SELECT 
        AVG(efficiency) AS "avgEfficiency",
        COUNT(*) FILTER (WHERE efficiency >= 90) AS "gradeACount",
        COUNT(*) FILTER (WHERE efficiency BETWEEN 70 AND 89.99) AS "gradeBCount",
        COUNT(*) FILTER (WHERE efficiency < 70) AS "gradeCCount",
        COUNT(DISTINCT machine_no) AS "machinesUsed"
      FROM "asu_production_entries"
      WHERE efficiency IS NOT NULL${dateFilter};
    `);
    
    // Calculate quality distribution percentages
    const totalQualityEntries = 
      (parseInt(qualityResults[0]?.gradeACount || 0) +
       parseInt(qualityResults[0]?.gradeBCount || 0) +
       parseInt(qualityResults[0]?.gradeCCount || 0)) || 1; // Prevent divide by zero
    
    const qualityDistribution = [
      {
        grade: 'A',
        percentage: Math.round((parseInt(qualityResults[0]?.gradeACount || 0) / totalQualityEntries) * 100),
        count: parseInt(qualityResults[0]?.gradeACount || 0)
      },
      {
        grade: 'B',
        percentage: Math.round((parseInt(qualityResults[0]?.gradeBCount || 0) / totalQualityEntries) * 100),
        count: parseInt(qualityResults[0]?.gradeBCount || 0)
      },
      {
        grade: 'C',
        percentage: Math.round((parseInt(qualityResults[0]?.gradeCCount || 0) / totalQualityEntries) * 100),
        count: parseInt(qualityResults[0]?.gradeCCount || 0)
      }
    ];
    
    // Get latest quality issues by machine
    const [recentIssues] = await sequelize.query(`
      SELECT 
        pe.id,
        m.machine_name AS "machineName",
        TO_CHAR(pe.date, 'YYYY-MM-DD') AS "date",
        CASE WHEN efficiency < 60 THEN 5.0 WHEN efficiency < 80 THEN 2.5 ELSE 1.0 END AS "defectRate",
        pe.efficiency,
        pe.actual_production AS "production",
        'Standard' AS "grade",
        pe.remarks
      FROM "asu_production_entries" pe
      JOIN "asu_machines" m ON pe.machine_no = m.machine_no
      WHERE pe.efficiency < 60${dateFilter}
      ORDER BY pe.date DESC, pe.efficiency ASC
      LIMIT 5;
    `);
    
    return {
      qualityMetrics: {
        summary: {
          avgEfficiency: parseFloat(qualityResults[0]?.avgEfficiency || 0).toFixed(2),
          machinesUsed: parseInt(qualityResults[0]?.machinesUsed || 0)
        },
        qualityDistribution,
        recentIssues: recentIssues.map(issue => ({
          id: issue.id,
          machineName: issue.machineName,
          date: issue.date,
          defectRate: parseFloat(issue.defectRate).toFixed(1),
          efficiency: parseFloat(issue.efficiency).toFixed(2),
          production: parseFloat(issue.production).toFixed(2),
          grade: issue.grade,
          remarks: issue.remarks
        }))
      }
    };
  } catch (error) {
    console.error("Error getting quality metrics data:", error);
    return {
      qualityMetrics: {
        summary: {
          avgEfficiency: 0,
          machinesUsed: 0
        },
        qualityDistribution: [],
        recentIssues: []
      }
    };
  }
};

// Simple placeholders for other methods
const getInventoryMetrics = async () => ({ inventorySummary: {} });
const getPartyMetrics = async () => ({ partyMetrics: {} });
const getProductionMetrics = async () => ({ productionMetrics: {} });
const getTimeSeriesData = async () => ({ timeSeriesData: {} });

// Export all functions
module.exports = {
  getDashboardStats,
  getInventoryMetrics,
  getPartyMetrics,
  getProductionMetrics,
  getTimeSeriesData,
  getMachinePerformanceData,
  getQualityMetrics
};
