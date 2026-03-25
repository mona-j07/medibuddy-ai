@echo off
echo ==========================================
echo Starting MediBuddy AI+ Pro Max Frontend
echo ==========================================
echo.

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
    echo.
)

echo Starting development server...
echo.
echo Frontend will be available at: http://localhost:3000
echo Press Ctrl+C to stop
echo ==========================================
echo.

call npm run dev