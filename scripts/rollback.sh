#!/bin/bash

# ==========================================
# VENDY ROLLBACK SCRIPT
# ==========================================

set -e

ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}
VERSION=${3:-previous}

echo "🔄 Rolling back Vendy"
echo "====================="
echo "Environment: $ENVIRONMENT"
echo "Service: $SERVICE"
echo "Version: $VERSION"
echo ""

# Rollback API
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api" ]; then
    echo "🔥 Rolling back API..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        railway rollback --service vendy-api --version "$VERSION"
    else
        docker-compose -f infra/docker/docker-compose.yml restart api
    fi
    
    echo "✅ API rolled back"
fi

# Rollback Mini App
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "mini-app" ]; then
    echo "⚡ Rolling back Mini App..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel rollback
    else
        echo "⚠️  Mini App rollback not supported in staging"
    fi
    
    echo "✅ Mini App rolled back"
fi

# Rollback Bots
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "bot-parent" ]; then
    echo "🤖 Rolling back Bot Parent..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        railway rollback --service vendy-bot-parent --version "$VERSION"
    else
        docker-compose -f infra/docker/docker-compose.yml restart bot-parent
    fi
    
    echo "✅ Bot Parent rolled back"
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "bot-child" ]; then
    echo "🤖 Rolling back Bot Child..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        railway rollback --service vendy-bot-child --version "$VERSION"
    else
        docker-compose -f infra/docker/docker-compose.yml restart bot-child
    fi
    
    echo "✅ Bot Child rolled back"
fi

echo ""
echo "✅ Rollback complete!"
