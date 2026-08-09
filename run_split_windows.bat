@echo off
title College Management System - Dedicated Portal Launcher
cls
color 0A

echo ========================================================================
echo    🎓 COLLEGE MANAGEMENT SYSTEM - DEDICATED PORTAL LAUNCHER
echo ========================================================================
echo    Launching Backend APIs and 7 Dedicated Frontend Portals...
echo.

cd /d "%~dp0"

echo [1/9] Starting Node.js Backend API on Port 5000...
start "Node.js Express Backend (Port 5000)" cmd /k "color 09 && title Node.js Backend API - Port 5000 && cd /d "%~dp0\backend" && node server.js"
timeout /t 2 >nul

echo [2/9] Starting Python Face Biometric Service on Port 5001...
start "Python Face Service (Port 5001)" cmd /k "color 0D && title Python Face Service - Port 5001 && cd /d "%~dp0" && python -m face_service.app"
timeout /t 2 >nul

echo [3/9] Starting Admin Portal on Port 5171...
start "Admin Portal (Port 5171)" cmd /k "color 0B && title Admin Portal - Port 5171 && cd /d "%~dp0" && npm.cmd run dev:admin"

echo [4/9] Starting Student Portal on Port 5172...
start "Student Portal (Port 5172)" cmd /k "color 09 && title Student Portal - Port 5172 && cd /d "%~dp0" && npm.cmd run dev:student"

echo [5/9] Starting Faculty Portal on Port 5173...
start "Faculty Portal (Port 5173)" cmd /k "color 0D && title Faculty Portal - Port 5173 && cd /d "%~dp0" && npm.cmd run dev:faculty"

echo [6/9] Starting HOD Portal on Port 5174...
start "HOD Portal (Port 5174)" cmd /k "color 0E && title HOD Portal - Port 5174 && cd /d "%~dp0" && npm.cmd run dev:hod"

echo [7/9] Starting Parent Portal on Port 5175...
start "Parent Portal (Port 5175)" cmd /k "color 0A && title Parent Portal - Port 5175 && cd /d "%~dp0" && npm.cmd run dev:parent"

echo [8/9] Starting Principal Portal on Port 5176...
start "Principal Portal (Port 5176)" cmd /k "color 0C && title Principal Portal - Port 5176 && cd /d "%~dp0" && npm.cmd run dev:principal"

echo [9/9] Starting Office Staff Portal on Port 5177...
start "Office Staff Portal (Port 5177)" cmd /k "color 0F && title Office Staff Portal - Port 5177 && cd /d "%~dp0" && npm.cmd run dev:office"

echo.
echo ========================================================================
echo    🎉 ALL PORTALS & SERVICES LAUNCHED IN DEDICATED WINDOWS!
echo ========================================================================
echo    Admin Portal        : http://localhost:5171
echo    Student Portal      : http://localhost:5172
echo    Faculty Portal      : http://localhost:5173
echo    HOD Portal          : http://localhost:5174
echo    Parent Portal       : http://localhost:5175
echo    Principal Portal    : http://localhost:5176
echo    Office Staff Portal : http://localhost:5177
echo    Backend API         : http://localhost:5000
echo    Python AI           : http://localhost:5001
echo ========================================================================
echo.
pause
