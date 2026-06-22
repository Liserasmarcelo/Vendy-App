#!/bin/bash

# ==========================================
# VENDY DEPLOY SCRIPT
# ==========================================

set -e

ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}

echo "🚀 Deploying Vendy"
echo "==================="
echo "Environment: $ENVIRONMENT"
echo "Service: $SERVICE"
echo ""

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Invalid environment. Use: staging or production"
    exit 1
fi

# Deploy API
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api" ]; then
    echo "🔥 Deploying API..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production: Railway
        echo "📦 Building Docker image..."
        docker build -t vendy-api:latest -f infra/docker/Dockerfile.api .
        
        echo "🚢 Pushing to Railway..."
        railway up --service vendy-api
    else
        # Staging: Docker Compose on VPS
        echo "🐳 Deploying with Docker Compose..."
        docker-compose -f infra/docker/docker-compose.yml up -d api
    fi
    
    echo "✅ API deployed"
fi

# Deploy Mini App
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "mini-app" ]; then
    echo "⚡ Deploying Mini App..."
    
    # Build
    pnpm --filter @vendy/mini-app build
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production: Vercel
        echo "🚢 Deploying to Vercel..."
        vercel --prod
    else
        # Staging: Vercel preview
        echo "🚢 Deploying to Vercel (preview)..."
        vercel
    fi
    
    echo "✅ Mini App deployed"
fi

# Deploy Bot Parent
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "bot-parent" ]; then
    echo "🤖 Deploying Bot Parent..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production: Railway or VPS
        docker build -t vendy-bot-parent:latest -f infra/docker/Dockerfile.bot-parent .
        railway up --service vendy-bot-parent
    else
        docker-compose -f infra/docker/docker-compose.yml up -d bot-parent
    fi
    
    echo "✅ Bot Parent deployed"
fi

# Deploy Bot Child
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "bot-child" ]; then
    echo "🤖 Deploying Bot Child..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker build -t vendy-bot-child:latest -f infra/docker/Dockerfile.bot-child .
        railway up --service vendy-bot-child
    else
        docker-compose -f infra/docker/docker-compose.yml up -d bot-child
    fi
    
    echo "✅ Bot Child deployed"
fi

echo ""
echo "✅ Deploy complete!"
echo ""
echo "URLs:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  API:       https://api.vendyapp.app"
    echo "  Mini App:  https://app.vendyapp.app"
    echo "  Docs:      https://api.vendyapp.app/docs"
else
    echo "  API:       https://api-staging.vendyapp.app"
    echo "  Mini App:  https://app-staging.vendyapp.app"
    echo "  Docs:      https://api-staging.vendyapp.app/docs"
fi
echo ""
