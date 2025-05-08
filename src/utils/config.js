/**
 * Configuration module for batch refinement
 */
const path = require('path');
require('dotenv').config();

// Central configuration object
const CONFIG = {
  // API configuration
  refinementServiceApiBaseUrl: process.env.REFINEMENT_SERVICE_API_BASE_URL || 
    "https://a7df0ae43df690b889c1201546d7058ceb04d21b-8000.dstack-prod5.phala.network",
  
  // DLP configuration
  dlpPrivateKey: process.env.DLP_PRIVATE_KEY,
  dlpAddress: process.env.DLP_ADDRESS,
  
  // Batch processing configuration
  maxFileId: parseInt(process.env.MAX_FILE_ID || "1000", 10),
  batchSize: parseInt(process.env.BATCH_SIZE || "10", 10),
  refinerId: process.env.REFINER_ID ? Number(process.env.REFINER_ID) : 7,
  
  // Ethereum configuration
  rpcUrl: process.env.RPC_URL || "https://rpc.moksha.vana.org",
  dataRegistryAddress: process.env.DATA_REGISTRY_ADDRESS,
  
  // Logging configuration
  verbose: process.env.VERBOSE === "true",
  logDir: path.join(process.cwd(), "output"),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  
  // Pinata configuration for IPFS
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataApiSecret: process.env.PINATA_API_SECRET
};

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
const validateConfig = () => {
  if (!CONFIG.dlpPrivateKey || !CONFIG.dlpAddress) {
    throw new Error("DLP_PRIVATE_KEY and DLP_ADDRESS environment variables must be set");
  }

  if (!CONFIG.dataRegistryAddress) {
    throw new Error("DATA_REGISTRY_ADDRESS environment variable must be set");
  }
};

module.exports = {
  CONFIG,
  validateConfig
}; 