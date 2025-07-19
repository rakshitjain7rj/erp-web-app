const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { validateToken, requireAdmin } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Path to settings file
const SETTINGS_FILE_PATH = path.join(__dirname, '..', 'config', 'notification-settings.json');

/**
 * Ensure the settings file exists
 */
const ensureSettingsFile = async () => {
  try {
    await fs.access(SETTINGS_FILE_PATH);
  } catch (error) {
    // File doesn't exist, create it with default settings
    const defaultSettings = {
      dailySummaryEnabled: true,
      emailEnabled: true,
      whatsappEnabled: false,
      emailRecipients: "admin@example.com",
      whatsappRecipients: "",
      scheduledTime: "20:00",
      updatedAt: new Date().toISOString(),
    };
    
    await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    await fs.writeFile(
      SETTINGS_FILE_PATH,
      JSON.stringify(defaultSettings, null, 2),
      'utf8'
    );
    
    logger.info('Created default notification settings file');
    return defaultSettings;
  }
};

/**
 * Get notification settings
 */
router.get('/notifications', validateToken, requireAdmin, async (req, res) => {
  try {
    await ensureSettingsFile();
    const fileContent = await fs.readFile(SETTINGS_FILE_PATH, 'utf8');
    const settings = JSON.parse(fileContent);
    
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error getting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting notification settings',
      error: error.message,
    });
  }
});

/**
 * Update notification settings
 */
router.post('/notifications', validateToken, requireAdmin, async (req, res) => {
  try {
    await ensureSettingsFile();
    
    const {
      dailySummaryEnabled,
      emailEnabled,
      whatsappEnabled,
      emailRecipients,
      whatsappRecipients,
      scheduledTime,
    } = req.body;
    
    // Validate required fields
    if (dailySummaryEnabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'dailySummaryEnabled is required',
      });
    }
    
    // Prepare updated settings
    const updatedSettings = {
      dailySummaryEnabled,
      emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
      whatsappEnabled: whatsappEnabled !== undefined ? whatsappEnabled : false,
      emailRecipients: emailRecipients || '',
      whatsappRecipients: whatsappRecipients || '',
      scheduledTime: scheduledTime || '20:00',
      updatedAt: new Date().toISOString(),
    };
    
    // Save updated settings
    await fs.writeFile(
      SETTINGS_FILE_PATH,
      JSON.stringify(updatedSettings, null, 2),
      'utf8'
    );
    
    // Update environment variables
    process.env.EMAIL_RECIPIENTS = updatedSettings.emailRecipients;
    process.env.WHATSAPP_RECIPIENTS = updatedSettings.whatsappRecipients;
    process.env.SCHEDULER_ENABLED = updatedSettings.dailySummaryEnabled.toString();
    process.env.SCHEDULER_SUMMARY_TIME = updatedSettings.scheduledTime;
    
    logger.info('Updated notification settings', { user: req.user.name });
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    logger.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings',
      error: error.message,
    });
  }
});

module.exports = router;
