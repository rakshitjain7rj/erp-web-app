/**
 * Test script to verify the logger functionality
 */
const logger = require('../utils/logger');

console.log('Testing logger functionality...');

try {
  // Test each log level
  logger.info('This is an info message from the test script');
  logger.debug('This is a debug message from the test script');
  logger.warn('This is a warning message from the test script');
  logger.error('This is an error message from the test script');
  
  console.log('Logger test completed successfully');
} catch (error) {
  console.error('Error testing logger:', error);
}
