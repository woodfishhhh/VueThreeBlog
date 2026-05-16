#!/usr/bin/env bash
set -euo pipefail

# One-shot closer:
# 1) Upsert JDCloud DNS A record for img.woodfish.site
# 2) Run existing DNS/TLS/public close checks
#
# Credential source (priority in jdcloud-dns-upsert.cjs):
#   --ak/--sk[/--token]
#   or env JDCLOUD_ACCESS_KEY_ID/JDCLOUD_SECRET_ACCESS_KEY[/JDCLOUD_SESSION_TOKEN]
#   or metadata instance-role endpoint on VPS
# Optional env:
#   TOKEN          (admin token for upload/delete smoke)
#   REMOTE, DOMAIN, EXPECTED_IP, BASE_URL
#
# Usage:
#   TOKEN='muyu_xxx' JDCLOUD_ACCESS_KEY_ID='ak' JDCLOUD_SECRET_ACCESS_KEY='sk' \
#   bash deploy/image-bed/close-wave5-with-dns-api.sh ./test-unique.png
#   bash deploy/image-bed/close-wave5-with-dns-api.sh --ak 'ak' --sk 'sk' --probe-file ./test-unique.png

DOMAIN="${DOMAIN:-img.woodfish.site}"
EXPECTED_IP="${EXPECTED_IP:-36.151.148.198}"
ROOT_DOMAIN="${ROOT_DOMAIN:-woodfish.site}"
HOST_RECORD="${HOST_RECORD:-img}"
REMOTE_METADATA_HOST="${JDCLOUD_METADATA_SSH_HOST:-${REMOTE:-jdcloud-blog}}"
PROBE_FILE=""
ACCESS_KEY_ID="${JDCLOUD_ACCESS_KEY_ID:-}"
SECRET_ACCESS_KEY="${JDCLOUD_SECRET_ACCESS_KEY:-}"
SESSION_TOKEN="${JDCLOUD_SESSION_TOKEN:-${JDCLOUD_SECURITY_TOKEN:-${JDCLOUD_TOKEN:-}}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ak|--access-key-id)
      ACCESS_KEY_ID="${2:-}"
      shift 2
      ;;
    --sk|--secret-access-key)
      SECRET_ACCESS_KEY="${2:-}"
      shift 2
      ;;
    --token|--session-token)
      SESSION_TOKEN="${2:-}"
      shift 2
      ;;
    --probe-file)
      PROBE_FILE="${2:-}"
      shift 2
      ;;
    --help|-h)
      cat <<'USAGE'
Usage:
  bash deploy/image-bed/close-wave5-with-dns-api.sh [--ak <AK> --sk <SK>] [--probe-file <FILE>|<FILE>]
USAGE
      exit 0
      ;;
    *)
      if [[ -z "$PROBE_FILE" ]]; then
        PROBE_FILE="$1"
        shift 1
      else
        echo "unknown argument: $1" >&2
        exit 2
      fi
      ;;
  esac
done

if [[ -n "$ACCESS_KEY_ID" && -n "$SECRET_ACCESS_KEY" ]]; then
  export JDCLOUD_ACCESS_KEY_ID="$ACCESS_KEY_ID"
  export JDCLOUD_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
  if [[ -n "$SESSION_TOKEN" ]]; then
    export JDCLOUD_SESSION_TOKEN="$SESSION_TOKEN"
  fi
else
  echo "no explicit AK/SK provided; will fallback to metadata instance-role credentials if available" >&2
fi
if [[ -n "$REMOTE_METADATA_HOST" ]]; then
  export JDCLOUD_METADATA_SSH_HOST="$REMOTE_METADATA_HOST"
fi

echo "== 1/2 upsert DNS via JDCloud OpenAPI"
dns_args=(
  --domain "$ROOT_DOMAIN"
  --rr "$HOST_RECORD"
  --type A
  --value "$EXPECTED_IP"
)
if [[ -n "$ACCESS_KEY_ID" && -n "$SECRET_ACCESS_KEY" ]]; then
  dns_args+=(--ak "$ACCESS_KEY_ID" --sk "$SECRET_ACCESS_KEY")
  if [[ -n "$SESSION_TOKEN" ]]; then
    dns_args+=(--token "$SESSION_TOKEN")
  fi
fi
bash "$(dirname "$0")/jdcloud-dns-upsert.sh" "${dns_args[@]}"

echo "== 2/2 finalize + strict checks"
if [[ -n "${TOKEN:-}" && -n "$PROBE_FILE" ]]; then
  TOKEN="$TOKEN" bash "$(dirname "$0")/close-wave5-after-dns.sh" "$PROBE_FILE"
else
  bash "$(dirname "$0")/close-wave5-after-dns.sh"
fi
