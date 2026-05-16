#!/usr/bin/env bash
set -euo pipefail

# One-shot closer for Wave 5 after DNS is ready.
# Usage:
#   TOKEN='muyu_xxx' bash deploy/image-bed/close-wave5-after-dns.sh /path/to/probe.png
# Optional env:
#   REMOTE=root@36.151.148.198
#   REMOTE_ROOT=/opt/muyu-image-bed
#   DOMAIN=img.woodfish.site
#   EXPECTED_IP=36.151.148.198
#   BASE_URL=https://img.woodfish.site

REMOTE="${REMOTE:-root@36.151.148.198}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/muyu-image-bed}"
DOMAIN="${DOMAIN:-img.woodfish.site}"
EXPECTED_IP="${EXPECTED_IP:-36.151.148.198}"
BASE_URL="${BASE_URL:-https://img.woodfish.site}"

PROBE_FILE="${1:-}"
TOKEN="${TOKEN:-}"

echo "== 1/4 pre-check (remote cutover status)"
ssh "$REMOTE" "$REMOTE_ROOT/check-cutover-status.sh || true"

echo "== 2/4 finalize DNS/TLS (idempotent)"
ssh "$REMOTE" "EXPECTED_IP='$EXPECTED_IP' DOMAIN='$DOMAIN' $REMOTE_ROOT/finalize-dns-tls.sh"

echo "== 3/4 strict public health check"
curl -fsS "$BASE_URL/api/health"

echo "== 4/4 optional public upload smoke"
if [[ -n "$TOKEN" && -n "$PROBE_FILE" ]]; then
  if [[ ! -f "$PROBE_FILE" ]]; then
    echo "probe file not found: $PROBE_FILE" >&2
    exit 2
  fi
  TOKEN="$TOKEN" BASE_URL="$BASE_URL" bash "$(dirname "$0")/smoke-prod.sh" "$PROBE_FILE"
else
  echo "skip smoke (set TOKEN and probe file to enable)"
fi

echo "wave5 close check done"
