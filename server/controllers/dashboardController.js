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
      error: error.message
    });
  }
};

/**
 * Get inventory metrics with category filtering support
 */
async function getInventoryMetrics(category = null) {
  try {
    // Build where clause for category filtering
    let whereClause = {};
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    // Get total inventory items
    const totalItems = await Inventory.count({ where: whereClause });
    
    // Get low stock items (items with currentQuantity below 10% of initialQuantity)
    const lowStockQuery = { ...whereClause };
    lowStockQuery[Op.and] = sequelize.literal('"currentQuantity" < "initialQuantity" * 0.1');
    const lowStockItems = await Inventory.count({ where: lowStockQuery });
    
    // Get total inventory value
    const inventoryValue = await Inventory.sum('totalValue', { where: whereClause });
    
    // Get inventory by category for visualization
    const inventoryByCategory = await Inventory.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalValue')), 'value']
      ],
      group: ['category'],
      order: [[sequelize.fn('SUM', sequelize.col('totalValue')), 'DESC']]
    });
    
    // Format inventory by category data
    const formattedCategories = inventoryByCategory.map(item => ({
      name: item.category || 'Uncategorized',
      count: parseInt(item.getDataValue('count')),
      value: parseFloat(item.getDataValue('value') || 0)
    }));
    
    return {
      inventoryItems: totalItems || 0,
      lowStockItems: lowStockItems || 0,
      inventoryValue: inventoryValue || 0,
      inventoryByCategory: formattedCategories
    };
  } catch (error) {
    console.error("Error getting inventory metrics:", error);
    return {
      inventoryItems: 0,
      lowStockItems: 0,
      inventoryValue: 0,
      inventoryByCategory: []
    };
  }
}

/**
 * Get party metrics with date filtering support
 */
async function getPartyMetrics(startDate = null, endDate = null) {
  try {
    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = ` AND "sentDate" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = ` AND "sentDate" >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = ` AND "sentDate" <= '${endDate}'`;
    }
    
    // Get party statistics with date filter
    const [partyStats] = await sequelize.query(`
      SELECT
        COUNT(DISTINCT INITCAP(TRIM("partyName"))) AS "totalParties",
        COUNT(DISTINCT CASE WHEN "arrivalDate" IS NULL THEN INITCAP(TRIM("partyName")) END) AS "partiesWithPending",
        COUNT(DISTINCT CASE WHEN "isReprocessing" = true THEN INITCAP(TRIM("partyName")) END) AS "partiesWithReprocessing"
      FROM "DyeingRecords"
      WHERE "partyName" IS NOT NULL AND "partyName" != ''${dateFilter};
    `);
    
    // Calculate active parties (those with orders in the selected date range or last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let activeDateFilter = '';
    if (startDate && endDate) {
      activeDateFilter = ` AND "sentDate" BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      activeDateFilter = ` AND "sentDate" >= '${thirtyDaysAgo.toISOString().split('T')[0]}'`;
    }
    
    const [activePartiesResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT INITCAP(TRIM("partyName"))) AS "activeParties"
      FROM "DyeingRecords"
      WHERE "partyName" IS NOT NULL AND "partyName" != ''${activeDateFilter};
    `);
    
    // Get top parties by order volume
    const [topPartiesResult] = await sequelize.query(`
      SELECT 
        INITCAP(TRIM("partyName")) AS "name",
        COUNT(*) AS "ordersCount", 
        SUM(COALESCE("totalAmount", 0)) AS "totalValue",
        BOOL_OR("isReprocessing") AS "isReprocessing",
        BOOL_OR("arrivalDate" IS NULL) AS "hasPending"
      FROM "DyeingRecords"
      WHERE "partyName" IS NOT NULL AND "partyName" != ''${dateFilter}
      GROUP BY INITCAP(TRIM("partyName"))
      ORDER BY SUM(COALESCE("totalAmount", 0)) DESC
      LIMIT 5;
    `);
    
    // Format top parties data
    const topParties = topPartiesResult.map(party => ({
      name: party.name,
      ordersCount: parseInt(party.ordersCount),
      totalValue: parseFloat(party.totalValue || 0),
      status: party.isReprocessing ? 'reprocessing' : (party.hasPending ? 'pending' : 'active')
    }));
    
    return {
      totalParties: parseInt(partyStats[0]?.totalParties || 0),
      activeParties: parseInt(activePartiesResult[0]?.activeParties || 0),
      partiesWithPending: parseInt(partyStats[0]?.partiesWithPending || 0),
      partiesWithReprocessing: parseInt(partyStats[0]?.partiesWithReprocessing || 0),
      topParties
    };
  } catch (error) {
    console.error("Error getting party metrics:", error);
    return {
      totalParties: 0,
      activeParties: 0,
      partiesWithPending: 0,
      partiesWithReprocessing: 0,
      topParties: []
    };
  }
}

