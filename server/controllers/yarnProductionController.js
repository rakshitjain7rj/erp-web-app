// server/controllers/yarnProductionController.js
const { Op, fn, col, literal } = require("sequelize");
const ASUProductionEntry = require("../models/ASUProductionEntry");
const ASUMachine = require("../models/ASUMachine");

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

    const entries = await ASUProductionEntry.findAll({
      attributes: [
        "date",
        [fn("SUM", col("actual_production")), "productionKg"],
        [fn("AVG", col("efficiency")), "efficiency"],
        [fn("COUNT", literal('DISTINCT "ASUProductionEntry"."machine_no"')), "machineCount"]
      ],
      include: [
        {
          model: ASUMachine,
          attributes: ["yarnType"],
          as: "machine",
          required: true
        }
      ],
      where: dateFilter,
      group: ["date", "machine.yarnType"],
      raw: true,
      nest: true
    });

    const dateMap = new Map();

    entries.forEach((entry) => {
      const { date, productionKg, efficiency, machineCount } = entry;
      const yarnType = entry.machine?.yarnType?.toLowerCase() || "unknown";

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
