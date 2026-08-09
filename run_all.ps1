# College Management System - PowerShell Launcher
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   🎓 COLLEGE MANAGEMENT SYSTEM - ONE-CLICK RUNNER" -ForegroundColor Cyan
Write-Host "   Starting Vite Frontend, Node.js Backend, and Python Face Service..." -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

# Run the unified node runner
node run_all.js
