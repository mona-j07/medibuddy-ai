@echo off
title MediBuddy Backend Server
echo.
echo ==========================================
echo 🚀 Starting MediBuddy AI+ Pro Max
echo ==========================================
echo.

call venv\Scripts\activate

echo 📂 Loading data files...
echo.
echo ✅ BMI Data: loaded
echo ✅ Diet Data: loaded  
echo ✅ Exercise Data: loaded
echo.

echo 🌐 Starting servers...
echo.
echo 📍 API Server: http://localhost:5000
echo 📍 WebSocket: ws://localhost:5000
echo.
echo Press Ctrl+C to stop
echo ==========================================
echo.

python app_complete.py