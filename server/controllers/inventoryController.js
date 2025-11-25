// server/controllers/inventoryController.js
const Inventory = require('../models/InventoryPostgres'); // Use PostgreSQL model
const StockLog = require('../models/StockLog');
const { sequelize } = require('../config/postgres');

const inventoryController = {
  create: async (req, res) => {
    try {
      console.log('Creating inventory item with data:', req.body);
      
      // Validate required fields
      const { productName, rawMaterial, effectiveYarn, count, initialQuantity } = req.body;
      if (!productName || !rawMaterial || !effectiveYarn || !count || !initialQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: productName, rawMaterial, effectiveYarn, count, initialQuantity',
        });
      }

      const inventory = await Inventory.create(req.body);
      
      console.log('Inventory item created successfully:', inventory.toJSON());
      res.status(201).json({
        success: true,
        data: inventory,
        message: 'Inventory item created successfully'
      });
    } catch (err) {
      console.error('Error creating inventory item:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create inventory item',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  getAll: async (req, res) => {
    try {
      console.log('Fetching all inventory items...');
      const inventory = await Inventory.findAll({
        order: [['createdAt', 'DESC']],
      });
      
      console.log(`Found ${inventory.length} inventory items`);
      res.status(200).json(inventory);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch inventory items',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const inventory = await Inventory.findByPk(id);
      
      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: inventory
      });
    } catch (err) {
      console.error('Error fetching inventory item:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch inventory item',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const [updatedRows] = await Inventory.update(req.body, {
        where: { id },
        returning: true,
      });
      
      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }
      
      const updatedInventory = await Inventory.findByPk(id);
      res.status(200).json({
        success: true,
        data: updatedInventory,
        message: 'Inventory item updated successfully'
      });
    } catch (err) {
      console.error('Error updating inventory item:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update inventory item',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Inventory.destroy({
        where: { id }
      });
      
      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Inventory item deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete inventory item',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  // Stock Management Methods
  addStock: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { quantity, date, remarks, source } = req.body;

      const inventory = await Inventory.findByPk(id, { transaction: t });
      if (!inventory) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      // Create log
      await StockLog.create({
        inventoryId: id,
        type: 'in',
        quantity,
        date,
        remarks,
        source
      }, { transaction: t });

      // Update inventory totals
      const newTotalIn = (Number(inventory.totalYarnIn) || 0) + Number(quantity);
      const currentQty = (Number(inventory.currentQuantity) || Number(inventory.initialQuantity) || 0) + Number(quantity);

      await inventory.update({
        totalYarnIn: newTotalIn,
        currentQuantity: currentQty,
        lastStockUpdate: new Date()
      }, { transaction: t });

      await t.commit();

      res.status(200).json({
        success: true,
        message: 'Stock added successfully',
        updatedItem: inventory
      });
    } catch (err) {
      await t.rollback();
      console.error('Error adding stock:', err);
      res.status(500).json({ success: false, message: 'Failed to add stock', error: err.message });
    }
  },

  removeStock: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { quantity, date, remarks, usagePurpose } = req.body;

      const inventory = await Inventory.findByPk(id, { transaction: t });
      if (!inventory) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      // Create log
      await StockLog.create({
        inventoryId: id,
        type: 'out',
        quantity,
        date,
        remarks,
        usagePurpose
      }, { transaction: t });

      // Update inventory totals
      const newTotalOut = (Number(inventory.totalYarnOut) || 0) + Number(quantity);
      const currentQty = (Number(inventory.currentQuantity) || Number(inventory.initialQuantity) || 0) - Number(quantity);

      await inventory.update({
        totalYarnOut: newTotalOut,
        currentQuantity: currentQty,
        lastStockUpdate: new Date()
      }, { transaction: t });

      await t.commit();

      res.status(200).json({
        success: true,
        message: 'Stock removed successfully',
        updatedItem: inventory
      });
    } catch (err) {
      await t.rollback();
      console.error('Error removing stock:', err);
      res.status(500).json({ success: false, message: 'Failed to remove stock', error: err.message });
    }
  },

  logSpoilage: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { quantity, date, remarks, reason } = req.body;

      const inventory = await Inventory.findByPk(id, { transaction: t });
      if (!inventory) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      // Create log
      await StockLog.create({
        inventoryId: id,
        type: 'spoilage',
        quantity,
        date,
        remarks,
        reason
      }, { transaction: t });

      // Update inventory totals
      const newTotalSpoiled = (Number(inventory.totalYarnSpoiled) || 0) + Number(quantity);
      const currentQty = (Number(inventory.currentQuantity) || Number(inventory.initialQuantity) || 0) - Number(quantity);

      await inventory.update({
        totalYarnSpoiled: newTotalSpoiled,
        currentQuantity: currentQty,
        lastStockUpdate: new Date()
      }, { transaction: t });

      await t.commit();

      res.status(200).json({
        success: true,
        message: 'Spoilage logged successfully',
        updatedItem: inventory
      });
    } catch (err) {
      await t.rollback();
      console.error('Error logging spoilage:', err);
      res.status(500).json({ success: false, message: 'Failed to log spoilage', error: err.message });
    }
  },

  getStockLogs: async (req, res) => {
    try {
      const { id } = req.params;
      const logs = await StockLog.findAll({
        where: { inventoryId: id },
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });
      res.status(200).json(logs);
    } catch (err) {
      console.error('Error fetching stock logs:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch stock logs', error: err.message });
    }
  },

  // Placeholder methods for advanced metrics
  getCurrentYarnBalance: async (req, res) => {
    try {
      // TODO: Implement yarn balance calculation
      res.status(200).json({ message: 'Yarn balance endpoint - to be implemented' });
    } catch (err) {
      console.error('Error getting yarn balance:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get yarn balance',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  getProductConsumption: async (req, res) => {
    try {
      // TODO: Implement product consumption calculation
      res.status(200).json({ message: 'Product consumption endpoint - to be implemented' });
    } catch (err) {
      console.error('Error getting product consumption:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get product consumption',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  getYarnPricing: async (req, res) => {
    try {
      // TODO: Implement yarn pricing calculation
      res.status(200).json({ message: 'Yarn pricing endpoint - to be implemented' });
    } catch (err) {
      console.error('Error getting yarn pricing:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get yarn pricing',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  getAuditLogs: async (req, res) => {
    try {
      // TODO: Implement audit logs fetching
      res.status(200).json({ message: 'Audit logs endpoint - to be implemented' });
    } catch (err) {
      console.error('Error getting audit logs:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get audit logs',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },
};

module.exports = inventoryController;