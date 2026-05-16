#!/usr/bin/env bash
set -euo pipefail

# Wrapper for jdcloud-dns-upsert.cjs
# Requires AK/SK in environment or via args.
#
# Example:
#   JDCLOUD_ACCESS_KEY_ID=xxx JDCLOUD_SECRET_ACCESS_KEY=yyy \
#   bash deploy/image-bed/jdcloud-dns-upsert.sh --value 36.151.148.198

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

pushd "$ROOT_DIR" >/dev/null
node deploy/image-bed/jdcloud-dns-upsert.cjs "$@"
popd >/dev/null
