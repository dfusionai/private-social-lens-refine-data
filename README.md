# Batch Refinement

A modular application for processing and refining files in batches.

## Project Structure

The project has been structured into modules for better organization and maintainability:

```
src/
├── api/              # API interaction modules
│   └── refinement.js # File refinement API calls
├── blockchain/       # Blockchain interaction modules
│   └── contract.js   # Smart contract interactions
├── logs/             # Logging modules
│   └── logger.js     # Centralized logging system
├── utils/            # Utility modules
│   ├── cli.js        # Command-line argument handling
│   └── config.js     # Configuration management
├── processor.js      # File processing logic
└── index.js          # Main entry point
```

## Building the Docker Image

```bash
docker build -t batch-refinement .
```

## Running the Container

### Basic Usage

```bash
docker run --rm batch-refinement
```

This will display the help message.

### Running with Custom Parameters

```bash
docker run --rm batch-refinement --start 1000 --end 900 --batch 10 --verbose
```

### Setting Environment Variables

```bash
docker run --rm \
  -e DLP_PRIVATE_KEY=your_private_key \
  -e DLP_ADDRESS=your_address \
  -e DATA_REGISTRY_ADDRESS=registry_address \
  -e PINATA_API_KEY=your_pinata_api_key \
  -e PINATA_API_SECRET=your_pinata_api_secret \
  batch-refinement --start 1000 --end 900
```

### Using a .env File

```bash
docker run --rm \
  --env-file .env \
  batch-refinement --start 1000 --end 900
```

Example .env file:
```
DLP_PRIVATE_KEY=your_private_key
DLP_ADDRESS=your_address
DATA_REGISTRY_ADDRESS=registry_address
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
RPC_URL=https://rpc.moksha.vana.org
MAX_FILE_ID=1000
BATCH_SIZE=10
REFINER_ID=7
VERBOSE=false
```

### Persisting Logs

To persist logs outside the container:

```bash
docker run --rm \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  batch-refinement --start 1000 --end 900
```

## Available Options

- `-s, --start <id>`: Start file ID (default: 1000)
- `-e, --end <id>`: End file ID (default: 1)
- `-b, --batch <size>`: Batch size (default: 10)
- `-v, --verbose`: Enable verbose logging
- `-h, --help`: Show the help message

## Logs

The application generates three main log files in the `output` directory:

1. **results.log**: Contains the processing result for each file with the following format:
   ```
   timestamp,fileId,STATUS,message
   ```
   Where STATUS can be:
   - SUCCESS: The file was successfully refined (includes the hash/CID)
   - FAILED: The file refinement failed (includes error message)
   - ERROR: An error occurred during processing (includes error details)
   - INFO: Informational messages about the file (e.g., already refined, no EEK found)

2. **stats.log**: Contains batch processing statistics with the following format:
   ```
   timestamp,EVENT_TYPE,Files start_id to end_id,Total:X,Already Refined:Y,Processed:Z,Success:A,Failed:B
   ```
   Where EVENT_TYPE can be:
   - START: Batch refinement process started
   - PROGRESS: Progress update after processing a batch
   - COMPLETE: Final statistics after completing all batches

3. **console.log**: Contains all console output (both log and error messages) with the following format:
   ```
   timestamp,LEVEL,message
   ```
   Where LEVEL can be INFO or ERROR.

### Log Rotation

Log files are automatically rotated when they exceed 10MB in size. Rotated logs are renamed with a timestamp suffix, for example:
```
results.log.2023-10-15T14-30-25.123Z.bak
```

This prevents log files from growing too large over time.

## Development

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

### Running Locally

```bash
npm start
```

Or with parameters:

```bash
npm start -- --start 1000 --end 900 --batch 10 --verbose
```

### Environment Variables

Set environment variables in a `.env` file by copying the provided `env.example` file:

```bash
cp env.example .env
```

Then edit the `.env` file with your values. 
