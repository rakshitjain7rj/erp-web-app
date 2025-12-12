const asyncHandler = require("express-async-handler");
const DyeingRecord = require("../models/DyeingRecord");
const Party = require("../models/Party"); // New model for Party table
const { sequelize } = require('../config/postgres');

// ✅ Get all parties summary (main party dashboard data) - ONLY NON-ARCHIVED PARTIES
const getAllPartiesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, includeArchived } = req.query;
  
  console.log('🔍 Fetching parties summary...');
  console.log('📅 Date filters:', { startDate, endDate, includeArchived });
  
  // Base query filters
    let whereClause = 'WHERE dr."partyName" IS NOT NULL AND dr."partyName" != \'\'';  
  
  // 🚫 CRITICAL: Always exclude archived parties unless explicitly requested
  if (!includeArchived || includeArchived === 'false') {
    whereClause += ` AND UPPER(TRIM("partyName")) NOT IN (
      SELECT UPPER(TRIM("name")) FROM "Parties" 
      WHERE "isArchived" = true
    )`;
    console.log('🚫 Excluding archived parties from results (case-insensitive)');
  } else {
    console.log('⚠️ Including archived parties (includeArchived=true)');
  }
  
  // Date range filters
  if (startDate && endDate) {
    whereClause += ` AND "sentDate" BETWEEN '${startDate}' AND '${endDate}'`;
  } else if (startDate) {
    whereClause += ` AND "sentDate" >= '${startDate}'`;
  } else if (endDate) {
    whereClause += ` AND "sentDate" <= '${endDate}'`;
  }
  
  console.log('🔍 Final WHERE clause:', whereClause);

  // Build a where clause for CountProducts (date filter on completedDate if provided)
  let countWhere = `WHERE cp."partyName" IS NOT NULL AND cp."partyName" != ''`;
  if (startDate && endDate) {
    countWhere += ` AND cp."completedDate" BETWEEN '${startDate}' AND '${endDate}'`;
  } else if (startDate) {
    countWhere += ` AND cp."completedDate" >= '${startDate}'`;
  } else if (endDate) {
    countWhere += ` AND cp."completedDate" <= '${endDate}'`;
  }

  const [results] = await sequelize.query(`
    WITH s AS (
      SELECT
        INITCAP(TRIM(dr."partyName")) AS "partyName",
        COUNT(*) AS "totalOrders",
        SUM(CASE WHEN dr."arrivalDate" IS NULL AND dr."isReprocessing" = false THEN 1 ELSE 0 END) AS "pendingOrders",
        SUM(dr."quantity") AS "totalYarn",
        SUM(CASE 
          WHEN dr."arrivalDate" IS NULL AND dr."isReprocessing" = false THEN dr."quantity"
          ELSE 0 
        END) AS "pendingYarn",
        SUM(CASE WHEN dr."isReprocessing" = true THEN dr."quantity" ELSE 0 END) AS "reprocessingYarn",
        SUM(CASE WHEN dr."arrivalDate" IS NOT NULL AND dr."isReprocessing" = false THEN dr."quantity" ELSE 0 END) AS "arrivedYarn",
        MAX(dr."sentDate") AS "lastOrderDate",
        MIN(dr."sentDate") AS "firstOrderDate"
      FROM "DyeingRecords" dr
      ${whereClause}
      GROUP BY INITCAP(TRIM(dr."partyName"))
    ),
    cp_stats AS (
      SELECT
        INITCAP(TRIM(cp."partyName")) AS "partyName",
        COUNT(*) AS "totalOrders",
        SUM(CASE WHEN cp."received" = false AND cp."isReprocessing" = false THEN 1 ELSE 0 END) AS "pendingOrders",
        SUM(cp."quantity") AS "totalYarn",
        SUM(CASE 
          WHEN cp."received" = false AND cp."isReprocessing" = false THEN cp."quantity"
          ELSE 0 
        END) AS "pendingYarn",
        SUM(CASE WHEN cp."isReprocessing" = true THEN cp."quantity" ELSE 0 END) AS "reprocessingYarn",
        SUM(CASE WHEN cp."received" = true AND cp."isReprocessing" = false THEN cp."quantity" ELSE 0 END) AS "arrivedYarn",
        MAX(cp."sentDate") AS "lastOrderDate",
        MIN(cp."sentDate") AS "firstOrderDate"
      FROM "CountProducts" cp
      ${countWhere}
      GROUP BY INITCAP(TRIM(cp."partyName"))
    ),
    u AS (
      SELECT DISTINCT INITCAP(TRIM(dr."partyName")) AS "partyName"
      FROM "DyeingRecords" dr
      ${whereClause}
      UNION
      SELECT DISTINCT INITCAP(TRIM(cp."partyName")) AS "partyName"
      FROM "CountProducts" cp
      ${countWhere}
    )
    SELECT
      u."partyName",
      COALESCE(NULLIF(p."totalOrders", 0), COALESCE(s."totalOrders", 0) + COALESCE(cp_stats."totalOrders", 0), 0) AS "totalOrders",
      COALESCE(s."pendingOrders", 0) + COALESCE(cp_stats."pendingOrders", 0) AS "pendingOrders",
      COALESCE(NULLIF(p."totalYarn", 0), COALESCE(s."totalYarn", 0) + COALESCE(cp_stats."totalYarn", 0), 0) AS "totalYarn",
      COALESCE(NULLIF(p."pendingYarn", 0), COALESCE(s."pendingYarn", 0) + COALESCE(cp_stats."pendingYarn", 0), 0) AS "pendingYarn",
      COALESCE(NULLIF(p."reprocessingYarn", 0), COALESCE(s."reprocessingYarn", 0) + COALESCE(cp_stats."reprocessingYarn", 0), 0) AS "reprocessingYarn",
      COALESCE(NULLIF(p."arrivedYarn", 0), COALESCE(s."arrivedYarn", 0) + COALESCE(cp_stats."arrivedYarn", 0), 0) AS "arrivedYarn",
      GREATEST(s."lastOrderDate", cp_stats."lastOrderDate") AS "lastOrderDate",
      LEAST(s."firstOrderDate", cp_stats."firstOrderDate") AS "firstOrderDate"
    FROM u
    LEFT JOIN s ON u."partyName" = s."partyName"
    LEFT JOIN cp_stats ON u."partyName" = cp_stats."partyName"
    LEFT JOIN "Parties" p
      ON UPPER(TRIM(p."name")) = UPPER(TRIM(u."partyName")) AND (p."isArchived" = false OR p."isArchived" IS NULL)
    WHERE UPPER(TRIM(u."partyName")) NOT IN (
      SELECT UPPER(TRIM("name")) FROM "Parties" WHERE "isArchived" = true
    )
    ORDER BY "pendingOrders" DESC, "totalOrders" DESC;
  `);

  console.log(`✅ Found ${results.length} non-archived parties`);
  
  // Additional debug: List the party names being returned
  const partyNames = results.map(r => r.partyName);
  console.log('📋 Parties being returned:', partyNames);
  
  // Also check which parties are archived in the database
  const [archivedParties] = await sequelize.query(`
    SELECT "name" FROM "Parties" WHERE "isArchived" = true;
  `);
  console.log('🗂️ Currently archived parties in DB:', archivedParties.map(p => p.name));
  
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

    // For each archived party, get their historical data from DyeingRecords and include profile
    const archivedSummary = await Promise.all(
      archivedParties.map(async (party) => {
        const name = party.name || '';

        // 1) Totals from DyeingRecords by exact normalized name
        const [totalsRows] = await sequelize.query(`
          SELECT
            INITCAP(TRIM(dr."partyName")) AS "partyName",
            COUNT(*) AS "totalOrders",
            COALESCE(SUM(dr."quantity"), 0) AS "totalYarn",
            COALESCE(SUM(CASE 
              WHEN dr."arrivalDate" IS NULL AND dr."isReprocessing" = false THEN dr."quantity"
              ELSE 0 
            END), 0) AS "pendingYarn",
            COALESCE(SUM(CASE WHEN dr."isReprocessing" = true THEN dr."quantity" ELSE 0 END), 0) AS "reprocessingYarn",
            COALESCE(SUM(CASE WHEN dr."arrivalDate" IS NOT NULL AND dr."isReprocessing" = false THEN dr."quantity" ELSE 0 END), 0) AS "arrivedYarn",
            MAX(dr."sentDate") AS "lastOrderDate",
            MIN(dr."sentDate") AS "firstOrderDate"
          FROM "DyeingRecords" dr
          WHERE UPPER(TRIM(dr."partyName")) = UPPER(TRIM(:name))
          GROUP BY INITCAP(TRIM(dr."partyName"))
        `, { replacements: { name } });

        const recordTotals = totalsRows[0] || null;

        // 2) Dyeing firms from both DyeingRecords and CountProducts (exact OR partial normalized match)
        const [firmsRows] = await sequelize.query(`
          SELECT ARRAY(
            SELECT DISTINCT INITCAP(TRIM(x."dyeingFirm")) FROM (
              SELECT dr2."dyeingFirm"
              FROM "DyeingRecords" dr2
              WHERE dr2."dyeingFirm" IS NOT NULL AND dr2."dyeingFirm" != ''
                AND (
                  UPPER(TRIM(dr2."partyName")) = UPPER(TRIM(:name)) OR
                  UPPER(TRIM(dr2."partyName")) LIKE '%' || UPPER(TRIM(:name)) || '%'
                )
              UNION
              SELECT cp."dyeingFirm"
              FROM "CountProducts" cp
              WHERE cp."dyeingFirm" IS NOT NULL AND cp."dyeingFirm" != ''
                AND (
                  UPPER(TRIM(cp."partyName")) = UPPER(TRIM(:name)) OR
                  UPPER(TRIM(cp."partyName")) LIKE '%' || UPPER(TRIM(:name)) || '%'
                  OR UPPER(TRIM(cp."middleman")) = UPPER(TRIM(:name)) OR
                     UPPER(TRIM(cp."middleman")) LIKE '%' || UPPER(TRIM(:name)) || '%'
                )
            ) x
          ) AS "dyeingFirms";
        `, { replacements: { name } });

        const dyeingFirms = firmsRows?.[0]?.dyeingFirms || [];

        // Merge dyeing record totals with saved overrides in Parties table
        const merged = {
          partyName: (recordTotals && recordTotals.partyName) || party.name,
          totalOrders: Number(
            (party.totalOrders ?? 0) || (recordTotals ? recordTotals.totalOrders : 0)
          ),
          totalYarn: Number(
            (party.totalYarn != null ? party.totalYarn : null) ?? (recordTotals ? recordTotals.totalYarn : 0)
          ),
          pendingYarn: Number(
            (party.pendingYarn != null ? party.pendingYarn : null) ?? (recordTotals ? recordTotals.pendingYarn : 0)
          ),
          reprocessingYarn: Number(
            (party.reprocessingYarn != null ? party.reprocessingYarn : null) ?? (recordTotals ? recordTotals.reprocessingYarn : 0)
          ),
          arrivedYarn: Number(
            (party.arrivedYarn != null ? party.arrivedYarn : null) ?? (recordTotals ? recordTotals.arrivedYarn : 0)
          ),
          lastOrderDate: recordTotals ? recordTotals.lastOrderDate : null,
          firstOrderDate: recordTotals ? recordTotals.firstOrderDate : null,
          dyeingFirms,
        };

        return {
          ...merged,
          archivedAt: party.archivedAt,
          address: party.address || null,
          contact: party.contact || null,
          dyeingFirm: party.dyeingFirm || (Array.isArray(merged.dyeingFirms) && merged.dyeingFirms.length ? merged.dyeingFirms[0] : null),
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

// ✅ Get individual party details (fallback to Party overrides if no dyeing records)
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

  // If no dyeing records, try to return details from Parties table (overrides)
  if (orders.length === 0) {
    const partyRow = await Party.findOne({
      where: sequelize.where(
        sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('name'))),
        partyName.toUpperCase().trim()
      )
    });
    if (!partyRow) {
      // No records and no party row
      return res.status(404).json({ message: 'Party not found' });
    }
    return res.status(200).json({
      summary: {
        partyName: partyRow.name,
        totalOrders: partyRow.totalOrders ?? 0,
        totalYarn: Number(partyRow.totalYarn ?? 0),
        pendingYarn: Number(partyRow.pendingYarn ?? 0),
        reprocessingYarn: Number(partyRow.reprocessingYarn ?? 0),
        arrivedYarn: Number(partyRow.arrivedYarn ?? 0),
        firstOrderDate: null,
        lastOrderDate: null,
      },
      orders: [],
      party: {
        name: partyRow.name,
        address: partyRow.address,
        contact: partyRow.contact,
        dyeingFirm: partyRow.dyeingFirm,
      }
    });
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

  // Also fetch profile info from Parties table
  const partyRow = await Party.findOne({
    where: sequelize.where(
      sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('name'))),
      partyName.toUpperCase().trim()
    )
  });

  res.status(200).json({
    summary,
    orders,
    party: partyRow ? {
      name: partyRow.name,
      address: partyRow.address,
      contact: partyRow.contact,
      dyeingFirm: partyRow.dyeingFirm,
    } : undefined,
  });
});

