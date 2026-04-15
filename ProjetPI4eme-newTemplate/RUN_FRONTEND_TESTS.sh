#!/bin/bash
# Frontend Tests - Automated Setup and Run Script
# This script navigates to the correct Angular workspace and runs all 92 tests

set -e  # Exit on error

echo ""
echo "========================================"
echo " Frontend Tests - Automated Setup"
echo "========================================"
echo ""

# Get current directory
CURRENT_DIR=$(pwd)

# Navigate to the nested Angular workspace
cd "$CURRENT_DIR/ProjetPI4eme-newTemplate" || {
    echo "ERROR: ProjetPI4eme-newTemplate folder not found!"
    echo "Current directory: $CURRENT_DIR"
    echo ""
    exit 1
}

# Check if we're in the correct workspace (look for angular.json)
if [ ! -f "angular.json" ]; then
    echo "ERROR: angular.json not found!"
    echo "Current directory: $(pwd)"
    echo ""
    echo "Expected structure:"
    echo "  ProjetPI4eme-newTemplate/"
    echo "  ├── ProjetPI4eme-newTemplate/  (this is where angular.json should be)"
    echo "  │   ├── angular.json"
    echo "  │   ├── package.json"
    echo "  │   └── src/"
    echo ""
    exit 1
fi

echo "✓ Found Angular workspace at: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install || {
        echo "ERROR: npm install failed!"
        exit 1
    }
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "========================================"
echo " Running 92 Frontend Tests"
echo "========================================"
echo ""
echo "Test suites:"
echo "  • RecruitmentService (19 tests)"
echo "  • AssessmentService (14 tests)"
echo "  • AdmissionAnalyticsService (19 tests)"
echo "  • ProductService (18 tests)"
echo "  • OrderService (22 tests)"
echo ""
echo "Starting Karma test runner..."
echo ""

# Run the tests
npm run test:once

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "========================================"
    echo "✓ ALL TESTS COMPLETED SUCCESSFULLY"
    echo "========================================"
else
    echo "========================================"
    echo "✗ TESTS FAILED OR ENCOUNTERED AN ERROR"
    echo "========================================"
    echo "Exit Code: $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE
