/**
 * Logger utility for the ERP system
 */

const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

let winston;
let logFormat;

// Try to load winston, but provide a fallback if it's not installed
try {
  winston = require('winston');
  
  // Define log format
  logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack ? '\n' + stack : ''}`;
    })
  );
} catch (err) {
  console.warn('Winston not installed. Using fallback logger.');
}

// Create logger or fallback implementation
let logger;

// Fallback logger implementation if Winston is not available
const createFallbackLogger = () => {
  const getTimestamp = () => {
    const now = new Date();
    return now.toISOString();
  };
  
  const logToFile = (level, message) => {
    try {
      const logEntry = `${getTimestamp()} [${level.toUpperCase()}]: ${message}\n`;
      fs.appendFileSync(path.join(logDir, 'combined.log'), logEntry);
      
      if (level === 'error') {
        fs.appendFileSync(path.join(logDir, 'error.log'), logEntry);
      }
    } catch (err) {
      console.error('Error writing to log file:', err);
    }
  };
  
  return {
    error: (message) => {
      console.error(`[ERROR]: ${message}`);
      logToFile('error', message);
    },
    warn: (message) => {
      console.warn(`[WARN]: ${message}`);
      logToFile('warn', message);
    },
    info: (message) => {
      console.log(`[INFO]: ${message}`);
      logToFile('info', message);
    },
    debug: (message) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEBUG]: ${message}`);
        logToFile('debug', message);
      }
    },
    stream: {
      write: (message) => {
        console.log(`[INFO]: ${message.trim()}`);
        logToFile('info', message.trim());
      }
    }
  };
};

if (winston) {
  // Create the Winston logger
  logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'erp-system' },
    transports: [
      // Write to console
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),
      
      // Write to all logs with level 'info' and above
      new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
      
      // Write all errors to separate file
      new winston.transports.File({ 
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    ],
    exitOnError: false
  });

  // Create a stream object for Morgan (HTTP request logging)
  logger.stream = {
    write: (message) => {
      logger.info(message.trim());
    }
  };
} else {
  // Use fallback logger
  logger = createFallbackLogger();
}

module.exports = logger;