// ✅ Get all unique party names
const getAllPartyNames = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT DISTINCT "partyName" FROM (
      SELECT INITCAP(TRIM("partyName")) AS "partyName"
      FROM "DyeingRecords"
      WHERE "partyName" IS NOT NULL AND "partyName" != ''
      UNION
      SELECT INITCAP(TRIM("name")) AS "partyName"
      FROM "Parties"
      WHERE "name" IS NOT NULL AND "name" != '' AND ("isArchived" = false OR "isArchived" IS NULL)
    ) AS combined_parties
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

  console.log('📝 Create Party Request:', { name, address, contact, dyeingFirm });

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

  console.log('✅ Party Created:', newParty.toJSON());

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

// 🆕 Update an existing party (case-insensitive; create if missing)
const updateParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;
  const {
    name,
    address,
    contact,
    dyeingFirm,
  totalOrders,
  totalYarn,
  pendingYarn,
  reprocessingYarn,
  arrivedYarn,
  } = req.body;

  console.log('📝 Update Party Request:', { partyName, body: req.body });

  if (!partyName) {
    res.status(400);
    throw new Error("Party name is required");
  }

  // Case-insensitive lookup
  let existingParty = await Party.findOne({
    where: sequelize.where(
      sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('name'))),
      partyName.toUpperCase().trim()
    )
  });

  if (!existingParty) {
    // Create if missing
    console.log('⚠️ Party not found, creating new:', partyName);
    const created = await Party.create({
      name: (name || partyName).trim(),
      address: address?.trim() || null,
      contact: contact?.trim() || null,
      dyeingFirm: dyeingFirm?.trim() || null,
      totalOrders: typeof totalOrders === 'number' ? totalOrders : null,
      totalYarn: typeof totalYarn === 'number' ? totalYarn : null,
      pendingYarn: typeof pendingYarn === 'number' ? pendingYarn : null,
      reprocessingYarn: typeof reprocessingYarn === 'number' ? reprocessingYarn : null,
      arrivedYarn: typeof arrivedYarn === 'number' ? arrivedYarn : null,
    });
    console.log('✅ Party Created (via Update):', created.toJSON());
    return res.status(200).json({ message: 'Party updated successfully', party: created });
  }

  const updatedParty = await existingParty.update({
    name: name ? name.trim() : existingParty.name,
    address: address !== undefined ? address : existingParty.address,
    contact: contact !== undefined ? contact : existingParty.contact,
    dyeingFirm: dyeingFirm !== undefined ? dyeingFirm : existingParty.dyeingFirm,
    // Optional editable totals; use provided values if not undefined/null
    totalOrders: typeof totalOrders === 'number' ? totalOrders : existingParty.totalOrders,
    totalYarn: typeof totalYarn === 'number' ? totalYarn : existingParty.totalYarn,
    pendingYarn: typeof pendingYarn === 'number' ? pendingYarn : existingParty.pendingYarn,
    reprocessingYarn: typeof reprocessingYarn === 'number' ? reprocessingYarn : existingParty.reprocessingYarn,
    arrivedYarn: typeof arrivedYarn === 'number' ? arrivedYarn : existingParty.arrivedYarn,
  });

  console.log('✅ Party Updated:', updatedParty.toJSON());

  res.status(200).json({
    message: "Party updated successfully",
    party: updatedParty,
  });
});

