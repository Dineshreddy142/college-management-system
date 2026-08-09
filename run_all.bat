@echo off
title College Management System - All Services Runner
cls
color 0B

echo ========================================================================
echo    🎓 COLLEGE MANAGEMENT SYSTEM - ONE-CLICK LAUNCHER
echo ========================================================================
echo    Starting all 3 services in parallel:
echo      1. Frontend Web App        (Vite on Port 5173)
echo      2. Node.js Backend API     (Express on Port 5000)
echo      3. Python Biometrics AI    (Flask on Port 5001)
echo ========================================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js (v18+) and try again.
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python is not found in PATH!
    echo Please install Python 3.10+ and try again.
    pause
    exit /b 1
)

:: Change to root directory of project
cd /d "%~dp0"

:: Start the unified runner
echo [INFO] Launching unified runner...
echo.

node run_all.js

pause