/**
 * Get production metrics with date and machine status filtering support
 */
async function getProductionMetrics(startDate = null, endDate = null, machineStatus = null) {
  try {
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      dateFilter.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      dateFilter.date = {
        [Op.lte]: endDate
      };
    } else {
      // Default to current month if no dates specified
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter.date = {
        [Op.gte]: startOfMonth.toISOString().split('T')[0]
      };
    }
    
    // Get total yarn production for the filtered period
    const totalProduction = await ASUProductionEntry.sum('actualProduction', {
      where: dateFilter
    });
    
    // Build machine status filter
    let machineFilter = {};
    if (machineStatus && machineStatus !== 'all') {
      switch (machineStatus) {
        case 'operational':
          machineFilter.isActive = true;
          break;
        case 'maintenance':
          machineFilter.isActive = false;
          machineFilter.maintenanceMode = true;
          break;
        case 'offline':
          machineFilter.isActive = false;
          machineFilter.maintenanceMode = false;
          break;
      }
    }
    
    // Get machine metrics
    const totalMachines = await ASUMachine.count();
    const activeMachines = await ASUMachine.count({
      where: {
        isActive: true,
        ...machineFilter
      }
    });
    
    // Get average efficiency with date filter
    let efficiencyDateFilter = '';
    if (startDate && endDate) {
      efficiencyDateFilter = ` AND "date" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      efficiencyDateFilter = ` AND "date" >= '${startDate}'`;
    } else if (endDate) {
      efficiencyDateFilter = ` AND "date" <= '${endDate}'`;
    } else {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      efficiencyDateFilter = ` AND "date" >= '${startOfMonth.toISOString().split('T')[0]}'`;
    }
    
    const [efficiencyResult] = await sequelize.query(`
      SELECT AVG(efficiency) AS "avgEfficiency"
      FROM "asu_production_entries"
      WHERE "efficiency" IS NOT NULL${efficiencyDateFilter};
    `);
    
    const avgEfficiency = parseFloat(efficiencyResult[0]?.avgEfficiency || 0);
    
    // Calculate total waste percentage
    const [wasteResult] = await sequelize.query(`
      SELECT 
        SUM(waste_percentage * actual_production) / SUM(actual_production) AS "avgWastePercentage"
      FROM "asu_production_entries"
      WHERE waste_percentage IS NOT NULL${efficiencyDateFilter};
    `);
    
    const wastePercentage = parseFloat((wasteResult[0]?.avgWastePercentage || 0).toFixed(2));
    
    return {
      yarnProduction: parseFloat(totalProduction || 0),
      totalMachines: totalMachines || 0,
      activeMachines: activeMachines || 0,
      averageEfficiency: parseFloat(avgEfficiency.toFixed(1)),
      wastePercentage
    };
  } catch (error) {
    console.error("Error getting production metrics:", error);
    return {
      yarnProduction: 0,
      totalMachines: 0,
      activeMachines: 0,
      averageEfficiency: 0,
      wastePercentage: 0
    };
  }
}

/**
 * Get time-series data for charts with date filtering support
 */
async function getTimeSeriesData(startDate = null, endDate = null) {
  try {
    // Calculate date range - default to last 7 days if not specified
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (startDate) {
      start = new Date(startDate);
      end = new Date();
    } else if (endDate) {
      end = new Date(endDate);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
    } else {
      // Default to last 7 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 6);
    }
    
    // Ensure we don't try to fetch too many days (limit to 31 days max)
    const maxDays = 31;
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff > maxDays) {
      // If more than max days, limit to last maxDays
      start = new Date(end);
      start.setDate(end.getDate() - (maxDays - 1));
    }
    
    // Format dates for SQL query
    const dates = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate array of dates in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const formattedDate = d.toISOString().split('T')[0];
      let label;
      
      // If range is more than 7 days, format as MM/DD
      if (daysDiff > 7) {
        label = `${d.getDate()} ${months[d.getMonth()]}`;
      } else {
        // Otherwise use day names
        label = daysOfWeek[d.getDay()];
      }
      
      dates.push({
        date: formattedDate,
        day: label
      });
    }
    
    // Get production data for each day
    const productionData = await Promise.all(dates.map(async (dateInfo) => {
      const [result] = await sequelize.query(`
        SELECT COALESCE(SUM(actual_production), 0) AS "dailyProduction"
        FROM "asu_production_entries"
        WHERE date = '${dateInfo.date}';
      `);
      
      return {
        date: dateInfo.date,
        day: dateInfo.day,
        production: parseFloat(result[0]?.dailyProduction || 0)
      };
    }));
    
    // Get efficiency data for each day
    const efficiencyData = await Promise.all(dates.map(async (dateInfo) => {
      const [result] = await sequelize.query(`
        SELECT COALESCE(AVG(efficiency), 0) AS "dailyEfficiency"
        FROM "asu_production_entries"
        WHERE date = '${dateInfo.date}' AND efficiency IS NOT NULL;
      `);
      
      return {
        date: dateInfo.date,
        day: dateInfo.day,
        efficiency: parseFloat(parseFloat(result[0]?.dailyEfficiency || 0).toFixed(1))
      };
    }));
    
    // Get waste percentage for each day
    const wasteData = await Promise.all(dates.map(async (dateInfo) => {
      const [result] = await sequelize.query(`
        SELECT COALESCE(AVG(waste_percentage), 0) AS "dailyWaste"
        FROM "asu_production_entries"
        WHERE date = '${dateInfo.date}' AND waste_percentage IS NOT NULL;
      `);
      
      return {
        date: dateInfo.date,
        day: dateInfo.day,
        waste: parseFloat(parseFloat(result[0]?.dailyWaste || 0).toFixed(1))
      };
    }));
    
    // Format the data for charts
    const daysWithData = productionData.map(day => day.day);
    const productionTrend = productionData.map(day => day.production);
    const efficiencyTrend = efficiencyData.map(day => day.efficiency);
    const wasteTrend = wasteData.map(day => day.waste);
    
    // Get actual financial data from DyeingRecords (revenue) and Costing (expenses)
    // First, determine the last 6 months range
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Create array of the past 6 months with year-month format for SQL
    const monthsForQuery = [];
    const monthLabels = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(currentYear, currentMonth - i, 1);
      const monthYearString = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;
      monthsForQuery.push(monthYearString);
      monthLabels.push(months[targetMonth.getMonth()]);
    }
    
    // Get revenue data from DyeingRecords (sum of total_amount by month)
    const [revenueData] = await sequelize.query(`
      SELECT 
        TO_CHAR(sent_date, 'YYYY-MM') AS month_year,
        SUM(COALESCE(total_amount, 0)) AS total_revenue
      FROM "DyeingRecords"
      WHERE TO_CHAR(sent_date, 'YYYY-MM') IN ('${monthsForQuery.join("','")}')
      GROUP BY TO_CHAR(sent_date, 'YYYY-MM')
      ORDER BY month_year ASC;
    `);
    
    // Get expense data from Costings table
    const [expenseData] = await sequelize.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') AS month_year,
        SUM(COALESCE(total_cost, 0)) AS total_expenses
      FROM "Costings" 
      WHERE TO_CHAR(created_at, 'YYYY-MM') IN ('${monthsForQuery.join("','")}')
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month_year ASC;
    `);
    
    // Create a map of month-year to revenue/expense for easy lookup
    const revenueMap = new Map();
    revenueData.forEach(item => {
      revenueMap.set(item.month_year, parseFloat(item.total_revenue));
    });
    
    const expenseMap = new Map();
    expenseData.forEach(item => {
      expenseMap.set(item.month_year, parseFloat(item.total_expenses));
    });
    
    // Prepare the final data arrays
    const revenueByMonth = monthsForQuery.map((monthYear, index) => ({
      month: monthLabels[index],
      amount: revenueMap.get(monthYear) || 0
    }));
    
    const expensesByMonth = monthsForQuery.map((monthYear, index) => ({
      month: monthLabels[index],
      amount: expenseMap.get(monthYear) || 0
    }));
    
    // Calculate total revenue and expenses
    const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expensesByMonth.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate profit margin
    const profitMargin = totalRevenue > 0 
      ? parseFloat(((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2))
      : 0;
      
    // Calculate predicted production and efficiency based on historical trends
    // Using a simple moving average prediction model
    let predictedProduction = 0;
    let predictedEfficiency = 0;
    
    if (productionTrend.length > 0) {
      // Get trend direction - are values generally increasing or decreasing?
      const trendSlope = productionTrend.length >= 3
        ? (productionTrend[productionTrend.length - 1] - productionTrend[0]) / productionTrend.length
        : 0;
        
      // Weighted average - recent days count more
      const total = productionTrend.reduce((sum, val, idx) => {
        return sum + val * (idx + 1);
      }, 0);
      const weights = productionTrend.reduce((sum, _, idx) => sum + idx + 1, 0);
      
      // Calculate baseline prediction
      const avgProduction = weights > 0 ? total / weights : productionTrend[productionTrend.length - 1];
      
      // Apply trend factor to get predicted value (with 5% trend effect)
      predictedProduction = Math.max(0, avgProduction + (trendSlope * avgProduction * 0.05));
    }
    
    if (efficiencyTrend.length > 0) {
      // Similar calculation for efficiency
      const trendSlope = efficiencyTrend.length >= 3
        ? (efficiencyTrend[efficiencyTrend.length - 1] - efficiencyTrend[0]) / efficiencyTrend.length
        : 0;
        
      const total = efficiencyTrend.reduce((sum, val, idx) => {
        return sum + val * (idx + 1);
      }, 0);
      const weights = efficiencyTrend.reduce((sum, _, idx) => sum + idx + 1, 0);
      
      const avgEfficiency = weights > 0 ? total / weights : efficiencyTrend[efficiencyTrend.length - 1];
      
      // Cap efficiency at 100%
      predictedEfficiency = Math.min(100, Math.max(0, avgEfficiency + (trendSlope * avgEfficiency * 0.03)));
    }
    
    return {
      daysWithData,
      productionTrend,
      efficiencyTrend,
      wasteTrend,
      revenueByMonth,
      expensesByMonth,
      profitMargin,
      predictedProduction: parseFloat(predictedProduction.toFixed(2)),
      predictedEfficiency: parseFloat(predictedEfficiency.toFixed(1))
    };
  } catch (error) {
    console.error("Error getting time-series data:", error);
    return {
      daysWithData: [],
      productionTrend: [],
      efficiencyTrend: [],
      wasteTrend: [],
      revenueByMonth: [],
      expensesByMonth: []
    };
  }
}

