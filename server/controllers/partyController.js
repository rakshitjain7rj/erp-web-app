const asyncHandler = require("express-async-handler");
const DyeingRecord = require("../models/DyeingRecord");
const { sequelize } = require('../config/postgres');

// ✅ Get all parties summary (main party dashboard data)
const getAllPartiesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let whereClause = 'WHERE "partyName" IS NOT NULL AND "partyName" != \'\'';
  if (startDate && endDate) {
    whereClause += ` AND "sentDate" BETWEEN '${startDate}' AND '${endDate}'`;
  } else if (startDate) {
    whereClause += ` AND "sentDate" >= '${startDate}'`;
  } else if (endDate) {
    whereClause += ` AND "sentDate" <= '${endDate}'`;
  }
  const [results] = await sequelize.query(`
    SELECT
      INITCAP(TRIM("partyName")) AS "partyName",
      COUNT(*) AS "totalOrders",
      SUM(CASE WHEN "arrivalDate" IS NULL AND "isReprocessing" = false THEN 1 ELSE 0 END) AS "pendingOrders",
      SUM("quantity") AS "totalYarn",
      SUM(CASE 
        WHEN "arrivalDate" IS NULL AND "isReprocessing" = false THEN "quantity"
        ELSE 0 
      END) AS "pendingYarn",
      SUM(CASE WHEN "isReprocessing" = true THEN "quantity" ELSE 0 END) AS "reprocessingYarn",      SUM(CASE WHEN "arrivalDate" IS NOT NULL AND "isReprocessing" = false THEN "quantity" ELSE 0 END) AS "arrivedYarn",
      MAX("sentDate") AS "lastOrderDate",
      MIN("sentDate") AS "firstOrderDate"
    FROM "DyeingRecords"
    ${whereClause}
    GROUP BY INITCAP(TRIM("partyName"))
    ORDER BY "pendingOrders" DESC, "totalOrders" DESC;
  `);

  res.status(200).json(results);
});

// ✅ Get individual party details
const getPartyDetails = asyncHandler(async (req, res) => {
  const { partyName } = req.params;
  
  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

  // Get all orders for this party
  const orders = await DyeingRecord.findAll({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('partyName'))),
      partyName.toLowerCase().trim()
    ),
    order: [['sentDate', 'DESC']]
  });

  if (orders.length === 0) {
    res.status(404);
    throw new Error("Party not found");
  }

  // Calculate summary for this party
  const summary = {
    partyName: orders[0].partyName,
    totalOrders: orders.length,
    totalYarn: orders.reduce((sum, order) => sum + parseFloat(order.quantity || 0), 0),
    pendingYarn: orders
      .filter(order => !order.arrivalDate && !order.isReprocessing)
      .reduce((sum, order) => sum + parseFloat(order.quantity || 0), 0),
    reprocessingYarn: orders
      .filter(order => order.isReprocessing)
      .reduce((sum, order) => sum + parseFloat(order.quantity || 0), 0),
    arrivedYarn: orders
      .filter(order => order.arrivalDate && !order.isReprocessing)
      .reduce((sum, order) => sum + parseFloat(order.quantity || 0), 0),
    firstOrderDate: orders[orders.length - 1].sentDate,
    lastOrderDate: orders[0].sentDate
  };

  res.status(200).json({
    summary,
    orders
  });
});

// ✅ Get all unique party names
const getAllPartyNames = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT DISTINCT INITCAP(TRIM("partyName")) AS "partyName"
    FROM "DyeingRecords"
    WHERE "partyName" IS NOT NULL AND "partyName" != ''
    ORDER BY "partyName";
  `);

  res.status(200).json(results);
});

// ✅ Get party statistics (for dashboard)
const getPartyStatistics = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT
      COUNT(DISTINCT INITCAP(TRIM("partyName"))) AS "totalParties",
      COUNT(DISTINCT CASE WHEN "arrivalDate" IS NULL THEN INITCAP(TRIM("partyName")) END) AS "partiesWithPending",
      COUNT(DISTINCT CASE WHEN "isReprocessing" = true THEN INITCAP(TRIM("partyName")) END) AS "partiesWithReprocessing",
      COUNT(DISTINCT CASE WHEN "arrivalDate" IS NOT NULL AND "isReprocessing" = false THEN INITCAP(TRIM("partyName")) END) AS "partiesWithCompleted"
    FROM "DyeingRecords"
    WHERE "partyName" IS NOT NULL AND "partyName" != '';
  `);

  res.status(200).json(results[0]);
});

module.exports = {
  getAllPartiesSummary,
  getPartyDetails,
  getAllPartyNames,
  getPartyStatistics,
};
