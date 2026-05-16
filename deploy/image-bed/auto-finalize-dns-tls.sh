#!/usr/bin/env bash
set -euo pipefail

FLAG_FILE="${FLAG_FILE:-/opt/muyu-image-bed/.dns_tls_done}"
LOG_FILE="${LOG_FILE:-/opt/muyu-image-bed/logs/dns-tls-finalize.log}"
EXPECTED_IP="${EXPECTED_IP:-36.151.148.198}"
DOMAIN="${DOMAIN:-img.woodfish.site}"
FINALIZE_SCRIPT="${FINALIZE_SCRIPT:-/opt/muyu-image-bed/finalize-dns-tls.sh}"

mkdir -p "$(dirname "$LOG_FILE")"

if [[ -f "$FLAG_FILE" ]]; then
  exit 0
fi

{
  echo "[$(date -Is)] auto-finalize attempt start"
} >>"$LOG_FILE"

if EXPECTED_IP="$EXPECTED_IP" DOMAIN="$DOMAIN" "$FINALIZE_SCRIPT" >>"$LOG_FILE" 2>&1; then
  {
    echo "[$(date -Is)] auto-finalize success"
  } >>"$LOG_FILE"
  touch "$FLAG_FILE"
else
  code=$?
  {
    echo "[$(date -Is)] auto-finalize pending/fail exit=$code"
  } >>"$LOG_FILE"
  exit 0
fi
