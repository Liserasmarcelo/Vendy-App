#!/bin/bash
set -e

echo "🗄️  Vendy — Migraciones de Base de Datos"
echo "=========================================="

cd apps/api

if [ "$1" = "dev" ]; then
    echo "🔄 Ejecutando migraciones en modo desarrollo..."
    pnpm prisma migrate dev
elif [ "$1" = "prod" ]; then
    echo "🚀 Ejecutando migraciones en modo producción..."
    pnpm prisma migrate deploy
elif [ "$1" = "reset" ]; then
    echo "⚠️  Resetear base de datos? Esto borrará todos los datos. (y/N)"
    read -r confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        pnpm prisma migrate reset --force
    else
        echo "❌ Cancelado."
        exit 0
    fi
elif [ "$1" = "studio" ]; then
    echo "🎨 Abriendo Prisma Studio..."
    pnpm prisma studio
else
    echo "Uso: ./scripts/migrate.sh [dev|prod|reset|studio]"
    echo ""
    echo "  dev     - Migraciones en desarrollo (con prompts)"
    echo "  prod    - Deploy de migraciones (sin prompts)"
    echo "  reset   - Resetear base de datos (⚠️  destructivo)"
    echo "  studio  - Abrir Prisma Studio"
    exit 1
fi
