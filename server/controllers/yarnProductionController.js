// server/controllers/yarnProductionController.js
const { Op, fn, col, literal } = require("sequelize");
const ASUProductionEntry = require("../models/ASUProductionEntry");
const ASUMachine = require("../models/ASUMachine");
const { sequelize } = require('../config/postgres');

/**
 * Get yarn production entries grouped by date and yarn type
 */
const getYarnProductionEntries = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.date = {};
      if (dateFrom) dateFilter.date[Op.gte] = dateFrom;
      if (dateTo) dateFilter.date[Op.lte] = dateTo;
    }

    // Use raw SQL query to avoid issues with column names
    const query = `
      SELECT 
        "ASUProductionEntry".date,
        SUM("ASUProductionEntry".actual_production) AS "productionKg",
        AVG("ASUProductionEntry".efficiency) AS "efficiency",
        COUNT(DISTINCT "ASUProductionEntry".machine_no) AS "machineCount",
        "machine"."yarn_type" AS "yarnType"
      FROM 
        "asu_production_entries" AS "ASUProductionEntry"
      LEFT JOIN 
        "asu_machines" AS "machine" 
        ON "ASUProductionEntry".machine_no = "machine".machine_no
      ${(dateFrom || dateTo) ? 'WHERE' : ''}
        ${dateFrom ? `"ASUProductionEntry".date >= '${dateFrom}'` : ''}
        ${dateFrom && dateTo ? 'AND' : ''}
        ${dateTo ? `"ASUProductionEntry".date <= '${dateTo}'` : ''}
      GROUP BY 
        "ASUProductionEntry".date, 
        "machine"."yarn_type"
    `;

    const entries = await sequelize.query(query, { 
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    // Yarn type normalization map
    const normalizeYarnType = (type) => {
      if (!type) return "unknown";
      
      // Trim and convert to lowercase
      const normalized = type.trim().toLowerCase();
      
      // Define common yarn types for consistent mapping
      const yarnTypeMap = {
        'cotton': 'cotton',
        'sharp cotton': 'sharp cotton', 
        'sharpcotton': 'sharp cotton',
        'cotton sharp': 'sharp cotton',
        'mixture': 'mixture',
        'mix': 'mixture',
        'polyester': 'polyester',
        'poly': 'polyester',
        'poly/cotton': 'polyester cotton blend',
        'poly cotton': 'polyester cotton blend',
        'cotton/poly': 'polyester cotton blend',
        'cotton poly': 'polyester cotton blend',
        'blend': 'blended',
        'blended': 'blended'
      };

      // Try direct mapping first
      if (yarnTypeMap[normalized]) {
        return yarnTypeMap[normalized];
      }

      // Try partial matches for complex types
      for (const [key, value] of Object.entries(yarnTypeMap)) {
        if (normalized.includes(key)) {
          return value;
        }
      }
      
      // If no match found, return the trimmed lowercase version
      return normalized;
    };

    const dateMap = new Map();

    entries.forEach((entry) => {
      const { date, productionKg, efficiency, machineCount } = entry;
      const yarnType = normalizeYarnType(entry.yarnType);
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          yarnBreakdown: {},
          totalProduction: 0,
          machineCount: 0,
          efficiencies: []
        });
      }

      const dateData = dateMap.get(date);
      const prod = parseFloat(productionKg) || 0;

      dateData.yarnBreakdown[yarnType] = (dateData.yarnBreakdown[yarnType] || 0) + prod;
      dateData.totalProduction += prod;
      dateData.machineCount = Math.max(dateData.machineCount, parseInt(machineCount || 0));

      if (efficiency !== null && efficiency !== undefined) {
        dateData.efficiencies.push(parseFloat(efficiency));
      }
    });

    const result = Array.from(dateMap.values()).map((entry) => {
      const avgEff = entry.efficiencies.length > 0
        ? entry.efficiencies.reduce((a, b) => a + b, 0) / entry.efficiencies.length
        : 0;

      return {
        date: entry.date,
        yarnBreakdown: entry.yarnBreakdown,
        totalProduction: parseFloat(entry.totalProduction.toFixed(2)),
        machines: entry.machineCount,
        avgEfficiency: parseFloat(avgEff.toFixed(1))
      };
    });

    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Debug information
    console.log(`✅ Processed ${entries.length} yarn production entries into ${result.length} date groups`);
    if (result.length > 0) {
      console.log(`📊 Sample yarnBreakdown for ${result[0].date}:`, result[0].yarnBreakdown);
      console.log(`🧶 Found yarn types:`, [...new Set(result.flatMap(r => Object.keys(r.yarnBreakdown)))]);
    }

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("Error in getYarnProductionEntries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch yarn production data",
      error: error.message
    });
  }
};

module.exports = {
  getYarnProductionEntries
};
