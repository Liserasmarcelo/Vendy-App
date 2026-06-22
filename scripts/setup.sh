#!/bin/bash

# ==========================================
# VENDY SETUP SCRIPT
# ==========================================

set -e

echo "🚀 Vendy Setup"
echo "==============="

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Install Docker for local development."
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
    echo "⚠️  Please edit .env with your configuration"
fi

# Setup database
echo "🗄️  Setting up database..."
cd apps/api
if [ ! -f prisma/migrations/migration_lock.toml ]; then
    echo "🔄 Running initial migration..."
    pnpm prisma migrate dev --name init
else
    echo "🔄 Running migrations..."
    pnpm prisma migrate deploy
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
pnpm prisma generate

cd ../..

# Build packages
echo "🔨 Building packages..."
pnpm --filter @vendy/shared-types build
pnpm --filter @vendy/config build

# Build apps
echo "🔨 Building apps..."
pnpm --filter @vendy/api build
pnpm --filter @vendy/mini-app build
pnpm --filter @vendy/bot-parent build
pnpm --filter @vendy/bot-child build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Start services: pnpm dev"
echo "3. Or use Docker: docker-compose up -d"
echo ""
