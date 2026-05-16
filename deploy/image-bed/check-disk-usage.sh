#!/usr/bin/env bash
set -euo pipefail

IMAGE_ROOT="${IMAGE_ROOT:-/srv/muyu-images}"
DATA_ROOT="${DATA_ROOT:-/srv/muyu-data}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/muyu-backups}"
DISK_WARN_PERCENT="${DISK_WARN_PERCENT:-85}"

echo "== disk free =="
df -h "$IMAGE_ROOT" "$DATA_ROOT" "$BACKUP_ROOT" || true
echo
echo "== directory usage =="
du -sh "$IMAGE_ROOT" "$DATA_ROOT" "$BACKUP_ROOT" || true
echo
echo "== quota warning (>= ${DISK_WARN_PERCENT}%) =="
warned=0
for target in "$IMAGE_ROOT" "$DATA_ROOT" "$BACKUP_ROOT"; do
  usage="$(df -P "$target" 2>/dev/null | awk 'NR==2 { gsub("%", "", $5); print $5 }')"
  if [[ -z "$usage" ]]; then
    echo "WARN: unable to read filesystem usage for $target"
    warned=1
    continue
  fi

  if (( usage >= DISK_WARN_PERCENT )); then
    echo "WARN: $target is ${usage}% full (threshold ${DISK_WARN_PERCENT}%)"
    warned=1
  else
    echo "OK: $target is ${usage}% full"
  fi
done

if (( warned == 1 )); then
  echo "quota warning detected"
fi