// 🆕 Delete a party
const deleteParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  if (!partyName || partyName.trim() === '') {
    return res.status(400).json({ message: 'Party name is required' });
  }

  const cleanName = partyName.trim();
  console.log(`🗑️ DELETE REQUEST (soft) for party: "${cleanName}"`);

  // Case-insensitive lookup (exact name match ignoring case & whitespace)
  const existingParty = await Party.findOne({
    where: sequelize.where(
      sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('name'))),
      cleanName.toUpperCase()
    )
  });

  if (!existingParty) {
    return res.status(404).json({ message: 'Party not found' });
  }

  // Start transaction to ensure atomic delete of related records
  const tx = await sequelize.transaction();
  try {
    const deletedRecords = await DyeingRecord.destroy({
      where: sequelize.where(
        sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('partyName'))),
        'LIKE',
        `%${cleanName.toUpperCase()}%`
      ),
      transaction: tx
    });

    await existingParty.destroy({ transaction: tx });
    await tx.commit();

    console.log(`✅ Deleted party "${cleanName}" and ${deletedRecords} dyeing records`);
    return res.status(200).json({
      message: 'Party deleted successfully',
      party: cleanName,
      deletedDyeingRecords: deletedRecords,
      success: true
    });
  } catch (err) {
    await tx.rollback();
    console.error(`❌ Delete failed for party "${cleanName}":`, err.message);
    return res.status(500).json({ message: 'Failed to delete party', error: err.message });
  }
});

