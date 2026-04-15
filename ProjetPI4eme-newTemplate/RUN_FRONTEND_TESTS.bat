@echo off
REM Frontend Tests - Automated Setup and Run Script
REM This script navigates to the correct Angular workspace and runs all 92 tests

echo.
echo ========================================
echo  Frontend Tests - Automated Setup
echo ========================================
echo.

REM Get current directory
set CURRENT_DIR=%CD%

REM Navigate to the nested Angular workspace
cd /d "%CURRENT_DIR%\ProjetPI4eme-newTemplate"

REM Check if we're in the correct workspace (look for angular.json)
if not exist "angular.json" (
    echo ERROR: angular.json not found!
    echo Current directory: %CD%
    echo.
    echo This script should be run from the outer ProjetPI4eme-newTemplate folder.
    echo Expected structure:
    echo   ProjetPI4eme-newTemplate\
    echo   ├── ProjetPI4eme-newTemplate\  (this is where angular.json should be)
    echo   │   ├── angular.json
    echo   │   ├── package.json
    echo   │   └── src\
    echo.
    pause
    exit /b 1
)

echo ✓ Found Angular workspace at: %CD%
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ Dependencies already installed
)

echo.
echo ========================================
echo  Running 92 Frontend Tests
echo ========================================
echo.
echo Test suites:
echo   • RecruitmentService (19 tests)
echo   • AssessmentService (14 tests)
echo   • AdmissionAnalyticsService (19 tests)
echo   • ProductService (18 tests)
echo   • OrderService (22 tests)
echo.
echo Starting Karma test runner...
echo.

REM Run the tests
call npm run test:once

REM Capture exit code
set TEST_EXIT_CODE=%ERRORLEVEL%

echo.
if %TEST_EXIT_CODE% equ 0 (
    echo ========================================
    echo ✓ ALL TESTS COMPLETED SUCCESSFULLY
    echo ========================================
) else (
    echo ========================================
    echo ✗ TESTS FAILED OR ENCOUNTERED AN ERROR
    echo ========================================
    echo Exit Code: %TEST_EXIT_CODE%
)

pause
exit /b %TEST_EXIT_CODE%
