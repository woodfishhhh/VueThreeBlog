#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/srv/muyu-backups}"
DRY_RUN_DIR="${DRY_RUN_DIR:-/tmp/muyu-restore-dry-run}"

SQLITE_BACKUP="${1:-}"
IMAGE_TARBALL="${2:-}"

if [[ -z "$SQLITE_BACKUP" || -z "$IMAGE_TARBALL" ]]; then
  echo "usage: restore-muyu-dry-run.sh <sqlite-backup-file> <image-tarball-file>" >&2
  exit 2
fi

if [[ ! -f "$SQLITE_BACKUP" || ! -f "$IMAGE_TARBALL" ]]; then
  echo "backup files not found" >&2
  exit 2
fi

rm -rf "$DRY_RUN_DIR"
mkdir -p "$DRY_RUN_DIR/db" "$DRY_RUN_DIR/images"

cp "$SQLITE_BACKUP" "$DRY_RUN_DIR/db/muyu.sqlite"
tar -xzf "$IMAGE_TARBALL" -C "$DRY_RUN_DIR/images"

sqlite3 "$DRY_RUN_DIR/db/muyu.sqlite" "SELECT COUNT(*) AS image_count FROM images;" >/dev/null
sqlite3 "$DRY_RUN_DIR/db/muyu.sqlite" "SELECT COUNT(*) AS variant_count FROM image_variants;" >/dev/null

echo "restore dry-run passed: $DRY_RUN_DIR"
echo "you can now inspect files under $DRY_RUN_DIR"
