#!/usr/bin/env bash

set -euo pipefail

REMOTE="${DEPLOY_REMOTE:-root@36.151.148.198}"
SERVICE_DIR="${DEPLOY_VISITOR_COUNTER_DIR:-/opt/blog-stack/services/visitor-counter}"
UNIT_PATH="${DEPLOY_VISITOR_COUNTER_UNIT_PATH:-/etc/systemd/system/visitor-counter.service}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)

cd "$(dirname "$0")/.."

deploy_id="$(date +%Y%m%d%H%M%S)"
remote_script="/tmp/visitor-counter-$deploy_id.py"
remote_unit="/tmp/visitor-counter-$deploy_id.service"

echo "==> 1. Upload visitor counter service artifacts..."
scp "${SSH_OPTS[@]}" server/visitor-counter.py "$REMOTE:$remote_script"
scp "${SSH_OPTS[@]}" deploy/visitor-counter.service "$REMOTE:$remote_unit"

echo "==> 2. Install / restart visitor counter service..."
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "SERVICE_DIR='$SERVICE_DIR' UNIT_PATH='$UNIT_PATH' REMOTE_SCRIPT='$remote_script' REMOTE_UNIT='$remote_unit' bash -se" <<'REMOTE_SCRIPT'
set -euo pipefail

case "$SERVICE_DIR" in
  /opt/blog-stack/services/*) ;;
  *) echo "Refusing unsafe service dir: $SERVICE_DIR" >&2; exit 2 ;;
esac

case "$UNIT_PATH" in
  /etc/systemd/system/*) ;;
  *) echo "Refusing unsafe unit path: $UNIT_PATH" >&2; exit 3 ;;
esac

mkdir -p "$SERVICE_DIR" "$SERVICE_DIR/data"
install -m 0644 "$REMOTE_SCRIPT" "$SERVICE_DIR/visitor-counter.py"
install -m 0644 "$REMOTE_UNIT" "$UNIT_PATH"

systemctl daemon-reload
systemctl enable --now visitor-counter
systemctl restart visitor-counter

python3 - <<'PY'
import urllib.request
payload = urllib.request.urlopen("http://127.0.0.1:3011/api/visitor-count", timeout=5).read()
print(payload.decode("utf-8"))
PY

rm -f "$REMOTE_SCRIPT" "$REMOTE_UNIT"
REMOTE_SCRIPT

echo "==> Visitor counter service installed on $REMOTE"
