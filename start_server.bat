@echo off
echo ===============================================
echo Starting ERP Server Setup and Launch
echo ===============================================

cd /d "c:\Users\hp\Desktop\erp project\erp-web-app"

echo.
echo [1/3] Running Database Migration...
node create_dyeing_firms_table.js

echo.
echo [2/3] Checking Server Connection...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting Server...
cd server
echo Server starting on port 5000...
echo.
echo To test the setup:
echo 1. Open browser to http://localhost:5000/api/test
echo 2. Check dyeing firms API: http://localhost:5000/api/dyeing-firms
echo.
echo Press Ctrl+C to stop the server
echo.
npm start
