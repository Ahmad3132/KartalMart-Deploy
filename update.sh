#!/bin/bash
# ============================================================
# KARTAL MART - Safe Update Script
# Run this on the server after pushing new code to GitHub
# Usage: bash update.sh
# ============================================================

set -e

APP_DIR="/root/KartalMart-Deploy"
BACKUP_DIR="$APP_DIR/backups"
DB_FILE="$APP_DIR/data/lucky_draw.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "  KARTAL MART - Safe Update"
echo "  $(date)"
echo "=========================================="

cd "$APP_DIR"

# Step 1: Backup database BEFORE anything else
echo ""
echo "[1/6] Backing up database..."
mkdir -p "$BACKUP_DIR"
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/lucky_draw_$TIMESTAMP.db"
    echo "  ✓ Database backed up to: backups/lucky_draw_$TIMESTAMP.db"
else
    echo "  ⚠ No database found (first deploy?)"
fi

# Step 2: Backup uploads
echo ""
echo "[2/6] Backing up uploads..."
if [ -d "$APP_DIR/uploads" ] && [ "$(ls -A $APP_DIR/uploads 2>/dev/null)" ]; then
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "$APP_DIR" uploads/
    echo "  ✓ Uploads backed up"
else
    echo "  ⚠ No uploads to backup"
fi

# Step 3: Pull latest code from GitHub
echo ""
echo "[3/6] Pulling latest code from GitHub..."
git stash 2>/dev/null || true
git pull origin main
echo "  ✓ Code updated"

# Step 4: Install any new dependencies
echo ""
echo "[4/6] Installing dependencies..."
npm install --production=false
echo "  ✓ Dependencies installed"

# Step 5: Build frontend
echo ""
echo "[5/6] Building frontend..."
NODE_OPTIONS="--max-old-space-size=1024" npm run build
echo "  ✓ Frontend built"

# Step 6: Restart the app (database is preserved!)
echo ""
echo "[6/6] Restarting app..."
pm2 restart kartal-mart
sleep 3
pm2 status

echo ""
echo "=========================================="
echo "  ✅ Update complete!"
echo "  Database: PRESERVED (backup at backups/lucky_draw_$TIMESTAMP.db)"
echo "  Uploads: PRESERVED"
echo "=========================================="

# Clean up old backups (keep last 30)
cd "$BACKUP_DIR"
ls -t lucky_draw_*.db 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true
echo "  Old backups cleaned (keeping last 30)"
