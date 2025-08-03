#!/bin/bash

# Server update and restart script
# This script will apply the new error handling changes and restart the server

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting server update process...${NC}"

# Navigate to the server directory
cd "$(dirname "$0")/.."
echo -e "${GREEN}Working directory: $(pwd)${NC}"

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  mkdir -p logs
  echo -e "${GREEN}Created logs directory${NC}"
fi

# Set environment variable to enable file logging
export LOG_TO_FILE=true
export LOG_DIR="$(pwd)/logs"

# Check if there are any running node processes
NODE_PROCESSES=$(ps aux | grep node | grep -v grep)
if [ ! -z "$NODE_PROCESSES" ]; then
  echo -e "${YELLOW}Found running Node.js processes:${NC}"
  echo "$NODE_PROCESSES"
  
  read -p "Do you want to kill these processes before starting? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Killing Node.js processes...${NC}"
    pkill -f node
    sleep 2
    echo -e "${GREEN}Node.js processes killed${NC}"
  fi
else
  echo -e "${GREEN}No running Node.js processes found${NC}"
fi

# Install any new dependencies
echo -e "${YELLOW}Checking for dependencies...${NC}"
npm install
echo -e "${GREEN}Dependencies up to date${NC}"

# Start the server with error handlers enabled
echo -e "${YELLOW}Starting server with enhanced error handling...${NC}"
echo -e "${YELLOW}Logs will be saved to: ${LOG_DIR}${NC}"

# Create a timestamp for the log file
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="${LOG_DIR}/server-${TIMESTAMP}.log"

# Start the server with logging
echo -e "${GREEN}Starting server with output to: ${LOG_FILE}${NC}"
node index.js > "${LOG_FILE}" 2>&1 &

# Save the PID
SERVER_PID=$!
echo $SERVER_PID > "${LOG_DIR}/server.pid"
echo -e "${GREEN}Server started with PID: ${SERVER_PID}${NC}"
echo -e "${YELLOW}To stop the server, run: kill $(cat ${LOG_DIR}/server.pid)${NC}"
echo -e "${YELLOW}To view logs in real-time, run: tail -f ${LOG_FILE}${NC}"
