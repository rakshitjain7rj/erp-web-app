const asyncHandler = require("express-async-handler");
const DyeingRecord = require("../models/DyeingRecord");
const Party = require("../models/Party"); // New model for Party table
const { sequelize } = require('../config/postgres');

// ✅ Get all parties summary (main party dashboard data)
const getAllPartiesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, includeArchived } = req.query;
  let whereClause = 'WHERE "partyName" IS NOT NULL AND "partyName" != \'\'';
  
  // Filter out archived parties unless explicitly requested
  if (!includeArchived || includeArchived === 'false') {
    whereClause += ' AND "partyName" NOT IN (SELECT "name" FROM "Parties" WHERE "isArchived" = true)';
  }
  
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
      SUM(CASE WHEN "isReprocessing" = true THEN "quantity" ELSE 0 END) AS "reprocessingYarn",
      SUM(CASE WHEN "arrivalDate" IS NOT NULL AND "isReprocessing" = false THEN "quantity" ELSE 0 END) AS "arrivedYarn",
      MAX("sentDate") AS "lastOrderDate",
      MIN("sentDate") AS "firstOrderDate"
    FROM "DyeingRecords"
    ${whereClause}
    GROUP BY INITCAP(TRIM("partyName"))
    ORDER BY "pendingOrders" DESC, "totalOrders" DESC;
  `);

  res.status(200).json(results);
});

// ✅ Get archived parties summary
const getArchivedPartiesSummary = asyncHandler(async (req, res) => {
  try {
    // Get all archived parties from the Parties table
    const archivedParties = await Party.findAll({
      where: { isArchived: true },
      order: [['archivedAt', 'DESC']]
    });

    // For each archived party, get their historical data from DyeingRecords
    const archivedSummary = await Promise.all(
      archivedParties.map(async (party) => {
        const [results] = await sequelize.query(`
          SELECT
            INITCAP(TRIM("partyName")) AS "partyName",
            COUNT(*) AS "totalOrders",
            SUM("quantity") AS "totalYarn",
            SUM(CASE 
              WHEN "arrivalDate" IS NULL AND "isReprocessing" = false THEN "quantity"
              ELSE 0 
            END) AS "pendingYarn",
            SUM(CASE WHEN "isReprocessing" = true THEN "quantity" ELSE 0 END) AS "reprocessingYarn",
            SUM(CASE WHEN "arrivalDate" IS NOT NULL AND "isReprocessing" = false THEN "quantity" ELSE 0 END) AS "arrivedYarn",
            MAX("sentDate") AS "lastOrderDate",
            MIN("sentDate") AS "firstOrderDate"
          FROM "DyeingRecords"
          WHERE "partyName" ILIKE '%${party.name}%'
          GROUP BY INITCAP(TRIM("partyName"))
        `);

        return results[0] || {
          partyName: party.name,
          totalOrders: 0,
          totalYarn: 0,
          pendingYarn: 0,
          reprocessingYarn: 0,
          arrivedYarn: 0,
          lastOrderDate: null,
          firstOrderDate: null,
          archivedAt: party.archivedAt
        };
      })
    );

    // Filter out any null results and sort by archived date
    const validArchivedSummary = archivedSummary
      .filter(summary => summary)
      .sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));

    res.status(200).json(validArchivedSummary);
  } catch (error) {
    console.error('Error fetching archived parties:', error);
    res.status(500);
    throw new Error("Failed to fetch archived parties");
  }
});

// ✅ Get individual party details
const getPartyDetails = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

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

// 🆕 Create a new party and optionally insert into DyeingRecords
const createParty = asyncHandler(async (req, res) => {
  const {
    name,
    address,
    contact,
    dyeingFirm, // optional
  } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Party name is required");
  }

  const newParty = await Party.create({
    name: name.trim(),
    address,
    contact,
    dyeingFirm: dyeingFirm?.trim() || null,
  });

  if (dyeingFirm) {
    await DyeingRecord.create({
      partyName: name.trim(),
      dyeingFirm: dyeingFirm.trim(),
      quantity: 0.01,
      shade: "N/A",
      count: "N/A",
      lot: "AUTO-GEN",
      yarnType: "N/A",
      sentDate: new Date(),
      remarks: "Auto-created with party",
    });
  }

  res.status(201).json({
    message: "Party created successfully",
    party: newParty,
  });
});

// 🆕 Update an existing party
const updateParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;
  const {
    name,
    address,
    contact,
    dyeingFirm,
  } = req.body;

  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

  const existingParty = await Party.findOne({ where: { name: partyName } });
  if (!existingParty) {
    res.status(404);
    throw new Error("Party not found");
  }

  const updatedParty = await existingParty.update({
    name: name?.trim() || existingParty.name,
    address: address?.trim() || existingParty.address,
    contact: contact?.trim() || existingParty.contact,
    dyeingFirm: dyeingFirm?.trim() || existingParty.dyeingFirm,
  });

  res.status(200).json({
    message: "Party updated successfully",
    party: updatedParty,
  });
});

// 🆕 Delete a party
const deleteParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

  const existingParty = await Party.findOne({ where: { name: partyName } });
  if (!existingParty) {
    res.status(404);
    throw new Error("Party not found");
  }

  // Delete associated dyeing records first (optional - you might want to handle this differently)
  await DyeingRecord.destroy({ where: { partyName } });
  
  // Delete the party
  await existingParty.destroy();

  res.status(200).json({
    message: "Party deleted successfully",
    partyName,
  });
});

// 🆕 Archive a party (mark as archived instead of deleting) - PROFESSIONAL IMPLEMENTATION
const archiveParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  console.log(`🔄 ARCHIVE REQUEST: "${partyName}"`);

  if (!partyName || partyName.trim() === '') {
    console.log(`❌ Invalid party name: "${partyName}"`);
    res.status(400);
    throw new Error("Party name is required");
  }

  try {
    const cleanPartyName = partyName.trim();
    console.log(`🔍 Looking for party: "${cleanPartyName}"`);
    
    // Check if party already exists in Parties table
    let existingParty = await Party.findOne({ 
      where: { name: cleanPartyName }
    });
    
    if (existingParty) {
      console.log(`✅ Found existing party: ${existingParty.name}`);
      
      if (existingParty.isArchived) {
        console.log(`⚠️ Party already archived: ${existingParty.name}`);
        return res.status(400).json({
          message: "Party is already archived",
          party: existingParty
        });
      }
      
      // Archive the existing party
      const archivedParty = await existingParty.update({
        isArchived: true,
        archivedAt: new Date(),
      });
      
      console.log(`✅ Successfully archived existing party: ${archivedParty.name}`);
      return res.status(200).json({
        message: "Party archived successfully",
        party: archivedParty,
        success: true
      });
    } else {
      console.log(`📝 Party not found in Parties table, creating new entry for: "${cleanPartyName}"`);
      
      // Create new party entry and immediately archive it
      const newArchivedParty = await Party.create({
        name: cleanPartyName,
        isArchived: true,
        archivedAt: new Date(),
      });
      
      console.log(`✅ Successfully created and archived new party: ${newArchivedParty.name}`);
      return res.status(201).json({
        message: "Party created and archived successfully",
        party: newArchivedParty,
        success: true,
        note: "Party entry was created and immediately archived"
      });
    }
  } catch (error) {
    console.error(`❌ Archive operation failed for "${partyName}":`, error);
    console.error(`❌ Error details:`, error.message);
    console.error(`❌ Stack trace:`, error.stack);
    res.status(500);
    throw new Error(`Failed to archive party: ${error.message}`);
  }
});

// 🆕 Restore an archived party
const restoreParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

  // Find the archived party
  const existingParty = await Party.findOne({ where: { name: partyName, isArchived: true } });
  
  if (!existingParty) {
    res.status(404);
    throw new Error("Archived party not found");
  }

  // Restore the party by setting isArchived to false
  const restoredParty = await existingParty.update({
    isArchived: false,
    archivedAt: null,
  });

  res.status(200).json({
    message: "Party restored successfully",
    party: restoredParty,
  });
});

// 🆕 Export party data as JSON
const exportPartyAsJSON = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

  // Get party details
  const party = await Party.findOne({ where: { name: partyName } });
  if (!party) {
    res.status(404);
    throw new Error("Party not found");
  }

  // Get associated dyeing records
  const dyeingRecords = await DyeingRecord.findAll({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('partyName')), 
      'LIKE', 
      `%${partyName.toLowerCase()}%`
    ),
    order: [['sentDate', 'DESC']]
  });

  const exportData = {
    party: {
      name: party.name,
      address: party.address,
      contact: party.contact,
      dyeingFirm: party.dyeingFirm,
      createdAt: party.createdAt,
      updatedAt: party.updatedAt,
    },
    dyeingRecords: dyeingRecords.map(record => ({
      id: record.id,
      partyName: record.partyName,
      dyeingFirm: record.dyeingFirm,
      yarnType: record.yarnType,
      shade: record.shade,
      count: record.count,
      lot: record.lot,
      quantity: record.quantity,
      sentDate: record.sentDate,
      expectedArrivalDate: record.expectedArrivalDate,
      arrivalDate: record.arrivalDate,
      isReprocessing: record.isReprocessing,
      remarks: record.remarks,
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: 'ERP System'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${partyName}_data.json"`);
  res.status(200).json(exportData);
});

module.exports = {
  getAllPartiesSummary,
  getArchivedPartiesSummary,
  getPartyDetails,
  getAllPartyNames,
  getPartyStatistics,
  createParty,
  updateParty,
  deleteParty,
  archiveParty,
  restoreParty,
  exportPartyAsJSON,
};
