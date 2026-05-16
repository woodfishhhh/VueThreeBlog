#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-/srv/muyu-backups}"
SQLITE_PATH="${SQLITE_PATH:-/srv/muyu-data/muyu.sqlite}"
IMAGE_ROOT="${IMAGE_ROOT:-/srv/muyu-images}"

mkdir -p "$BACKUP_DIR"

sqlite3 "$SQLITE_PATH" ".backup '$BACKUP_DIR/muyu-$STAMP.sqlite'"
find "$IMAGE_ROOT" -type f | sed "s#^$IMAGE_ROOT/##" > "$BACKUP_DIR/muyu-images-$STAMP.manifest.txt"
tar -czf "$BACKUP_DIR/muyu-images-$STAMP.tgz" -C "$IMAGE_ROOT" .

echo "backup done: $BACKUP_DIR"
