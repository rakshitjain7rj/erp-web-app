/**
 * Production Summary Scheduler
 * Runs daily at 8 PM to send production, job completion,
 * and machine performance summaries via email and WhatsApp.
 */

// Use try-catch for optional dependencies
let cron, nodemailer;
try {
  cron = require('node-cron');
} catch (err) {
  console.warn('node-cron package not found. Scheduler functionality will be disabled.');
}

try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('nodemailer package not found. Email functionality will be disabled.');
}

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../config/postgres');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const ASUMachine = require('../models/ASUMachine');
const DyeingRecord = require('../models/DyeingRecord');
const Party = require('../models/Party');
const logger = require('../utils/logger');

// Create output directory for reports if it doesn't exist
const ensureReportDirectory = async () => {
  const reportDir = path.join(__dirname, '..', 'reports');
  try {
    await fs.mkdir(reportDir, { recursive: true });
    return reportDir;
  } catch (error) {
    logger.error('Error creating report directory:', error);
    throw error;
  }
};

/**
 * Email Configuration
 */
const createEmailTransporter = () => {
  if (!nodemailer) {
    logger.error('Cannot create email transporter: nodemailer package is not installed');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send Email with Summary
 */
const sendEmail = async (subject, htmlContent, attachments = []) => {
  // Check if nodemailer is available
  if (!nodemailer) {
    logger.error('Cannot send email: nodemailer package is not installed');
    return;
  }

  try {
    // Get notification settings to check if email is enabled and get recipients
    const settings = await getNotificationSettings();
    
    // Skip if email is disabled
    if (!settings.emailEnabled) {
      logger.info('Email notifications are disabled in settings, skipping email');
      return;
    }
    
    const transporter = createEmailTransporter();
    
    // Use recipients from settings, fallback to env vars, then default
    const recipientList = settings.emailRecipients ? 
      settings.emailRecipients.split(',') : 
      process.env.EMAIL_RECIPIENTS ? 
        process.env.EMAIL_RECIPIENTS.split(',') : 
        ['manager@example.com', 'admin@example.com'];

    try {
      const info = await transporter.sendMail({
        from: `"ERP System" <${process.env.EMAIL_USER}>`,
        to: recipientList.join(', '),
        subject: subject,
        html: htmlContent,
        attachments: attachments,
      });
      
      logger.info(`Email sent: ${info.messageId} to ${recipientList.join(', ')}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in email sending process:', error);
    return null;
  }
};

/**
 * Send WhatsApp message
 * Using a WhatsApp Business API provider
 */
const sendWhatsApp = async (message) => {
  // Get notification settings to check if WhatsApp is enabled and get recipients
  const settings = await getNotificationSettings();
  
  // Skip if WhatsApp is disabled
  if (!settings.whatsappEnabled) {
    logger.info('WhatsApp notifications are disabled in settings, skipping WhatsApp message');
    return;
  }
  
  // Skip if WhatsApp API key is not configured
  if (!process.env.WHATSAPP_API_KEY) {
    logger.warn('WhatsApp API key not configured, skipping WhatsApp notification');
    return;
  }

  // Use recipients from settings, fallback to env vars
  const phoneNumbers = settings.whatsappRecipients ? 
    settings.whatsappRecipients.split(',') : 
    process.env.WHATSAPP_RECIPIENTS ? 
      process.env.WHATSAPP_RECIPIENTS.split(',') : 
      [];

  if (phoneNumbers.length === 0) {
    logger.warn('No WhatsApp recipients configured, skipping WhatsApp notification');
    return;
  }

  try {
    // This is an example using a generic WhatsApp Business API
    // Replace with your actual WhatsApp Business API provider's implementation
    for (const phoneNumber of phoneNumbers) {
      await axios.post(
        'https://api.whatsapp-provider.com/v1/messages',
        {
          recipient: phoneNumber,
          type: 'text',
          message: message,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      logger.info(`WhatsApp message sent to ${phoneNumber}`);
    }
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    // Don't throw error here - we want to continue if WhatsApp fails but email succeeds
  }
};

/**
 * Generate production summary data
 */
const getProductionSummary = async () => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates as YYYY-MM-DD
    const todayFormatted = today.toISOString().split('T')[0];
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];

    // Get ASU Production data
    const asuProduction = await ASUProductionEntry.findAll({
      where: {
        date: yesterdayFormatted,
      },
      include: [
        { model: ASUMachine, as: 'machine' }
      ],
      raw: true,
      nest: true,
    });

    // Calculate ASU production metrics
    const productionByMachine = {};
    let totalProduction = 0;
    let totalEfficiency = 0;
    let machineCount = 0;

    asuProduction.forEach(entry => {
      if (!productionByMachine[entry.machine.name]) {
        productionByMachine[entry.machine.name] = {
          production: 0,
          efficiency: 0,
          entries: 0,
        };
      }
      
      productionByMachine[entry.machine.name].production += Number(entry.production_quantity);
      productionByMachine[entry.machine.name].efficiency += Number(entry.efficiency);
      productionByMachine[entry.machine.name].entries += 1;
      
      totalProduction += Number(entry.production_quantity);
      machineCount += 1;
    });

    // Calculate average efficiency for each machine
    Object.keys(productionByMachine).forEach(machine => {
      const machineData = productionByMachine[machine];
      machineData.efficiency = machineData.efficiency / machineData.entries;
      totalEfficiency += machineData.efficiency;
    });

    const avgEfficiency = machineCount > 0 ? totalEfficiency / Object.keys(productionByMachine).length : 0;

    // Get dyeing job completions
    const dyeingCompletions = await DyeingRecord.findAll({
      where: {
        completion_date: yesterdayFormatted,
      },
      include: [
        { model: Party, as: 'party' }
      ],
      raw: true,
      nest: true,
    });

    // Get machine performance data
    const machinePerformance = await ASUMachine.findAll({
      attributes: [
        'id', 
        'name', 
        'machine_number', 
        'status', 
        'efficiency_target',
        'last_maintenance_date'
      ],
      raw: true,
    });

    // Calculate machines needing maintenance (last maintenance > 30 days ago)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const machinesNeedingMaintenance = machinePerformance.filter(machine => {
      if (!machine.last_maintenance_date) return true;
      const maintenanceDate = new Date(machine.last_maintenance_date);
      return maintenanceDate < thirtyDaysAgo;
    });

    return {
      date: yesterdayFormatted,
      asuProduction: {
        totalProduction,
        avgEfficiency,
        productionByMachine,
        machineCount: Object.keys(productionByMachine).length,
      },
      dyeingJobs: {
        completed: dyeingCompletions.length,
        details: dyeingCompletions,
      },
      machinePerformance: {
        total: machinePerformance.length,
        active: machinePerformance.filter(m => m.status === 'active').length,
        needingMaintenance: machinesNeedingMaintenance.length,
        maintenanceList: machinesNeedingMaintenance,
      }
    };
  } catch (error) {
    logger.error('Error generating production summary:', error);
    throw error;
  }
};

/**
 * Generate HTML content for email
 */
const generateEmailHTML = (data) => {
  const {
    date,
    asuProduction,
    dyeingJobs,
    machinePerformance
  } = data;

  const formatNumber = (num) => {
    return Number(num).toFixed(2);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #205493; margin-bottom: 20px; }
        h2 { color: #2e78d2; margin-top: 30px; margin-bottom: 15px; }
        .summary-box { background-color: #f7f9fc; border-left: 4px solid #2e78d2; padding: 15px; margin-bottom: 20px; }
        .metric { margin-bottom: 5px; }
        .metric-label { font-weight: bold; color: #4a4a4a; }
        .metric-value { color: #205493; font-weight: bold; }
        .warning { color: #e74c3c; }
        .success { color: #27ae60; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Daily Production Summary - ${date}</h1>
        
        <div class="summary-box">
          <div class="metric">
            <span class="metric-label">Total Production:</span>
            <span class="metric-value">${formatNumber(asuProduction.totalProduction)} kg</span>
          </div>
          <div class="metric">
            <span class="metric-label">Average Efficiency:</span>
            <span class="metric-value">${formatNumber(asuProduction.avgEfficiency)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Active Machines:</span>
            <span class="metric-value">${machinePerformance.active} / ${machinePerformance.total}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Completed Dyeing Jobs:</span>
            <span class="metric-value">${dyeingJobs.completed}</span>
          </div>
        </div>
        
        <h2>ASU Production Details</h2>
        <table>
          <tr>
            <th>Machine</th>
            <th>Production (kg)</th>
            <th>Efficiency (%)</th>
          </tr>
          ${Object.entries(asuProduction.productionByMachine).map(([machine, data]) => `
            <tr>
              <td>${machine}</td>
              <td>${formatNumber(data.production)}</td>
              <td>${formatNumber(data.efficiency)}%</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Dyeing Jobs Completed</h2>
        ${dyeingJobs.completed > 0 ? `
          <table>
            <tr>
              <th>Order ID</th>
              <th>Party</th>
              <th>Fabric Type</th>
              <th>Quantity</th>
              <th>Color</th>
            </tr>
            ${dyeingJobs.details.map(job => `
              <tr>
                <td>${job.order_id}</td>
                <td>${job.party ? job.party.name : 'N/A'}</td>
                <td>${job.fabric_type || 'N/A'}</td>
                <td>${job.quantity || 0} ${job.unit || 'kg'}</td>
                <td>${job.color || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
        ` : '<p>No dyeing jobs completed yesterday.</p>'}
        
        <h2>Machine Maintenance</h2>
        ${machinePerformance.needingMaintenance > 0 ? `
          <p class="warning">⚠️ ${machinePerformance.needingMaintenance} machines need maintenance:</p>
          <table>
            <tr>
              <th>Machine</th>
              <th>Number</th>
              <th>Last Maintenance</th>
              <th>Status</th>
            </tr>
            ${machinePerformance.maintenanceList.map(machine => `
              <tr>
                <td>${machine.name}</td>
                <td>${machine.machine_number}</td>
                <td>${machine.last_maintenance_date || 'Never'}</td>
                <td>${machine.status}</td>
              </tr>
            `).join('')}
          </table>
        ` : '<p class="success">✅ All machines are within maintenance schedule.</p>'}
        
        <div class="footer">
          <p>This is an automated email from the ERP System. Please do not reply to this email.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text summary for WhatsApp
 */
const generateWhatsAppText = (data) => {
  const {
    date,
    asuProduction,
    dyeingJobs,
    machinePerformance
  } = data;

  return `
*Daily Production Summary - ${date}*

📊 *Overview*
- Total Production: ${Number(asuProduction.totalProduction).toFixed(2)} kg
- Average Efficiency: ${Number(asuProduction.avgEfficiency).toFixed(2)}%
- Active Machines: ${machinePerformance.active}/${machinePerformance.total}
- Completed Dyeing Jobs: ${dyeingJobs.completed}

${machinePerformance.needingMaintenance > 0 ? 
`⚠️ *Maintenance Required*
${machinePerformance.needingMaintenance} machines need maintenance.` : 
'✅ All machines are within maintenance schedule.'}

See email for complete details.
  `.trim();
};

/**
 * Generate and save CSV report
 */
const generateCSVReport = async (data, reportDir) => {
  const {
    date,
    asuProduction,
    dyeingJobs
  } = data;
  
  // Production CSV
  let productionCsv = 'Machine,Production (kg),Efficiency (%)\n';
  Object.entries(asuProduction.productionByMachine).forEach(([machine, machineData]) => {
    productionCsv += `${machine},${Number(machineData.production).toFixed(2)},${Number(machineData.efficiency).toFixed(2)}\n`;
  });
  
  // Dyeing CSV
  let dyeingCsv = 'Order ID,Party,Fabric Type,Quantity,Color\n';
  dyeingJobs.details.forEach(job => {
    dyeingCsv += `${job.order_id},${job.party ? job.party.name.replace(/,/g, ' ') : 'N/A'},${(job.fabric_type || 'N/A').replace(/,/g, ' ')},${job.quantity || 0} ${job.unit || 'kg'},${(job.color || 'N/A').replace(/,/g, ' ')}\n`;
  });
  
  // Write files
  const productionFilePath = path.join(reportDir, `production-${date}.csv`);
  const dyeingFilePath = path.join(reportDir, `dyeing-${date}.csv`);
  
  await fs.writeFile(productionFilePath, productionCsv);
  await fs.writeFile(dyeingFilePath, dyeingCsv);
  
  return {
    productionFilePath,
    dyeingFilePath
  };
};

/**
 * Main function to run the summary job
 */
const runDailySummary = async () => {
  logger.info('Starting daily production summary job');
  
  try {
    // Make sure the report directory exists
    const reportDir = await ensureReportDirectory();
    
    // Generate the summary data
    const summaryData = await getProductionSummary();
    
    // Generate CSV reports
    const csvFiles = await generateCSVReport(summaryData, reportDir);
    
    // Prepare email content
    const emailHtml = generateEmailHTML(summaryData);
    const emailSubject = `Daily Production Summary - ${summaryData.date}`;
    
    // Prepare email attachments
    const attachments = [
      {
        filename: `production-${summaryData.date}.csv`,
        path: csvFiles.productionFilePath
      },
      {
        filename: `dyeing-${summaryData.date}.csv`,
        path: csvFiles.dyeingFilePath
      }
    ];
    
    // Send email
    await sendEmail(emailSubject, emailHtml, attachments);
    
    // Send WhatsApp message
    const whatsAppText = generateWhatsAppText(summaryData);
    await sendWhatsApp(whatsAppText);
    
    logger.info('Daily production summary completed successfully');
  } catch (error) {
    logger.error('Error in daily production summary job:', error);
  }
};

/**
 * Get notification settings
 */
const getNotificationSettings = async () => {
  const settingsFilePath = path.join(__dirname, '..', 'config', 'notification-settings.json');
  
  try {
    const data = await fs.readFile(settingsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.warn('Settings file not found, using defaults');
    
    // Return default settings
    return {
      dailySummaryEnabled: true,
      emailEnabled: true,
      whatsappEnabled: false,
      emailRecipients: process.env.EMAIL_RECIPIENTS || "admin@example.com",
      whatsappRecipients: process.env.WHATSAPP_RECIPIENTS || "",
      scheduledTime: process.env.SCHEDULER_SUMMARY_TIME || "20:00",
    };
  }
};

/**
 * Initialize the scheduler
 */
const initializeScheduler = async () => {
  // Check if cron is available
  if (!cron) {
    logger.error('Cannot initialize scheduler: node-cron package is not installed');
    return;
  }

  try {
    // Get initial settings
    const settings = await getNotificationSettings();
    
    // Extract hour and minute from the time string (format: HH:MM)
    const scheduledTime = settings.scheduledTime || "20:00";
    const [hour, minute] = scheduledTime.split(':').map(Number);
    
    // Create cron schedule expressions
    const mainSchedule = `0 ${minute} ${hour} * * *`;
    const backupSchedule = `0 ${minute + 30 >= 60 ? minute + 30 - 60 : minute + 30} ${
      minute + 30 >= 60 ? (hour + 1) % 24 : hour
    } * * *`;

  logger.info(`Setting up scheduler for ${scheduledTime} (${mainSchedule})`);
  
  // Schedule main job
  let mainJob = cron.schedule(mainSchedule, async () => {
    const currentSettings = await getNotificationSettings();
    
    if (currentSettings.dailySummaryEnabled) {
      logger.info('Running scheduled production summary job');
      await runDailySummary();
    } else {
      logger.info('Daily summary reports are disabled in settings');
    }
  });
  
  // Schedule backup job (30 minutes after main job)
  let backupJob = cron.schedule(backupSchedule, async () => {
    const currentSettings = await getNotificationSettings();
    
    if (!currentSettings.dailySummaryEnabled) {
      logger.info('Daily summary reports are disabled, skipping backup check');
      return;
    }
    
    try {
      const reportDir = path.join(__dirname, '..', 'reports');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toISOString().split('T')[0];
      
      const productionReportPath = path.join(reportDir, `production-${yesterdayFormatted}.csv`);
      
      try {
        await fs.access(productionReportPath);
        logger.info('Daily production report exists, no need to rerun');
      } catch (err) {
        // File doesn't exist, rerun the report
        logger.warn('Production report not found, rerunning summary job');
        await runDailySummary();
      }
    } catch (error) {
      logger.error('Error in report verification job:', error);
    }
  });
  
  // Setup a watcher to check for settings changes every 5 minutes
  cron.schedule('0 */5 * * * *', async () => {
    const newSettings = await getNotificationSettings();
    const currentScheduledTime = settings.scheduledTime;
    
    // If the scheduled time has changed, update the cron jobs
    if (newSettings.scheduledTime !== currentScheduledTime) {
      logger.info(`Scheduled time changed from ${currentScheduledTime} to ${newSettings.scheduledTime}`);
      
      // Stop existing jobs
      mainJob.stop();
      backupJob.stop();
      
      // Update saved settings
      Object.assign(settings, newSettings);
      
      // Extract new hour and minute
      const [newHour, newMinute] = newSettings.scheduledTime.split(':').map(Number);
      
      // Create new cron schedule expressions
      const newMainSchedule = `0 ${newMinute} ${newHour} * * *`;
      const newBackupSchedule = `0 ${newMinute + 30 >= 60 ? newMinute + 30 - 60 : newMinute + 30} ${
        newMinute + 30 >= 60 ? (newHour + 1) % 24 : newHour
      } * * *`;
      
      // Create new jobs with updated schedules
      mainJob = cron.schedule(newMainSchedule, async () => {
        const currentSettings = await getNotificationSettings();
        
        if (currentSettings.dailySummaryEnabled) {
          logger.info('Running scheduled production summary job');
          await runDailySummary();
        } else {
          logger.info('Daily summary reports are disabled in settings');
        }
      });
      
      backupJob = cron.schedule(newBackupSchedule, async () => {
        // Same backup job logic
        const currentSettings = await getNotificationSettings();
        
        if (!currentSettings.dailySummaryEnabled) {
          logger.info('Daily summary reports are disabled, skipping backup check');
          return;
        }
        
        try {
          const reportDir = path.join(__dirname, '..', 'reports');
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayFormatted = yesterday.toISOString().split('T')[0];
          
          const productionReportPath = path.join(reportDir, `production-${yesterdayFormatted}.csv`);
          
          try {
            await fs.access(productionReportPath);
            logger.info('Daily production report exists, no need to rerun');
          } catch (err) {
            // File doesn't exist, rerun the report
            logger.warn('Production report not found, rerunning summary job');
            await runDailySummary();
          }
        } catch (error) {
          logger.error('Error in report verification job:', error);
        }
      });
      
      logger.info(`Rescheduled to ${newSettings.scheduledTime} (${newMainSchedule})`);
    }
  });
  
  logger.info('Production summary scheduler initialized');
};

// For manual testing
const runManualTest = async () => {
  logger.info('Running manual test of production summary');
  await runDailySummary();
};

// Check if required dependencies are available
const dependencyStatus = {
  cron: !!cron,
  nodemailer: !!nodemailer,
  ready: !!cron && !!nodemailer
};

// Log the dependency status
logger.info(`Scheduler dependency status: cron=${dependencyStatus.cron}, nodemailer=${dependencyStatus.nodemailer}`);
if (!dependencyStatus.ready) {
  logger.warn('⚠️ Some scheduler dependencies are missing. Full functionality will be limited.');
}

module.exports = {
  initializeScheduler,
  runManualTest,
  runDailySummary,
  dependencyStatus
};
