#!/bin/bash

# ==========================================
# VENDY TEST SCRIPT
# ==========================================

set -e

echo "🧪 Running Vendy tests"
echo "======================"

# Run unit tests
echo "📦 Running unit tests..."
pnpm test

# Run integration tests
echo "🔗 Running integration tests..."
pnpm --filter @vendy/api test:integration

# Run E2E tests
echo "🎭 Running E2E tests..."
pnpm --filter @vendy/mini-app test:e2e

echo ""
echo "✅ All tests passed!"
