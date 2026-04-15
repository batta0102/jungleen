#!/usr/bin/env pwsh
<#
.SYNOPSIS
Frontend Tests - Automated Setup and Run Script
Navigates to the correct Angular workspace and runs all 92 tests

.DESCRIPTION
This script:
1. Navigates to the nested Angular workspace
2. Verifies angular.json exists
3. Installs dependencies if needed
4. Runs all 92 Karma/Jasmine tests

.EXAMPLE
.\RUN_FRONTEND_TESTS.ps1
#>

param()

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Frontend Tests - Automated Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$currentDir = Get-Location
Write-Host "Starting from: $currentDir" -ForegroundColor Gray

# Navigate to the nested Angular workspace
$workspacePath = Join-Path $currentDir "ProjetPI4eme-newTemplate"

if (-not (Test-Path $workspacePath)) {
    Write-Host "ERROR: ProjetPI4eme-newTemplate folder not found!" -ForegroundColor Red
    Write-Host "Current directory: $currentDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "This script should be run from the outer ProjetPI4eme-newTemplate folder." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Set-Location $workspacePath

# Check if we're in the correct workspace (look for angular.json)
if (-not (Test-Path "angular.json")) {
    Write-Host "ERROR: angular.json not found!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected structure:" -ForegroundColor Yellow
    Write-Host "  ProjetPI4eme-newTemplate/" -ForegroundColor Yellow
    Write-Host "  ├── ProjetPI4eme-newTemplate/  (this is where angular.json should be)" -ForegroundColor Yellow
    Write-Host "  │   ├── angular.json" -ForegroundColor Yellow
    Write-Host "  │   ├── package.json" -ForegroundColor Yellow
    Write-Host "  │   └── src/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[OK] Found Angular workspace at: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install
    }
    catch {
        Write-Host "ERROR: npm install failed!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Running 92 Frontend Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test suites:" -ForegroundColor Yellow
Write-Host "  - RecruitmentService (19 tests)" -ForegroundColor White
Write-Host "  - AssessmentService (14 tests)" -ForegroundColor White
Write-Host "  - AdmissionAnalyticsService (19 tests)" -ForegroundColor White
Write-Host "  - ProductService (18 tests)" -ForegroundColor White
Write-Host "  - OrderService (22 tests)" -ForegroundColor White
Write-Host ""
Write-Host "Starting Karma test runner..." -ForegroundColor Yellow
Write-Host ""

# Run the tests
try {
    npm run test:once
    $testExitCode = $LASTEXITCODE
}
catch {
    Write-Host "ERROR: Test execution failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $testExitCode = 1
}

Write-Host ""
if ($testExitCode -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[OK] ALL TESTS COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ TESTS FAILED OR ENCOUNTERED AN ERROR" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Exit Code: $testExitCode" -ForegroundColor Red
}

exit $testExitCode
