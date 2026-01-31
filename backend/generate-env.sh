#!/usr/bin/env bash
set -euo pipefail

ITEM="mixity-django"

if [[ -z "${BW_SESSION:-}" ]]; then
  echo 'BW_SESSION not set. Run: export BW_SESSION="$(bw unlock --raw)"'
  exit 1
fi

# pick a timeout command if available
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT="timeout"
else
  TIMEOUT=""
fi

# later, instead of: ITEM_JSON="$(gtimeout 15 bw get item "$ITEM")"
if [ -n "$TIMEOUT" ]; then
  ITEM_JSON="$($TIMEOUT 15 bw get item "$ITEM")"
else
  ITEM_JSON="$(bw get item "$ITEM")"
fi

get() {
  echo "$ITEM_JSON" | jq -r ".fields[]? | select(.name==\"$1\") | .value"
}

cat > credentials/.env <<EOF
DB_NAME=$(get DB_NAME)
DB_USER=$(get DB_USER)
DB_PASSWORD=$(get DB_PASSWORD)
DB_HOST=$(get DB_HOST)
DB_PORT=$(get DB_PORT)
DB_SSL_MODE=$(get DB_SSL_MODE)
DB_SSL_ROOT_CERT=$(get DB_SSL_ROOT_CERT)
SEED_USERS_FILE=$(get SEED_USERS_FILE)
EOF