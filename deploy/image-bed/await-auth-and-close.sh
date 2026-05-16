#!/usr/bin/env bash
set -euo pipefail

REMOTE_METADATA_HOST="${REMOTE_METADATA_HOST:-${JDCLOUD_METADATA_SSH_HOST:-jdcloud-blog}}"
POLL_SECONDS="${POLL_SECONDS:-60}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-120}"
EXPECTED_IP="${EXPECTED_IP:-36.151.148.198}"
ROOT_DOMAIN="${ROOT_DOMAIN:-woodfish.site}"
HOST_RECORD="${HOST_RECORD:-img}"
PROBE_FILE="${PROBE_FILE:-}"
TOKEN="${TOKEN:-}"
ACCESS_KEY_ID="${JDCLOUD_ACCESS_KEY_ID:-}"
SECRET_ACCESS_KEY="${JDCLOUD_SECRET_ACCESS_KEY:-}"
SESSION_TOKEN="${JDCLOUD_SESSION_TOKEN:-${JDCLOUD_SECURITY_TOKEN:-${JDCLOUD_TOKEN:-}}}"

usage() {
  cat <<'EOF'
Usage:
  bash deploy/image-bed/await-auth-and-close.sh [options]

Options:
  --remote-metadata-host <host>  SSH host for metadata probe (default: jdcloud-blog)
  --poll-seconds <n>             Poll interval seconds (default: 60)
  --max-attempts <n>             Max attempts (default: 120)
  --expected-ip <ip>             Expected DNS A (default: 36.151.148.198)
  --root-domain <domain>         DNS root domain (default: woodfish.site)
  --host-record <rr>             Host record (default: img)
  --probe-file <path>            Optional upload probe file
  --token <muyu_token>           Optional api token for smoke
  --ak <access_key_id>           Optional explicit AK
  --sk <secret_access_key>       Optional explicit SK
  --session-token <token>        Optional explicit session token
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote-metadata-host)
      REMOTE_METADATA_HOST="${2:-}"
      shift 2
      ;;
    --poll-seconds)
      POLL_SECONDS="${2:-}"
      shift 2
      ;;
    --max-attempts)
      MAX_ATTEMPTS="${2:-}"
      shift 2
      ;;
    --expected-ip)
      EXPECTED_IP="${2:-}"
      shift 2
      ;;
    --root-domain)
      ROOT_DOMAIN="${2:-}"
      shift 2
      ;;
    --host-record)
      HOST_RECORD="${2:-}"
      shift 2
      ;;
    --probe-file)
      PROBE_FILE="${2:-}"
      shift 2
      ;;
    --token)
      TOKEN="${2:-}"
      shift 2
      ;;
    --ak|--access-key-id)
      ACCESS_KEY_ID="${2:-}"
      shift 2
      ;;
    --sk|--secret-access-key)
      SECRET_ACCESS_KEY="${2:-}"
      shift 2
      ;;
    --session-token)
      SESSION_TOKEN="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown arg: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! [[ "$POLL_SECONDS" =~ ^[0-9]+$ ]] || (( POLL_SECONDS < 5 )); then
  echo "POLL_SECONDS must be integer >= 5" >&2
  exit 2
fi
if ! [[ "$MAX_ATTEMPTS" =~ ^[0-9]+$ ]] || (( MAX_ATTEMPTS < 1 )); then
  echo "MAX_ATTEMPTS must be integer >= 1" >&2
  exit 2
fi

has_explicit_creds() {
  [[ -n "${ACCESS_KEY_ID}" && -n "${SECRET_ACCESS_KEY}" ]] && return 0
  [[ -n "${JDCLOUD_ACCESS_KEY_ID:-}" && -n "${JDCLOUD_SECRET_ACCESS_KEY:-}" ]] && return 0
  return 1
}

test_remote_role_creds_ready() {
  [[ -n "${REMOTE_METADATA_HOST}" ]] || return 1
  local raw
  raw="$(ssh "${REMOTE_METADATA_HOST}" "curl -sS -m 8 http://169.254.169.254/metadata/latest/iam/instance-role-security-credentials" 2>/dev/null || true)"
  [[ -n "${raw}" ]] || return 1
  echo "${raw}" | node -e "
    const fs=require('fs');
    const s=fs.readFileSync(0,'utf8').trim();
    let o=null; try { o=JSON.parse(s); } catch { process.exit(1); }
    const ok = String(o.Code||'').toLowerCase()==='success' && String(o.accessKey||'') && String(o.secretKey||'');
    process.exit(ok?0:1);
  " >/dev/null 2>&1
}

for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  echo "[${i}/${MAX_ATTEMPTS}] probing authority path..."
  if has_explicit_creds || test_remote_role_creds_ready; then
    echo "authority ready -> running close-wave5-with-dns-api"
    if [[ -n "${ACCESS_KEY_ID}" ]]; then export JDCLOUD_ACCESS_KEY_ID="${ACCESS_KEY_ID}"; fi
    if [[ -n "${SECRET_ACCESS_KEY}" ]]; then export JDCLOUD_SECRET_ACCESS_KEY="${SECRET_ACCESS_KEY}"; fi
    if [[ -n "${SESSION_TOKEN}" ]]; then export JDCLOUD_SESSION_TOKEN="${SESSION_TOKEN}"; fi
    if [[ -n "${TOKEN}" ]]; then export TOKEN="${TOKEN}"; fi
    if [[ -n "${REMOTE_METADATA_HOST}" ]]; then export JDCLOUD_METADATA_SSH_HOST="${REMOTE_METADATA_HOST}"; fi

    close_rc=0
    if [[ -n "${PROBE_FILE}" ]]; then
      if EXPECTED_IP="${EXPECTED_IP}" ROOT_DOMAIN="${ROOT_DOMAIN}" HOST_RECORD="${HOST_RECORD}" \
        bash "$(dirname "$0")/close-wave5-with-dns-api.sh" --probe-file "${PROBE_FILE}"; then
        close_rc=0
      else
        close_rc=$?
      fi
    else
      if EXPECTED_IP="${EXPECTED_IP}" ROOT_DOMAIN="${ROOT_DOMAIN}" HOST_RECORD="${HOST_RECORD}" \
        bash "$(dirname "$0")/close-wave5-with-dns-api.sh"; then
        close_rc=0
      else
        close_rc=$?
      fi
    fi

    if (( close_rc == 0 )); then
      echo "running section43 audit..."
      if bash "$(dirname "$0")/section43-audit.sh"; then
        echo "Section 43 gate satisfied."
        exit 0
      else
        close_rc=$?
      fi
      echo "section43 audit still pending (rc=${close_rc}); will retry if attempts remain." >&2
    else
      echo "close-wave5-with-dns-api still pending (rc=${close_rc}); will retry if attempts remain." >&2
    fi

    if (( i < MAX_ATTEMPTS )); then
      sleep "${POLL_SECONDS}"
      continue
    fi

    exit "${close_rc}"
  fi

  if (( i < MAX_ATTEMPTS )); then
    sleep "${POLL_SECONDS}"
    continue
  fi
  echo "Authority not ready after ${MAX_ATTEMPTS} attempts (no AK/SK and no usable instance-role creds)." >&2
  exit 1
done