// 🆕 Archive a party (mark as archived instead of deleting) - PROFESSIONAL IMPLEMENTATION
const archiveParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  console.log(`🔄 ARCHIVE REQUEST: "${partyName}"`);
  console.log('📋 Request details:', {
    partyName,
    originalUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

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
      console.log(`✅ Found existing party: ${existingParty.name} (isArchived: ${existingParty.isArchived})`);
      
      if (existingParty.isArchived) {
        console.log(`⚠️ Party already archived: ${existingParty.name}`);
        return res.status(400).json({
          message: "Party is already archived",
          party: existingParty,
          success: false
        });
      }
      
      // Archive the existing party
      const archivedParty = await existingParty.update({
        isArchived: true,
        archivedAt: new Date(),
      });
      
      console.log(`✅ Successfully archived existing party: ${archivedParty.name}`);
      console.log(`📊 Archive result:`, {
        id: archivedParty.id,
        name: archivedParty.name,
        isArchived: archivedParty.isArchived,
        archivedAt: archivedParty.archivedAt
      });
      
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
      console.log(`📊 New party details:`, {
        id: newArchivedParty.id,
        name: newArchivedParty.name,
        isArchived: newArchivedParty.isArchived,
        archivedAt: newArchivedParty.archivedAt
      });
      
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

// 🆕 Restore an archived party - PROFESSIONAL IMPLEMENTATION
const restoreParty = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  console.log(`🔄 RESTORE REQUEST: "${partyName}"`);
  console.log('📋 Request details:', {
    partyName,
    originalUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (!partyName || partyName.trim() === '') {
    console.log(`❌ Invalid party name: "${partyName}"`);
    res.status(400);
    throw new Error("Party name is required");
  }

  try {
    const cleanPartyName = partyName.trim();
    console.log(`🔍 Looking for archived party: "${cleanPartyName}"`);

    // Find the archived party
    const existingParty = await Party.findOne({ 
      where: { 
        name: cleanPartyName, 
        isArchived: true 
      } 
    });
    
    if (!existingParty) {
      console.log(`❌ Archived party not found: "${cleanPartyName}"`);
      res.status(404);
      throw new Error("Archived party not found");
    }

    console.log(`✅ Found archived party: ${existingParty.name} (archived at: ${existingParty.archivedAt})`);

    // Restore the party by setting isArchived to false
    const restoredParty = await existingParty.update({
      isArchived: false,
      archivedAt: null,
    });

    console.log(`✅ Successfully restored party: ${restoredParty.name}`);
    console.log(`📊 Restore result:`, {
      id: restoredParty.id,
      name: restoredParty.name,
      isArchived: restoredParty.isArchived,
      archivedAt: restoredParty.archivedAt
    });

    res.status(200).json({
      message: "Party restored successfully",
      party: restoredParty,
      success: true
    });
  } catch (error) {
    console.error(`❌ Restore operation failed for "${partyName}":`, error);
    console.error(`❌ Error details:`, error.message);
    res.status(500);
    throw new Error(`Failed to restore party: ${error.message}`);
  }
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

// 🆕 Export party data as CSV - PROFESSIONAL IMPLEMENTATION
const exportPartyAsCSV = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  console.log(`📊 CSV EXPORT REQUEST: "${partyName}"`);
  console.log('📋 Request details:', {
    partyName,
    originalUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (!partyName || partyName.trim() === '') {
    console.log(`❌ Invalid party name: "${partyName}"`);
    res.status(400);
    throw new Error("Party name is required");
  }

  try {
    const cleanPartyName = partyName.trim();
    console.log(`🔍 Looking for party: "${cleanPartyName}"`);

    // Get party details
    const party = await Party.findOne({ where: { name: cleanPartyName } });
    if (!party) {
      console.log(`❌ Party not found: "${cleanPartyName}"`);
      res.status(404);
      throw new Error("Party not found");
    }

    console.log(`✅ Found party: ${party.name}`);

    // Get associated dyeing records
    const dyeingRecords = await DyeingRecord.findAll({
      where: sequelize.where(
        sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('partyName'))), 
        'LIKE', 
        `%${cleanPartyName.toUpperCase()}%`
      ),
      order: [['sentDate', 'DESC']]
    });

    console.log(`📊 Found ${dyeingRecords.length} dyeing records for party`);

    // Create CSV content
    const csvHeaders = [
      'Party Name',
      'Dyeing Firm',
      'Yarn Type',
      'Shade',
      'Count',
      'Lot',
      'Quantity (kg)',
      'Sent Date',
      'Expected Arrival',
      'Actual Arrival',
      'Status',
      'Remarks'
    ];

    const csvRows = dyeingRecords.map(record => [
      record.partyName || '',
      record.dyeingFirm || '',
      record.yarnType || '',
      record.shade || '',
      record.count || '',
      record.lot || '',
      record.quantity || 0,
      record.sentDate ? new Date(record.sentDate).toLocaleDateString() : '',
      record.expectedArrivalDate ? new Date(record.expectedArrivalDate).toLocaleDateString() : '',
      record.arrivalDate ? new Date(record.arrivalDate).toLocaleDateString() : '',
      record.isReprocessing ? 'Reprocessing' : (record.arrivalDate ? 'Completed' : 'Pending'),
      record.remarks || ''
    ]);

    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ].join('\n');

    console.log(`✅ CSV export successful for party: ${party.name}`);
    console.log(`📊 Export statistics:`, {
      totalRecords: dyeingRecords.length,
      csvSize: csvContent.length,
      fileName: `${cleanPartyName}_data.csv`
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanPartyName}_data.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error(`❌ CSV export failed for "${partyName}":`, error);
    console.error(`❌ Error details:`, error.message);
    res.status(500);
    throw new Error(`Failed to export party data: ${error.message}`);
  }
});

// 🆕 Permanently delete a party - PROFESSIONAL IMPLEMENTATION
const deletePermanently = asyncHandler(async (req, res) => {
  const { partyName } = req.params;

  console.log(`🗑️ PERMANENT DELETE REQUEST: "${partyName}"`);
  console.log('📋 Request details:', {
    partyName,
    originalUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (!partyName || partyName.trim() === '') {
    console.log(`❌ Invalid party name: "${partyName}"`);
    res.status(400);
    throw new Error("Party name is required");
  }

  try {
    const cleanPartyName = partyName.trim();
    console.log(`🔍 Looking for party to delete: "${cleanPartyName}"`);

    // Find the party (archived or not)
    const existingParty = await Party.findOne({ 
      where: { name: cleanPartyName } 
    });
    
    if (!existingParty) {
      console.log(`❌ Party not found: "${cleanPartyName}"`);
      res.status(404);
      throw new Error("Party not found");
    }

    console.log(`✅ Found party: ${existingParty.name} (isArchived: ${existingParty.isArchived})`);

    // Get count of associated dyeing records for logging
    const dyeingRecordsCount = await DyeingRecord.count({
      where: sequelize.where(
        sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('partyName'))), 
        'LIKE', 
        `%${cleanPartyName.toUpperCase()}%`
      )
    });

    console.log(`📊 Found ${dyeingRecordsCount} associated dyeing records`);

    // Start transaction for safe deletion
    const transaction = await sequelize.transaction();

    try {
      // First, delete associated dyeing records
      if (dyeingRecordsCount > 0) {
        const deletedRecords = await DyeingRecord.destroy({
          where: sequelize.where(
            sequelize.fn('UPPER', sequelize.fn('TRIM', sequelize.col('partyName'))), 
            'LIKE', 
            `%${cleanPartyName.toUpperCase()}%`
          ),
          transaction
        });
        console.log(`🗑️ Deleted ${deletedRecords} dyeing records`);
      }

      // Then, delete the party itself
      await existingParty.destroy({ transaction });
      console.log(`🗑️ Deleted party: ${existingParty.name}`);

      // Commit transaction
      await transaction.commit();

      console.log(`✅ Permanent deletion successful for party: ${cleanPartyName}`);
      console.log(`📊 Deletion summary:`, {
        partyName: cleanPartyName,
        deletedDyeingRecords: dyeingRecordsCount,
        deletedAt: new Date().toISOString()
      });

      res.status(200).json({
        message: "Party permanently deleted successfully",
        deletedParty: cleanPartyName,
        deletedRecords: dyeingRecordsCount,
        success: true
      });
    } catch (transactionError) {
      // Rollback transaction on error
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error(`❌ Permanent deletion failed for "${partyName}":`, error);
    console.error(`❌ Error details:`, error.message);
    res.status(500);
    throw new Error(`Failed to permanently delete party: ${error.message}`);
  }
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
  exportPartyAsCSV,
  deletePermanently,
};
