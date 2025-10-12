#!/bin/bash

# ===================================================
# PostgreSQL Backup Script for Telegram Secrets
# ===================================================
# This script creates automated database backups
# Usage: ./scripts/backup-database.sh
# Setup cron: 0 2 * * * /path/to/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/var/backups/telegram-secrets"
CONTAINER_NAME="telegram_secrets_db"
DB_NAME="${POSTGRES_DB:-telegram_secrets_db}"
DB_USER="${POSTGRES_USER:-telegram_secrets}"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/telegram_secrets_${TIMESTAMP}.sql.gz"

echo "=========================================="
echo "Starting database backup"
echo "Time: $(date)"
echo "=========================================="

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --clean \
    --if-exists \
    --create \
    --verbose \
    | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✓ Backup completed successfully"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Delete old backups
echo "Cleaning up old backups (retention: ${RETENTION_DAYS} days)"
find "$BACKUP_DIR" -name "telegram_secrets_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
echo "  Remaining backups: $(ls -1 "$BACKUP_DIR" | wc -l)"

# Create a symlink to the latest backup
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest.sql.gz"

echo "=========================================="
echo "Backup completed successfully"
echo "=========================================="
