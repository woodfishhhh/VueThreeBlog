#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-$(pwd)}"
TARGET_DIR="/opt/muyu-image-bed"

install -d "$TARGET_DIR" "$TARGET_DIR/logs"
install -m 755 "$REPO_ROOT/deploy/image-bed/finalize-dns-tls.sh" "$TARGET_DIR/finalize-dns-tls.sh"
install -m 755 "$REPO_ROOT/deploy/image-bed/auto-finalize-dns-tls.sh" "$TARGET_DIR/auto-finalize-dns-tls.sh"
install -m 644 "$REPO_ROOT/deploy/image-bed/muyu-dns-tls-finalize.service" /etc/systemd/system/muyu-dns-tls-finalize.service
install -m 644 "$REPO_ROOT/deploy/image-bed/muyu-dns-tls-finalize.timer" /etc/systemd/system/muyu-dns-tls-finalize.timer

systemctl daemon-reload
systemctl enable --now muyu-dns-tls-finalize.timer
systemctl start muyu-dns-tls-finalize.service || true

echo "installed dns/tls finalizer timer"
systemctl status --no-pager muyu-dns-tls-finalize.timer | sed -n '1,40p'
