#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-img.woodfish.site}"
EXPECTED_IP="${EXPECTED_IP:-}"
WEBROOT="${WEBROOT:-/opt/blog-stack/certbot/www}"
NGINX_CONTAINER="${NGINX_CONTAINER:-blog-nginx}"
NGINX_CONF="${NGINX_CONF:-/opt/blog-stack/nginx/conf.d/default.conf}"
TOKEN="${TOKEN:-}"
SMOKE_FILE="${SMOKE_FILE:-}"

if [[ -z "${EXPECTED_IP}" ]]; then
  echo "EXPECTED_IP is required (example: 36.151.148.198)" >&2
  exit 2
fi

for bin in certbot docker curl awk sed mktemp nslookup; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "missing required command: $bin" >&2
    exit 2
  fi
done

echo "[1/6] Verify DNS A record for ${DOMAIN}..."
DNS_OUT="$(nslookup "${DOMAIN}" 1.1.1.1 2>/dev/null || true)"
if ! grep -Eq "Address:[[:space:]]*${EXPECTED_IP}" <<<"$DNS_OUT"; then
  echo "DNS is not ready for ${DOMAIN}. Expected ${EXPECTED_IP}." >&2
  echo "nslookup output:" >&2
  echo "$DNS_OUT" >&2
  exit 1
fi

echo "[2/6] Issue/renew Let's Encrypt cert..."
certbot certonly --webroot -w "${WEBROOT}" -d "${DOMAIN}" \
  --register-unsafely-without-email --agree-tos --non-interactive

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
FULLCHAIN="${CERT_DIR}/fullchain.pem"
PRIVKEY="${CERT_DIR}/privkey.pem"
if [[ ! -f "${FULLCHAIN}" || ! -f "${PRIVKEY}" ]]; then
  echo "expected cert files not found under ${CERT_DIR}" >&2
  exit 1
fi

echo "[3/6] Patch nginx cert paths for ${DOMAIN} block..."
tmp_file="$(mktemp)"
awk -v domain="${DOMAIN}" '
  BEGIN {
    in_img = 0;
    changed_cert = 0;
    changed_key = 0;
  }
  {
    if ($0 ~ ("server_name " domain ";")) {
      in_img = 1;
    }
    if (in_img == 1 && $0 ~ /^[[:space:]]*ssl_certificate[[:space:]]+/) {
      sub(/\/etc\/letsencrypt\/live\/[^/]+\/fullchain\.pem/, "/etc/letsencrypt/live/" domain "/fullchain.pem");
      changed_cert = 1;
    } else if (in_img == 1 && $0 ~ /^[[:space:]]*ssl_certificate_key[[:space:]]+/) {
      sub(/\/etc\/letsencrypt\/live\/[^/]+\/privkey\.pem/, "/etc/letsencrypt/live/" domain "/privkey.pem");
      changed_key = 1;
      in_img = 0;
    }
    print $0;
  }
  END {
    if (changed_cert == 0 || changed_key == 0) {
      exit 42;
    }
  }
' "${NGINX_CONF}" >"${tmp_file}" || {
  code=$?
  rm -f "${tmp_file}"
  if [[ $code -eq 42 ]]; then
    echo "failed to find/patch ssl lines for ${DOMAIN} in ${NGINX_CONF}" >&2
  fi
  exit 1
}
cp "${NGINX_CONF}" "${NGINX_CONF}.bak-$(date +%Y%m%d%H%M%S)"
mv "${tmp_file}" "${NGINX_CONF}"

echo "[4/6] Validate and reload nginx..."
docker exec "${NGINX_CONTAINER}" nginx -t
docker exec "${NGINX_CONTAINER}" nginx -s reload

echo "[5/6] Verify public HTTPS health (no --resolve, no -k)..."
curl -fsS "https://${DOMAIN}/api/health" >/dev/null

echo "[6/6] Optional public smoke..."
if [[ -n "${TOKEN}" && -n "${SMOKE_FILE}" ]]; then
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  TOKEN="${TOKEN}" BASE_URL="https://${DOMAIN}" "${script_dir}/smoke-prod.sh" "${SMOKE_FILE}"
else
  echo "skip smoke-prod.sh (set TOKEN and SMOKE_FILE to run)."
fi

echo "finalize-dns-tls: completed"
