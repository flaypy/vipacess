#!/bin/bash

# ===================================================
# PostgreSQL Restore Script for Telegram Secrets
# ===================================================
# Usage: ./scripts/restore-database.sh [backup_file]
# If no file specified, restores from latest backup

set -e

# Configuration
BACKUP_DIR="/var/backups/telegram-secrets"
CONTAINER_NAME="telegram_secrets_db"
DB_NAME="${POSTGRES_DB:-telegram_secrets_db}"
DB_USER="${POSTGRES_USER:-telegram_secrets}"

# Determine backup file
if [ -z "$1" ]; then
    BACKUP_FILE="$BACKUP_DIR/latest.sql.gz"
    echo "No backup file specified, using latest: $BACKUP_FILE"
else
    BACKUP_FILE="$1"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=========================================="
echo "DANGER: Database Restore Operation"
echo "=========================================="
echo "This will REPLACE the current database with:"
echo "  File: $BACKUP_FILE"
echo "  Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "=========================================="
echo "Starting database restore"
echo "Time: $(date)"
echo "=========================================="

# Stop application containers
echo "Stopping application containers..."
docker-compose -f docker-compose.prod.yml stop backend frontend

# Restore database
echo "Restoring database from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres

if [ $? -eq 0 ]; then
    echo "✓ Database restored successfully"
else
    echo "✗ Restore failed!"
    exit 1
fi

# Start application containers
echo "Starting application containers..."
docker-compose -f docker-compose.prod.yml start backend frontend

echo "=========================================="
echo "Restore completed successfully"
echo "=========================================="
