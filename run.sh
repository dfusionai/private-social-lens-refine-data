#!/bin/bash

# Build the Docker image if it doesn't exist
if [[ "$(docker images -q batch-refinement 2> /dev/null)" == "" ]]; then
  echo "Building Docker image..."
  docker build -t batch-refinement .
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the container with the specified parameters
docker run --rm \
  -v "$(pwd)/logs:/app/logs" \
  --env-file .env \
  batch-refinement "$@" 