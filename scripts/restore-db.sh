#!/bin/bash
# ==========================================
# RESTORE DE BASE DE DATOS
# ==========================================
# Uso: ./scripts/restore-db.sh backup_20240615_120000.sql.gz

set -e

# Configuración
DB_NAME="${DB_NAME:-vendy}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Uso: $0 <nombre_backup>"
    echo "   Backups disponibles:"
    ls -1 "$BACKUP_DIR"/*.sql.gz 2> /dev/null || echo "   (ninguno)"
    exit 1
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Backup no encontrado: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENCIÓN: Esto eliminará todos los datos actuales de la base de datos"
echo "   DB: $DB_NAME"
echo "   Backup: $BACKUP_DIR/$BACKUP_FILE"
echo ""
read -p "¿Estás seguro? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo "=========================================="
echo "  Restore de Base de Datos"
echo "=========================================="

# Verificar conexión
echo "Verificando conexión..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "❌ No se puede conectar a PostgreSQL"
    exit 1
fi

# Eliminar y recrear base de datos
echo "Recreando base de datos..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore
echo "Restaurando backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_DIR/$BACKUP_FILE"
fi

echo "✅ Restore completado"
