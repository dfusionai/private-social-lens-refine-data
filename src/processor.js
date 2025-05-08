/**
 * Processor module for batch refinement
 */
const { logToFile, logStats } = require('./logs/logger');
const { getFilePermissions, decryptEEK, checkFileRefinement } = require('./blockchain/contract');
const { refineFile } = require('./api/refinement');

/**
 * Processes a single file, checking if it needs refinement and refining it if necessary
 * @param {number} fileId - ID of the file to process
 * @param {object} stats - Statistics object to update
 */
const processFileWithStats = async (fileId, stats) => {
  try {
    console.log(`Checking file ${fileId}...`);

    // Step 1: Check if the file has an EEK
    const encryptedEEK = await getFilePermissions(fileId);

    if (!encryptedEEK) {
      console.log(`File ${fileId} has no EEK or doesn't exist - skipping`);
      return;
    }

    // First, check if the file has already been refined by the target refiner
    const isAlreadyRefined = await checkFileRefinement(fileId);

    // If already refined, skip this file
    if (isAlreadyRefined) {
      console.log(`Skipping file ${fileId} as it has already been refined`);
      stats.alreadyRefined++;
      return;
    }

    console.log(`Found file ${fileId} with EEK - needs refinement`);
    stats.processed++;

    // Step 2: Decrypt the EEK
    const dataEncryptionKey = await decryptEEK(encryptedEEK, fileId);

    if (!dataEncryptionKey) {
      console.log(`Failed to decrypt EEK for file ${fileId} - skipping`);
      stats.failed++;
      await logToFile("failure", fileId, "Failed to decrypt EEK");
      return;
    }

    console.log(`Decrypted EEK for file ${fileId}: ${dataEncryptionKey}`);

    // Step 3: Refine the file
    const result = await refineFile(fileId, dataEncryptionKey);

    if (result) {
      stats.success++;
    } else {
      stats.failed++;
      await logToFile("failure", fileId, "Refinement API call failed");
    }
  } catch (error) {
    console.error(`Error processing file ${fileId}: ${error.message}`);
    await logToFile("error", fileId, error.message);
    stats.failed++;
  }
};

/**
 * Processes a batch of files, updating statistics as it goes
 * @param {number} startId - Starting file ID
 * @param {number} endId - Ending file ID
 * @returns {object} - Statistics for the batch
 */
const processBatchWithStats = async (startId, endId) => {
  console.log(`Processing batch from ${startId} to ${endId}`);

  // Initialize batch statistics
  const batchStats = {
    alreadyRefined: 0,
    processed: 0,
    failed: 0,
    success: 0,
  };

  // Process each file individually but in parallel
  const tasks = [];
  for (let fileId = startId; fileId >= endId; fileId--) {
    tasks.push(processFileWithStats(fileId, batchStats));
  }

  // Wait for all tasks to complete
  await Promise.all(tasks);

  return batchStats;
};

/**
 * Runs the batch processing for a range of file IDs
 * @param {number} startId - Starting file ID
 * @param {number} endId - Ending file ID
 * @param {number} batchSize - Batch size
 * @returns {object} - Overall statistics
 */
const runBatchProcessing = async (startId, endId, batchSize) => {
  console.log(
    `Starting batch refinement for files from ID ${startId} to ${endId} with batch size ${batchSize}`
  );

  // Track statistics
  const stats = {
    total: startId - endId + 1,
    alreadyRefined: 0,
    processed: 0,
    failed: 0,
    success: 0,
  };

  // Process files in batches to avoid overloading the API
  for (let id = startId; id >= endId; id -= batchSize) {
    const batchEndId = Math.max(endId, id - batchSize + 1);

    // Process batch and track statistics
    const batchStats = await processBatchWithStats(id, batchEndId);

    // Update overall statistics
    stats.alreadyRefined += batchStats.alreadyRefined;
    stats.processed += batchStats.processed;
    stats.failed += batchStats.failed;
    stats.success += batchStats.success;

    // Log batch statistics
    await logStats(batchStats, id, batchEndId, "PROGRESS");
  }

  // Log final statistics
  await logStats(stats, startId, endId, "COMPLETE");
  
  console.log("Batch refinement process completed");
  console.log("Summary:");
  console.log(`Total files: ${stats.total}`);
  console.log(`Already refined files (skipped): ${stats.alreadyRefined}`);
  console.log(`Files processed: ${stats.processed}`);
  console.log(`Successfully refined: ${stats.success}`);
  console.log(`Failed refinements: ${stats.failed}`);
  
  return stats;
};

/**
 * Backward compatibility wrapper for processFile
 * @param {number} fileId - ID of the file to process
 */
const processFile = async (fileId) => {
  const dummyStats = {
    alreadyRefined: 0,
    processed: 0,
    failed: 0,
    success: 0,
  };

  await processFileWithStats(fileId, dummyStats);
};

/**
 * Backward compatibility wrapper for processBatch
 * @param {number} startId - Starting file ID
 * @param {number} endId - Ending file ID
 */
const processBatch = async (startId, endId) => {
  await processBatchWithStats(startId, endId);
};

module.exports = {
  processFile,
  processBatch,
  processBatchWithStats,
  runBatchProcessing
}; 