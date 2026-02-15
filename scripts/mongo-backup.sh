#!/usr/bin/env bash
# MongoDB backup script for CleanupCrew.
# Uses mongodump (MongoDB Database Tools). Set MONGO_URI in environment or .env.
#
# Usage:
#   ./scripts/mongo-backup.sh [output_dir]
# Example cron (daily at 2 AM):
#   0 2 * * * cd /path/to/MiniProj && . ./.env 2>/dev/null; ./scripts/mongo-backup.sh /backups/cleanupcrew

set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${OUTPUT_DIR}/${TIMESTAMP}"

if [ -z "${MONGO_URI:-}" ]; then
  echo "Error: MONGO_URI is not set. Export it or source .env." >&2
  exit 1
fi

mkdir -p "$BACKUP_PATH"
echo "Backing up to $BACKUP_PATH ..."
mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH"
echo "Backup completed: $BACKUP_PATH"
