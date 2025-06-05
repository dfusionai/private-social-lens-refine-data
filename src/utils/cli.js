/**
 * CLI module for batch refinement
 */
const { CONFIG } = require('./config');

/**
 * Parses command line arguments
 * @returns {object} - Parsed arguments
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  let startId = CONFIG.maxFileId;
  let endId = 1;
  let batchSize = CONFIG.batchSize;
  let verbose = CONFIG.verbose;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--start" || args[i] === "-s") {
      startId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--end" || args[i] === "-e") {
      endId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--batch" || args[i] === "-b") {
      batchSize = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      verbose = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      showHelp = true;
    }
  }

  return { startId, endId, batchSize, verbose, showHelp };
};

/**
 * Displays help message
 */
const showHelpMessage = () => {
  console.log(`
Usage: node batch-refinement.js [options]

Options:
  -s, --start <id>   Start file ID (default: ${CONFIG.maxFileId})
  -e, --end <id>     End file ID (default: 1)
  -b, --batch <size> Batch size (default: ${CONFIG.batchSize})
  -v, --verbose      Enable verbose logging
  -h, --help         Show this help message
  `);
};

module.exports = {
  parseArgs,
  showHelpMessage
}; 