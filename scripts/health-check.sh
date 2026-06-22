#!/bin/bash
# ==========================================
# HEALTH CHECK DE VENDY
# ==========================================
# Uso: ./scripts/health-check.sh

set -e

API_URL="${API_URL:-http://localhost:3001}"
TIMEOUT=5

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" | grep -q "200\|201"; then
        echo -e "${GREEN}✅ $name: OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FAIL${NC}"
        return 1
    fi
}

echo "=========================================="
echo "  Health Check de Vendy"
echo "  API: $API_URL"
echo "  Fecha: $(date)"
echo "=========================================="
echo ""

# API Health
check_endpoint "$API_URL/health" "API Health"

# Database
check_endpoint "$API_URL/health/db" "Database"

# Redis
check_endpoint "$API_URL/health/redis" "Redis"

# Bots (si están expuestos)
if curl -s --max-time $TIMEOUT "$API_URL/health/bots" > /dev/null 2>&1; then
    check_endpoint "$API_URL/health/bots" "Bots"
fi

echo ""
echo "=========================================="

# Verificar Docker containers
echo ""
echo "Containers Docker:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2> /dev/null || echo "Docker Compose no disponible"

echo ""
echo "=========================================="
