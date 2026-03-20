#!/bin/bash
# ============================================================
# KARTAL MART - Automatic Daily Backup
# Set up with: crontab -e
# Add: 0 2 * * * /root/KartalMart-Deploy/backup.sh
# Runs daily at 2:00 AM, keeps last 30 backups
# ============================================================

APP_DIR="/root/KartalMart-Deploy"
BACKUP_DIR="$APP_DIR/backups"
DB_FILE="$APP_DIR/data/lucky_draw.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/auto_backup_$TIMESTAMP.db"
    echo "[$(date)] Backup created: auto_backup_$TIMESTAMP.db"

    # Keep only last 30 backups
    cd "$BACKUP_DIR"
    ls -t auto_backup_*.db 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null
else
    echo "[$(date)] ERROR: Database not found at $DB_FILE"
fi
