#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://img.woodfish.site}"
TOKEN="${TOKEN:-}"
FILE="${1:-}"
CURL_ARGS="${CURL_ARGS:-}"

curl_cmd() {
  if [[ -n "$CURL_ARGS" ]]; then
    # shellcheck disable=SC2086
    curl $CURL_ARGS "$@"
    return
  fi
  curl "$@"
}

if [[ -z "$TOKEN" ]]; then
  echo "TOKEN env required" >&2
  exit 2
fi

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "pass existing image file as first arg" >&2
  exit 2
fi

curl_cmd -fsSL "$BASE_URL/api/health" >/dev/null

upload_body_file="$(mktemp)"
upload_status="$(
  curl_cmd -sS -o "$upload_body_file" -w "%{http_code}" -X POST "$BASE_URL/api/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$FILE" \
    -F "source=cli"
)"

if [[ ! "$upload_status" =~ ^2[0-9][0-9]$ ]]; then
  echo "upload failed: status=$upload_status" >&2
  cat "$upload_body_file" >&2 || true
  rm -f "$upload_body_file"
  exit 1
fi

UPLOAD_JSON="$(cat "$upload_body_file")"
rm -f "$upload_body_file"

json_get() {
  local key="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$UPLOAD_JSON" | jq -r --arg key "$key" '.[$key] // empty'
    return
  fi

  if command -v node >/dev/null 2>&1; then
    printf '%s' "$UPLOAD_JSON" | node -e '
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { data += chunk; });
      process.stdin.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const value = parsed[process.argv[1]];
          if (value !== undefined && value !== null) {
            process.stdout.write(String(value));
          }
        } catch {
          process.exit(3);
        }
      });
    ' "$key"
    return
  fi

  # Last-resort parser when jq/node are unavailable.
  printf '%s' "$UPLOAD_JSON" | sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" | sed 's#\\/#/#g'
}

URL="$(json_get url)"
ID="$(json_get id)"

if [[ -z "$URL" || -z "$ID" ]]; then
  echo "upload response parse failed" >&2
  exit 1
fi

curl_cmd -fsSL "$URL" >/dev/null
curl_cmd -fsSL -X DELETE "$BASE_URL/api/images/$ID" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "smoke passed"
