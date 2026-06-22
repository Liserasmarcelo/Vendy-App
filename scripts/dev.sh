#!/bin/bash

# ==========================================
# VENDY DEV SCRIPT
# ==========================================

set -e

echo "🚀 Starting Vendy in development mode"
echo "====================================="

# Start infrastructure
echo "🐳 Starting infrastructure..."
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis

# Wait for services
echo "⏳ Waiting for services..."
sleep 5

# Start API
echo "🔥 Starting API..."
pnpm --filter @vendy/api dev &
API_PID=$!

# Start Mini App
echo "⚡ Starting Mini App..."
pnpm --filter @vendy/mini-app dev &
MINI_PID=$!

# Start Bot Parent (if token configured)
if [ -n "$PARENT_BOT_TOKEN" ]; then
    echo "🤖 Starting Bot Parent..."
    pnpm --filter @vendy/bot-parent dev &
    BOT_PARENT_PID=$!
fi

echo ""
echo "✅ All services started!"
echo ""
echo "URLs:"
echo "  API:       http://localhost:3001"
echo "  API Docs:  http://localhost:3001/docs"
echo "  Mini App:  http://localhost:5173"
echo "  Health:    http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "kill $API_PID $MINI_PID $BOT_PARENT_PID 2>/dev/null; exit" INT
wait
