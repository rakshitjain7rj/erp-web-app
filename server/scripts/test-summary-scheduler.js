/**
 * Test script to run the production summary scheduler manually
 * This is useful for testing the scheduler without waiting for the scheduled time
 */

require('dotenv').config();
const { runManualTest } = require('../schedulers/productionSummaryScheduler');
const logger = require('../utils/logger');

logger.info('Starting manual test of production summary scheduler');

// Run the test
runManualTest()
  .then(() => {
    logger.info('Manual test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error running manual test:', error);
    process.exit(1);
  });
