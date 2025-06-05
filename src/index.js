/**
 * Main entry point for batch refinement
 */
const { setupLogging, initializeStatsLog } = require('./logs/logger');
const { initializeContract } = require('./blockchain/contract');
const { parseArgs, showHelpMessage } = require('./utils/cli');
const { validateConfig } = require('./utils/config');
const { runBatchProcessing, processFile, processBatch } = require('./processor');

/**
 * Main function to run the batch refinement process
 */
const main = async () => {
  // Parse command line arguments
  const { startId, endId, batchSize, verbose, showHelp } = parseArgs();
  
  if (showHelp) {
    showHelpMessage();
    return;
  }

  // Initialize logging
  await setupLogging(verbose);

  try {
    // Validate required environment variables
    validateConfig();
    
    // Initialize smart contract
    initializeContract();
    
    // Initialize stats log
    await initializeStatsLog(startId, endId, batchSize);
    
    // Run the batch processing
    await runBatchProcessing(startId, endId, batchSize);
  } catch (error) {
    console.error(`Batch refinement failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Batch refinement failed:", error);
    process.exit(1);
  });
}

// Export functions for potential external use
module.exports = {
  processFile,
  processBatch
}; 