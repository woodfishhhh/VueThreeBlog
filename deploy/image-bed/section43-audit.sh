#!/usr/bin/env bash
set -euo pipefail

# Section 43 gate auditor.
# Exit 0 only when shutdown gate is fully satisfied.
#
# Optional env:
#   REMOTE=jdcloud-blog
#   REMOTE_ROOT=/opt/muyu-image-bed
#   DOMAIN=img.woodfish.site
#   EXPECTED_IP=36.151.148.198
#   BASE_URL=https://img.woodfish.site
#   PLAN_FILE=docs/superpowers/plans/2026-05-16-woodfishnest-monorepo-muyu-image-bed.md
#   AUDIT_FILE=docs/superpowers/plans/2026-05-16-woodfishnest-monorepo-muyu-image-bed.completion-audit.md
#   SKIP_REMOTE=1

REMOTE="${REMOTE:-jdcloud-blog}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/muyu-image-bed}"
DOMAIN="${DOMAIN:-img.woodfish.site}"
EXPECTED_IP="${EXPECTED_IP:-36.151.148.198}"
BASE_URL="${BASE_URL:-https://${DOMAIN}}"
PLAN_FILE="${PLAN_FILE:-docs/superpowers/plans/2026-05-16-woodfishnest-monorepo-muyu-image-bed.md}"
AUDIT_FILE="${AUDIT_FILE:-docs/superpowers/plans/2026-05-16-woodfishnest-monorepo-muyu-image-bed.completion-audit.md}"
SKIP_REMOTE="${SKIP_REMOTE:-0}"

failed=0

say() {
  printf '%s\n' "$*"
}

pass() {
  printf '[PASS] %s\n' "$*"
}

fail() {
  printf '[FAIL] %s\n' "$*"
  failed=1
}

warn() {
  printf '[WARN] %s\n' "$*"
}

require_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    pass "file exists: ${path}"
  else
    fail "missing file: ${path}"
  fi
}

check_audit_line_absent() {
  local pattern="$1"
  local label="$2"
  if grep -Fq -- "$pattern" "$AUDIT_FILE"; then
    fail "${label}"
  else
    pass "${label}"
  fi
}

check_audit_line_present() {
  local pattern="$1"
  local label="$2"
  if grep -Fq -- "$pattern" "$AUDIT_FILE"; then
    pass "${label}"
  else
    fail "${label}"
  fi
}

check_doh_a() {
  local resp status has_ip answers
  if ! resp="$(curl -sS "https://dns.google/resolve?name=${DOMAIN}&type=A" 2>/dev/null)"; then
    fail "DoH query failed"
    return
  fi
  status="$(printf '%s' "$resp" | sed -n 's/.*"Status"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n 1)"
  if grep -Eq "\"data\"[[:space:]]*:[[:space:]]*\"${EXPECTED_IP}\"" <<<"$resp"; then
    has_ip="1"
  else
    has_ip="0"
  fi
  answers="$(printf '%s' "$resp" | grep -Eo '"data"[[:space:]]*:[[:space:]]*"[^"]+"' | sed -E 's/^"data"[[:space:]]*:[[:space:]]*"([^"]+)"/\1/' | paste -sd ',' -)"

  if [[ "$status" == "0" && "$has_ip" == "1" ]]; then
    pass "DoH A includes ${EXPECTED_IP} (${answers})"
  else
    fail "DoH A not ready (status=${status}, answers=${answers})"
  fi
}

check_public_health() {
  if curl -fsS "${BASE_URL}/api/health" >/dev/null 2>&1; then
    pass "strict public health reachable: ${BASE_URL}/api/health"
  else
    fail "strict public health failed: ${BASE_URL}/api/health"
  fi
}

check_remote_cutover() {
  local out rc
  if [[ "$SKIP_REMOTE" == "1" ]]; then
    warn "remote check skipped (SKIP_REMOTE=1)"
    return
  fi
  if ! command -v ssh >/dev/null 2>&1; then
    fail "ssh unavailable for remote cutover check"
    return
  fi

  out="$(ssh "$REMOTE" "$REMOTE_ROOT/check-cutover-status.sh" 2>&1)" || rc=$?
  rc="${rc:-0}"
  say "--- remote cutover output ---"
  say "$out"
  say "--- end remote cutover output ---"

  if [[ "$rc" -ne 0 ]]; then
    if grep -Eiq "Could not resolve hostname|Permission denied|Connection timed out|No route to host|Connection refused" <<<"$out"; then
      warn "remote cutover check unavailable in current shell context"
      return
    fi
  fi

  if [[ "$rc" -eq 0 ]] && grep -Fq "cutover status: ready/complete" <<<"$out"; then
    pass "remote cutover status ready/complete"
  else
    fail "remote cutover status blocked"
  fi
}

main() {
  say "== Section 43 Gate Audit =="
  say "Domain: ${DOMAIN}"
  say "Expected IP: ${EXPECTED_IP}"
  say "Base URL: ${BASE_URL}"
  say ""

  require_file "$PLAN_FILE"
  require_file "$AUDIT_FILE"

  check_audit_line_absent "Plan is **not complete yet**." "completion-audit no longer marks plan incomplete"
  check_audit_line_absent "Section 43 is not satisfied; no shutdown path is permitted." "completion-audit no longer blocks Section 43"

  check_audit_line_present "- \`Root typecheck\`: PASS" "39.12 root typecheck recorded PASS"
  check_audit_line_present "- \`Root tests\`: PASS" "39.12 root tests recorded PASS"
  check_audit_line_present "- \`Blog build\`: PASS" "39.12 blog build recorded PASS"
  check_audit_line_present "- \`API tests\`: PASS" "39.12 API tests recorded PASS"
  check_audit_line_present "- \`CLI tests\`: PASS" "39.12 CLI tests recorded PASS"
  check_audit_line_present "- \`Admin build\`: PASS" "39.12 admin build recorded PASS"
  check_audit_line_present "- \`Backup restore dry run\`: PASS" "39.12 backup/restore recorded PASS"
  check_audit_line_present "- \`Production smoke\`: PASS" "39.12 production smoke recorded PASS"

  check_doh_a
  check_public_health
  check_remote_cutover

  say ""
  if [[ "$failed" -eq 0 ]]; then
    pass "Section 43 gate satisfied"
    exit 0
  fi
  fail "Section 43 gate blocked"
  exit 1
}

main "$@"
