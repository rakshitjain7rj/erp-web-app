#!/bin/bash

# Script to apply the yarn type tracking solution
# Legacy utility (browser/frontend + server mixed steps); kept for reference only.

BASE_DIR="/home/rakshit/Public/erp-web-app"
SERVER_DIR="$BASE_DIR/server"
FRONTEND_DIR="$BASE_DIR/erp-frontend"

echo "====== Yarn Type Tracking Solution Installation ======"
read -p "Press ENTER to continue or CTRL+C to cancel..." _

echo "[Legacy] Backing up selected files..."
mkdir -p "$BASE_DIR/backups/$(date +%Y%m%d-%H%M%S)"

# Note: original script performed patch-like replacements and ran migrations.
# Prefer using organized scripts under server/scripts and server/sql now.
