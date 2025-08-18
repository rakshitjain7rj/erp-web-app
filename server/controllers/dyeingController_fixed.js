const asyncHandler = require("express-async-handler");
const { sequelize } = require('../config/postgres');

// ✅ Create a new dyeing record with table auto-creation
const createDyeingRecord = asyncHandler(async (req, res) => {
  try {
    const {
      yarnType, sentDate, expectedArrivalDate, remarks,
      partyName, quantity, shade, count, lot, dyeingFirm
    } = req.body;

    console.log('🎯 Creating dyeing record with data:', req.body);

    // Create DyeingRecords table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "DyeingRecords" (
        "id" SERIAL PRIMARY KEY,
        "yarnType" VARCHAR(255) NOT NULL,
        "sentDate" TIMESTAMPTZ NOT NULL,
        "expectedArrivalDate" TIMESTAMPTZ,
        "arrivalDate" TIMESTAMPTZ,
        "partyName" VARCHAR(255) NOT NULL,
        "quantity" DECIMAL(10,2) NOT NULL,
        "shade" VARCHAR(255) NOT NULL,
        "count" VARCHAR(255) NOT NULL,
        "lot" VARCHAR(255) NOT NULL,
        "dyeingFirm" VARCHAR(255) NOT NULL,
        "remarks" TEXT,
        "status" VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Insert the record
    const [results] = await sequelize.query(`
      INSERT INTO "DyeingRecords" (
        "yarnType", "sentDate", "expectedArrivalDate", 
        "partyName", "quantity", "shade", "count", "lot", 
        "dyeingFirm", "remarks", "createdAt", "updatedAt"
      ) VALUES (
        :yarnType, :sentDate, :expectedArrivalDate,
        :partyName, :quantity, :shade, :count, :lot,
        :dyeingFirm, :remarks, NOW(), NOW()
      ) RETURNING *;
    `, {
      replacements: {
        yarnType, sentDate, expectedArrivalDate,
        partyName, quantity, shade, count, lot,
        dyeingFirm, remarks
      }
    });

    console.log('✅ Dyeing record created successfully:', results[0]);
    res.status(201).json(results[0]);

  } catch (error) {
    console.error('❌ Error creating dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to create dyeing record', 
      error: error.message 
    });
  }
});

// ✅ Get all dyeing records
const getAllDyeingRecords = asyncHandler(async (req, res) => {
  try {
    // Create table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "DyeingRecords" (
        "id" SERIAL PRIMARY KEY,
        "yarnType" VARCHAR(255) NOT NULL,
        "sentDate" TIMESTAMPTZ NOT NULL,
        "expectedArrivalDate" TIMESTAMPTZ,
        "arrivalDate" TIMESTAMPTZ,
        "partyName" VARCHAR(255) NOT NULL,
        "quantity" DECIMAL(10,2) NOT NULL,
        "shade" VARCHAR(255) NOT NULL,
        "count" VARCHAR(255) NOT NULL,
        "lot" VARCHAR(255) NOT NULL,
        "dyeingFirm" VARCHAR(255) NOT NULL,
        "remarks" TEXT,
        "status" VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const [records] = await sequelize.query('SELECT * FROM "DyeingRecords" ORDER BY "createdAt" DESC');
    res.status(200).json(records);
  } catch (error) {
    console.error('❌ Error fetching dyeing records:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch dyeing records', 
      error: error.message 
    });
  }
});

// ✅ Get dyeing record by ID
const getDyeingRecordById = asyncHandler(async (req, res) => {
  try {
    const [records] = await sequelize.query(
      'SELECT * FROM "DyeingRecords" WHERE id = :id',
      { replacements: { id: req.params.id } }
    );

    if (records.length === 0) {
      return res.status(404).json({ message: "Dyeing record not found" });
    }

    res.status(200).json(records[0]);
  } catch (error) {
    console.error('❌ Error fetching dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch dyeing record', 
      error: error.message 
    });
  }
});

// ✅ Update dyeing record
const updateDyeingRecord = asyncHandler(async (req, res) => {
  try {
    const {
      yarnType, sentDate, expectedArrivalDate, remarks,
      partyName, quantity, shade, count, lot, dyeingFirm
    } = req.body;

    const [results] = await sequelize.query(`
      UPDATE "DyeingRecords" 
      SET 
        "yarnType" = :yarnType,
        "sentDate" = :sentDate,
        "expectedArrivalDate" = :expectedArrivalDate,
        "partyName" = :partyName,
        "quantity" = :quantity,
        "shade" = :shade,
        "count" = :count,
        "lot" = :lot,
        "dyeingFirm" = :dyeingFirm,
        "remarks" = :remarks,
        "updatedAt" = NOW()
      WHERE id = :id
      RETURNING *;
    `, {
      replacements: {
        id: req.params.id,
        yarnType, sentDate, expectedArrivalDate,
        partyName, quantity, shade, count, lot,
        dyeingFirm, remarks
      }
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "Dyeing record not found" });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('❌ Error updating dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to update dyeing record', 
      error: error.message 
    });
  }
});

// ✅ Delete dyeing record
const deleteDyeingRecord = asyncHandler(async (req, res) => {
  try {
    const [results] = await sequelize.query(
      'DELETE FROM "DyeingRecords" WHERE id = :id RETURNING *',
      { replacements: { id: req.params.id } }
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Dyeing record not found" });
    }

    res.status(200).json({ message: "Dyeing record deleted successfully" });
  } catch (error) {
    console.error('❌ Error deleting dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to delete dyeing record', 
      error: error.message 
    });
  }
});

module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord,
  deleteDyeingRecord,
};
