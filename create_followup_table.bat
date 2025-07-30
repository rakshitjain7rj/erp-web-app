@echo off
echo 🚀 Creating CountProductFollowUps table...
echo.

REM Check if environment variables are needed
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_NAME%"=="" set DB_NAME=yarn_erp
if "%DB_HOST%"=="" set DB_HOST=localhost

echo Using database: %DB_NAME%
echo Using user: %DB_USER%
echo Using host: %DB_HOST%
echo.

REM Create the SQL command
set SQL=CREATE TABLE IF NOT EXISTS "CountProductFollowUps" ("id" SERIAL PRIMARY KEY, "countProductId" INTEGER NOT NULL, "followUpDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "remarks" TEXT NOT NULL, "addedBy" INTEGER DEFAULT 1, "addedByName" VARCHAR(255) DEFAULT 'System User', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()); CREATE INDEX IF NOT EXISTS "countproductfollowups_countproductid_idx" ON "CountProductFollowUps" ("countProductId");

echo Creating table with psql...
psql -U %DB_USER% -h %DB_HOST% -d %DB_NAME% -c "%SQL%"

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ CountProductFollowUps table created successfully!
    echo ✅ Follow-up system is now ready to use!
    echo.
    echo 🚀 Next steps:
    echo 1. Start the server: cd server ^&^& node index.js
    echo 2. Test the follow-up functionality in the frontend
) else (
    echo.
    echo ❌ Failed to create table. Please check:
    echo - PostgreSQL is running
    echo - Database 'yarn_erp' exists
    echo - User has CREATE TABLE permissions
    echo - psql is available in PATH
)

pause
