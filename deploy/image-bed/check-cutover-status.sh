#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-img.woodfish.site}"
EXPECTED_IP="${EXPECTED_IP:-36.151.148.198}"
BASE_URL="${BASE_URL:-https://${DOMAIN}}"

say() {
  printf '%s\n' "$*"
}

ok() {
  printf '[PASS] %s\n' "$*"
}

fail() {
  printf '[FAIL] %s\n' "$*"
}

warn() {
  printf '[WARN] %s\n' "$*"
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

check_dns() {
  local out_cf out_gg
  out_cf="$(nslookup "$DOMAIN" 1.1.1.1 2>/dev/null || true)"
  out_gg="$(nslookup "$DOMAIN" 8.8.8.8 2>/dev/null || true)"
  if grep -Eq "Address:[[:space:]]*${EXPECTED_IP}" <<<"$out_cf" || grep -Eq "Address:[[:space:]]*${EXPECTED_IP}" <<<"$out_gg"; then
    ok "public DNS includes ${EXPECTED_IP}"
    return 0
  fi
  fail "public DNS does not include ${EXPECTED_IP}"
  say "--- nslookup(1.1.1.1) ---"
  say "$out_cf"
  say "--- nslookup(8.8.8.8) ---"
  say "$out_gg"
  return 1
}

check_cert() {
  local cert_dir="/etc/letsencrypt/live/${DOMAIN}"
  if [[ -f "${cert_dir}/fullchain.pem" && -f "${cert_dir}/privkey.pem" ]]; then
    ok "certificate files exist: ${cert_dir}"
  else
    fail "certificate files missing: ${cert_dir}"
    return 1
  fi
}

check_public_health() {
  if curl -fsS "${BASE_URL}/api/health" >/dev/null 2>&1; then
    ok "public health endpoint reachable without overrides"
  else
    fail "public health endpoint failed: ${BASE_URL}/api/health"
    return 1
  fi
}

check_timer() {
  if has_cmd systemctl; then
    local t_active s_active
    t_active="$(systemctl is-active muyu-dns-tls-finalize.timer 2>/dev/null || true)"
    s_active="$(systemctl is-active muyu-dns-tls-finalize.service 2>/dev/null || true)"
    if [[ "$t_active" == "active" ]]; then
      ok "muyu-dns-tls-finalize.timer active"
    else
      warn "muyu-dns-tls-finalize.timer not active (${t_active:-unknown})"
    fi
    say "service state: ${s_active:-unknown}"
  else
    warn "systemctl unavailable; skip timer check"
  fi
}

main() {
  local failed=0
  say "Domain: ${DOMAIN}"
  say "Expected IP: ${EXPECTED_IP}"
  say "Base URL: ${BASE_URL}"
  say ""

  check_timer || true
  check_dns || failed=1
  check_cert || failed=1
  check_public_health || failed=1

  say ""
  if [[ "$failed" -eq 0 ]]; then
    ok "cutover status: ready/complete"
  else
    fail "cutover status: blocked"
    exit 1
  fi
}

main "$@"
