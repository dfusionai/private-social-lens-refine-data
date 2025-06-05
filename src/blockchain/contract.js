/**
 * Smart contract interaction module for batch refinement
 */
const ethers = require('ethers');
const eccrypto = require('eccrypto');
const { CONFIG } = require('../utils/config');
const { logToFile } = require('../logs/logger');

// Provider instance
let provider;

/**
 * Initializes the Ethereum contract connection
 */
const initializeContract = () => {
  if (!CONFIG.dataRegistryAddress) {
    throw new Error("DATA_REGISTRY_ADDRESS environment variable must be set");
  }

  // Create a provider with network information and ENS disabled
  const network = {
    chainId: 14800, // Correct chain ID for Vana network
  };

  provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl, network);
  console.log(`Connected to DataRegistry contract at ${CONFIG.dataRegistryAddress}`);
};

/**
 * Decrypts the Encrypted Encryption Key (EEK) using the DLP Private Key
 * @param {string} encryptedEEK - The encrypted EEK
 * @param {number} fileId - ID of the file being processed
 * @returns {string|null} - Decrypted EEK or null if decryption failed
 */
const decryptEEK = async (encryptedEEK, fileId) => {
  try {
    const privateKeyBuffer = Buffer.from(
      CONFIG.dlpPrivateKey.startsWith("0x")
        ? CONFIG.dlpPrivateKey.slice(2)
        : CONFIG.dlpPrivateKey,
      "hex"
    );

    // Split encryptedHex into components
    const encryptedBuffer = Buffer.from(encryptedEEK, "hex");
    const iv = encryptedBuffer.slice(0, 16);
    const ephemPublicKey = encryptedBuffer.slice(16, 81);
    const ciphertext = encryptedBuffer.slice(81, encryptedBuffer.length - 32);
    const mac = encryptedBuffer.slice(encryptedBuffer.length - 32);

    const decryptedBuffer = await eccrypto.decrypt(privateKeyBuffer, {
      iv,
      ephemPublicKey,
      ciphertext,
      mac,
    });

    return decryptedBuffer.toString();
  } catch (error) {
    console.error(`decryptEEK error for EEK: ${error.message}`);
    if (fileId) {
      await logToFile("decrypt-error", fileId, error.message);
    }
    return null;
  }
};

/**
 * Checks file permissions and gets the EEK from the DataRegistry contract
 * @param {number} fileId - ID of the file to check
 * @returns {string|null} - The EEK or null if not found
 */
const getFilePermissions = async (fileId) => {
  try {
    console.log(
      `Checking file permissions for ID: ${fileId} with address: ${CONFIG.dlpAddress}`
    );

    // Create a contract interface manually
    const iface = new ethers.utils.Interface([
      "function filePermissions(uint256 fileId, address dlpAddress) view returns (string)",
    ]);

    // Encode the function call data manually to avoid ENS resolution
    const data = iface.encodeFunctionData("filePermissions", [
      fileId,
      CONFIG.dlpAddress,
    ]);

    // Make a raw call to the contract
    console.log(`Making raw call to contract ${CONFIG.dataRegistryAddress}`);
    const result = await provider.call({
      to: CONFIG.dataRegistryAddress,
      data,
    });

    console.log(`Got raw result: ${result.slice(0, 50)}...`);

    // If we got a result, decode it
    if (result && result !== "0x") {
      try {
        const decoded = iface.decodeFunctionResult("filePermissions", result);
        console.log(`Successfully decoded result`);

        if (decoded && decoded[0] && decoded[0] !== "") {
          console.log(`Found EEK for file ${fileId}`);
          return decoded[0];
        }
      } catch (decodeError) {
        console.error(`Error decoding result: ${decodeError.message}`);
        await logToFile("contract-error", fileId, {
          message: decodeError.message,
        });
      }
    }

    console.log(`No EEK found for file ${fileId}`);
    return null;
  } catch (error) {
    console.error(
      `Error checking permissions for file ${fileId} from contract: ${error.message}`
    );
    // Print more error details if available
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.reason) console.error(`Error reason: ${error.reason}`);
    if (error.data) console.error(`Error data: ${error.data}`);

    await logToFile("contract-error", fileId, error);
    return null;
  }
};

/**
 * Checks if a file has already been refined by a specific refiner
 * @param {number} fileId - ID of the file to check
 * @param {number|null} refinerId - ID of the refiner
 * @returns {boolean} - True if the file has been refined, false otherwise
 */
const checkFileRefinement = async (fileId, refinerId = null) => {
  try {
    refinerId = refinerId || CONFIG.refinerId;

    console.log(
      `Checking if file ${fileId} has been refined by refiner ${refinerId}`
    );

    // Create a contract interface manually
    const iface = new ethers.utils.Interface([
      "function fileRefinements(uint256 fileId, uint256 refinerId) view returns (string)",
    ]);

    // Encode the function call data manually to avoid ENS resolution
    const data = iface.encodeFunctionData("fileRefinements", [
      fileId,
      refinerId,
    ]);

    // Make a raw call to the contract
    console.log(`Making raw call to contract ${CONFIG.dataRegistryAddress}`);
    const result = await provider.call({
      to: CONFIG.dataRegistryAddress,
      data,
    });

    console.log(`Got raw result: ${result.slice(0, 50)}...`);

    // If we got a result, decode it
    if (result && result !== "0x") {
      try {
        const decoded = iface.decodeFunctionResult("fileRefinements", result);
        console.log(`Successfully decoded result`);

        if (decoded && decoded[0] && decoded[0] !== "") {
          console.log(
            `File ${fileId} has ALREADY been refined by refiner ${refinerId}`
          );
          await logToFile("info", fileId, {
            status: "already_refined",
            refinerId,
          });
          return true;
        }
      } catch (decodeError) {
        console.error(`Error decoding result: ${decodeError.message}`);
        await logToFile("contract-error", fileId, {
          message: decodeError.message,
        });
      }
    }

    console.log(
      `File ${fileId} has NOT been refined by refiner ${refinerId} yet`
    );
    await logToFile("info", fileId, {
      status: "not_refined",
      refinerId,
    });
    return false;
  } catch (error) {
    console.error(
      `Error checking refinement for file ${fileId}: ${error.message}`
    );
    // Print more error details if available
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.reason) console.error(`Error reason: ${error.reason}`);
    if (error.data) console.error(`Error data: ${error.data}`);

    await logToFile("contract-error", fileId, error);
    return false;
  }
};

module.exports = {
  initializeContract,
  decryptEEK,
  getFilePermissions,
  checkFileRefinement
}; 