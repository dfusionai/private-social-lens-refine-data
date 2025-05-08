/**
 * Logging module for batch refinement
 */
const fs = require('fs').promises;
const path = require('path');
const { CONFIG } = require('../utils/config');

// Capture original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

/**
 * Initializes the logging system
 * @param {boolean} verbose - Whether to enable verbose logging
 */
const setupLogging = async (verbose = false) => {
  await fs.mkdir(CONFIG.logDir, { recursive: true });
  await rotateLogFiles();

  console.log = (...args) => {
    const message = args.join(" ");
    const timestamp = new Date().toISOString();

    // Print to console
    originalConsoleLog(`${timestamp} - ${message}`);

    // Log to file
    fs.appendFile(
      path.join(CONFIG.logDir, "console.log"),
      `${timestamp},INFO,${message}\n`
    ).catch((err) =>
      originalConsoleError("Error writing to console.log file:", err)
    );
  };

  console.error = (...args) => {
    const message = args.join(" ");
    const timestamp = new Date().toISOString();

    // Print to console
    originalConsoleError(`${timestamp} - ERROR - ${message}`);

    // Log to file
    fs.appendFile(
      path.join(CONFIG.logDir, "console.log"),
      `${timestamp},ERROR,${message}\n`
    ).catch((err) =>
      originalConsoleError("Error writing to console.log file:", err)
    );
  };
};

/**
 * Rotates log files if they exceed the maximum size
 */
const rotateLogFiles = async () => {
  try {
    const logFiles = ["results.log", "stats.log", "console.log"];

    for (const file of logFiles) {
      const filePath = path.join(CONFIG.logDir, file);

      try {
        const stats = await fs.stat(filePath);

        if (stats.size > CONFIG.maxLogSize) {
          const timestamp = new Date().toISOString().replace(/:/g, "-");
          const backupPath = path.join(CONFIG.logDir, `${file}.${timestamp}.bak`);

          await fs.rename(filePath, backupPath);
          console.log(`Rotated log file ${file} to ${backupPath}`);
        }
      } catch (err) {
        // File doesn't exist yet, that's ok
        if (err.code !== "ENOENT") {
          console.error(`Error checking log file ${file}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error rotating log files: ${err.message}`);
  }
};

/**
 * Logs information to the results log file
 * @param {string} logType - Type of log entry (success, failure, error, etc.)
 * @param {number} fileId - ID of the file being processed
 * @param {any} data - Data to include in the log
 */
const logToFile = async (logType, fileId, data) => {
  const timestamp = new Date().toISOString();
  await fs.mkdir(CONFIG.logDir, { recursive: true });

  let logMessage = "";

  switch (logType) {
    case "api-error":
    case "contract-error":
    case "decrypt-error":
      // For errors: log with ERROR status and error message
      const errorMsg = typeof data === "string" 
        ? data 
        : data?.message || JSON.stringify(data).substring(0, 200);
      logMessage = `${timestamp},${fileId},ERROR,${errorMsg}\n`;
      break;
    case "success":
      // For success: log with SUCCESS status and returned hash
      const hash = data?.hash || data?.cid || "success";
      logMessage = `${timestamp},${fileId},SUCCESS,${hash}\n`;
      break;
    case "failure":
      // For failure: log with FAILED status
      logMessage = `${timestamp},${fileId},FAILED,${data || "Unknown error"}\n`;
      break;
    default:
      // For other cases: log with INFO status
      const infoMsg = typeof data === "string" 
        ? data 
        : JSON.stringify(data).substring(0, 200);
      logMessage = `${timestamp},${fileId},INFO,${infoMsg}\n`;
  }

  // Write to results log file
  await fs.appendFile(path.join(CONFIG.logDir, "results.log"), logMessage);
};

/**
 * Logs statistics about batch processing
 * @param {object} stats - Statistics object
 * @param {number} startId - Starting file ID
 * @param {number} endId - Ending file ID
 * @param {string} type - Type of stats entry (START, PROGRESS, COMPLETE)
 */
const logStats = async (stats, startId, endId, type = "PROGRESS") => {
  const timestamp = new Date().toISOString();
  
  const statsMessage = `${timestamp},${type},Files ${startId} to ${endId},Total: ${stats.total || (startId - endId + 1)},Already Refined: ${stats.alreadyRefined},Processed: ${stats.processed},Success: ${stats.success},Failed: ${stats.failed}\n`;
  
  await fs.appendFile(path.join(CONFIG.logDir, "stats.log"), statsMessage);
};

/**
 * Initializes the stats log with a START entry
 * @param {number} startId - Starting file ID
 * @param {number} endId - Ending file ID
 * @param {number} batchSize - Batch size
 */
const initializeStatsLog = async (startId, endId, batchSize) => {
  try {
    await fs.mkdir(CONFIG.logDir, { recursive: true });
    
    const timestamp = new Date().toISOString();
    await fs.appendFile(
      path.join(CONFIG.logDir, "stats.log"),
      `${timestamp},START,Files ${startId} to ${endId},Batch size: ${batchSize}\n`
    );
  } catch (error) {
    console.error(`Error initializing stats log: ${error.message}`);
  }
};

module.exports = {
  setupLogging,
  rotateLogFiles,
  logToFile,
  logStats,
  initializeStatsLog
}; 