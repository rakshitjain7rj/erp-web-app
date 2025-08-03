/**
 * Logging utility for the server
 * Provides consistent logging format and can be extended to write to files
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Determine if we should log to files
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

// Create log directory if it doesn't exist and if logging to file is enabled
if (LOG_TO_FILE) {
  if (!fs.existsSync(LOG_DIR)) {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      console.log(`✅ Created log directory at ${LOG_DIR}`);
    } catch (err) {
      console.error(`❌ Failed to create log directory: ${err.message}`);
    }
  }
}

/**
 * Format a log message with timestamp and level
 */
function formatLogMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Write a log message to a file
 */
function writeToFile(level, message) {
  if (!LOG_TO_FILE) return;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const logFile = path.join(LOG_DIR, `${level.toLowerCase()}-${today}.log`);
  
  const formattedMessage = formatLogMessage(level, message);
  
  try {
    fs.appendFileSync(logFile, formattedMessage + '\n');
  } catch (err) {
    console.error(`❌ Failed to write to log file: ${err.message}`);
  }
}

/**
 * Log a message at a specific level
 */
function log(level, message, data = null) {
  const formattedMessage = formatLogMessage(level, message);
  
  // Log to console based on level
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage);
      if (data) console.error(data);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage);
      if (data) console.warn(data);
      break;
    case LOG_LEVELS.INFO:
      console.log(formattedMessage);
      if (data) console.log(data);
      break;
    case LOG_LEVELS.DEBUG:
      console.debug(formattedMessage);
      if (data) console.debug(data);
      break;
    default:
      console.log(formattedMessage);
      if (data) console.log(data);
  }
  
  // Write to file if enabled
  writeToFile(level, message + (data ? ` ${JSON.stringify(data, null, 2)}` : ''));
}

// Create specific logger functions
const logger = {
  error: (message, data = null) => log(LOG_LEVELS.ERROR, message, data),
  warn: (message, data = null) => log(LOG_LEVELS.WARN, message, data),
  info: (message, data = null) => log(LOG_LEVELS.INFO, message, data),
  debug: (message, data = null) => log(LOG_LEVELS.DEBUG, message, data),
  
  // Monitor memory usage
  logMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    const formattedUsage = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    };
    
    log(LOG_LEVELS.INFO, 'Memory Usage', formattedUsage);
  }
};

module.exports = logger;
