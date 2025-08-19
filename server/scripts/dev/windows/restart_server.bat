:: Moved from root: restart_server.bat
@echo off
ECHO Restarting ERP Server...
TASKKILL /F /IM node.exe
TIMEOUT /T 2 /NOBREAK >nul
START cmd /k "cd /d %~dp0\..\..\..\..\server && npm run dev"
