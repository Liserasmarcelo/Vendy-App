#!/bin/bash
# ==========================================
# BACKUP DE BASE DE DATOS
# ==========================================
# Uso: ./scripts/backup-db.sh [nombre_backup]

set -e

# Configuración
DB_NAME="${DB_NAME:-vendy}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_NAME="${1:-backup_$(date +%Y%m%d_%H%M%S)}"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "  Backup de Base de Datos"
echo "  DB: $DB_NAME"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Backup: $BACKUP_DIR/$BACKUP_NAME.sql.gz"
echo "=========================================="

# Verificar conexión
echo "Verificando conexión..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "❌ No se puede conectar a PostgreSQL"
    exit 1
fi

# Ejecutar backup
echo "Ejecutando backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_NAME.sql.gz"

# Verificar backup
if [ -f "$BACKUP_DIR/$BACKUP_NAME.sql.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.sql.gz" | cut -f1)
    echo "✅ Backup completado: $BACKUP_DIR/$BACKUP_NAME.sql.gz ($SIZE)"
else
    echo "❌ Error al crear backup"
    exit 1
fi

# Eliminar backups antiguos (mantener 7 días)
echo "Limpiando backups antiguos..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ Proceso completado"
