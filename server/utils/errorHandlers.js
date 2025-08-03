/**
 * Global error handlers for Node.js process
 * This file adds handlers for uncaught exceptions and unhandled promise rejections
 * to prevent the server from crashing unexpectedly.
 */

const logger = require('./logger');

// Log handler setup
function setupProcessHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION!', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    // Don't exit the process - keep server running
    // process.exit(1); // Uncomment if you want to exit on uncaught exceptions
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED PROMISE REJECTION!', {
      reason: reason.toString(),
      stack: reason.stack || 'No stack trace available'
    });
    
    // Don't exit the process - keep server running
  });

  // Handle warning events
  process.on('warning', (warning) => {
    logger.warn('WARNING', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });

  // Handle SIGTERM signal (sent when process is being terminated)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Graceful shutdown initiated...');
    // Any cleanup operations here
    process.exit(0);
  });

  // Handle SIGINT signal (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Graceful shutdown initiated...');
    // Any cleanup operations here
    process.exit(0);
  });

  // Setup memory monitoring
  const MEMORY_MONITOR_INTERVAL = 15 * 60 * 1000; // 15 minutes
  setInterval(() => {
    logger.logMemoryUsage();
  }, MEMORY_MONITOR_INTERVAL);

  logger.info('Global error handlers set up successfully');
}

module.exports = { setupProcessHandlers };
