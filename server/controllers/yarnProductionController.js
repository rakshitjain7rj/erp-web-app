const { Op, fn, col, literal } = require("sequelize");
const ASUProductionEntry = require("../models/ASUProductionEntry");
const ASUMachine = require("../models/ASUMachine");

/**
 * Get yarn production entries grouped by date and yarn type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getYarnProductionEntries = async (req, res) => {
  try {
    // Extract date range filters from query parameters
    const { dateFrom, dateTo } = req.query;
    const dateFilter = {};

    if (dateFrom || dateTo) {
      dateFilter.date = {};
      if (dateFrom) dateFilter.date[Op.gte] = dateFrom;
      if (dateTo) dateFilter.date[Op.lte] = dateTo;
    }

    // Get production entries with their associated machines
    const entries = await ASUProductionEntry.findAll({
      attributes: [
        "date",
        [fn("SUM", col("actual_production")), "productionKg"],
        [fn("AVG", col("efficiency")), "efficiency"],
        [
          fn("COUNT", literal('DISTINCT "ASUProductionEntry"."machine_no"')),
          "machineCount",
        ],
      ],
      include: [
        {
          model: ASUMachine,
          attributes: ["yarnType"],
          as: "machine",
          required: true,
        },
      ],
      where: dateFilter,
      group: ["date", "machine.yarn_type"],
      raw: true,
      nest: true,
    });

    // Transform the results into the desired format
    const dateMap = new Map();

    // Process each entry and group by date
    entries.forEach((entry) => {
      const { date, productionKg, efficiency, machineCount } = entry;
      const yarnType = entry.machine?.yarnType || "cotton";

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          yarnBreakdown: {}, // dynamic object for yarn types
          totalProduction: 0,
          machineCount: 0,
          efficiencies: [],
        });
      }

      const dateData = dateMap.get(date);
      const production = parseFloat(productionKg) || 0;

      // Add production by yarn type
      if (yarnType) {
        const type = yarnType.toLowerCase(); // normalize type
        if (!dateData.yarnBreakdown[type]) {
          dateData.yarnBreakdown[type] = 0;
        }
        dateData.yarnBreakdown[type] += production;
      }

      // Update totals
      dateData.totalProduction += production;

      // Track total machine count
      if (machineCount) {
        dateData.machineCount = Math.max(
          dateData.machineCount,
          parseInt(machineCount)
        );
      }

      // Add efficiency for averaging later
      if (efficiency !== null && efficiency !== undefined) {
        dateData.efficiencies.push(parseFloat(efficiency));
      }
    });

    // Convert the map to the final array format
    const result = Array.from(dateMap.values()).map((item) => {
      // Calculate average efficiency
      const avgEfficiency =
        item.efficiencies.length > 0
          ? item.efficiencies.reduce((sum, eff) => sum + eff, 0) /
            item.efficiencies.length
          : 0;

      return {
        date: item.date,
        yarnBreakdown: item.yarnBreakdown,
        totalProduction: parseFloat(item.totalProduction.toFixed(2)),
        machines: item.machineCount,
        avgEfficiency: parseFloat(avgEfficiency.toFixed(1)),
      };
    });

    // Sort by date in descending order
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching yarn production entries:", error);

    // Log SQL query error if available
    if (error.original && error.original.detail) {
      console.error("SQL Error:", error.original.detail);
    }

    // Send appropriate error response
    res.status(500).json({
      success: false,
      message: "Failed to fetch yarn production entries",
      error: error.message,
    });
  }
};

module.exports = {
  getYarnProductionEntries,
};
