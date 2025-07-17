// server/controllers/inventoryController.js
const Inventory = require('../models/InventoryPostgres'); // Use PostgreSQL model

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