/**
 * Get machine performance data with filtering support
 */
async function getMachinePerformanceData(startDate = null, endDate = null, machineStatus = null) {
  try {
    // Build date filter for SQL query
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
          machineFilter = ' AND m."isActive" = true';
          break;
        case 'maintenance':
          machineFilter = ' AND m."isActive" = false AND m."maintenanceMode" = true';
          break;
        case 'offline':
          machineFilter = ' AND m."isActive" = false AND m."maintenanceMode" = false';
          break;
      }
    }
    
    // Get machine performance data
    const [machinePerformanceResults] = await sequelize.query(`
      SELECT 
        m.id, 
        m.name, 
        AVG(pe.efficiency) AS "avgEfficiency",
        m."isActive",
        m."maintenanceMode",
        TO_CHAR(m."lastMaintenance", 'YYYY-MM-DD') AS "lastMaintenance",
        COUNT(pe.id) AS "entriesCount",
        SUM(pe.actual_production) AS "totalProduction",
        AVG(pe.waste_percentage) AS "avgWaste"
      FROM "asu_machines" m
      LEFT JOIN "asu_production_entries" pe ON m.machine_no = pe.machine_no${dateFilter}
      WHERE 1=1${machineFilter}
      GROUP BY m.id, m.name, m."isActive", m."maintenanceMode", m."lastMaintenance"
      ORDER BY AVG(pe.efficiency) DESC NULLS LAST
      LIMIT 10;
    `);
    
    // Format machine performance data
    const machinePerformance = machinePerformanceResults.map(machine => {
      let status = 'operational';
      if (!machine.isActive) {
        status = machine.maintenanceMode ? 'maintenance' : 'offline';
      }
      
      return {
        id: machine.id,
        name: machine.name,
        efficiency: parseFloat(parseFloat(machine.avgEfficiency || 0).toFixed(1)),
        status,
        lastMaintenance: machine.lastMaintenance || 'N/A',
        entriesCount: parseInt(machine.entriesCount || 0),
        totalProduction: parseFloat(machine.totalProduction || 0),
        wastePercentage: parseFloat(parseFloat(machine.avgWaste || 0).toFixed(1))
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
}

/**
 * Get quality metrics data
 */
async function getQualityMetrics(startDate = null, endDate = null) {
  try {
    // Build date filter for SQL query
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
    
    // Get quality metrics - efficiency based metrics since waste_percentage doesn't exist
    const [qualityResults] = await sequelize.query(`
      SELECT
        AVG(CASE WHEN efficiency < 60 THEN 5.0 WHEN efficiency < 80 THEN 2.5 ELSE 1.0 END) AS "avgDefectRate",
        COUNT(*) FILTER (WHERE efficiency < 70) AS "highDefectEntries",
        COUNT(*) AS "totalEntries",
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
        m.name AS "machineName",
        TO_CHAR(pe.date, 'YYYY-MM-DD') AS "date",
        pe.waste_percentage AS "defectRate",
        pe.efficiency,
        pe.actual_production AS "production",
        pe.quality_grade AS "grade",
        pe.remarks
      FROM "asu_production_entries" pe
      JOIN "asu_machines" m ON pe.machine_no = m.machine_no
      WHERE pe.waste_percentage > 5${dateFilter}
      ORDER BY pe.date DESC, pe.waste_percentage DESC
      LIMIT 5;
    `);
    
    return {
      avgDefectRate: parseFloat(parseFloat(qualityResults[0]?.avgDefectRate || 0).toFixed(2)),
      highDefectCount: parseInt(qualityResults[0]?.highDefectEntries || 0),
      qualityDistribution,
      recentQualityIssues: recentIssues || [],
      totalQualityEntries: parseInt(qualityResults[0]?.totalEntries || 0),
      machinesWithQualityData: parseInt(qualityResults[0]?.machinesUsed || 0)
    };
  } catch (error) {
    console.error("Error getting quality metrics data:", error);
    return {
      avgDefectRate: 0,
      highDefectCount: 0,
      qualityDistribution: [],
      recentQualityIssues: [],
      totalQualityEntries: 0,
      machinesWithQualityData: 0
    };
  }
}

module.exports = {
  getDashboardStats
};
