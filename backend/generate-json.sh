#!/usr/bin/env bash
set -euo pipefail

BW_ITEM_NAME="mixity-seed-users"
BW_FIELD_NAME="SEED_USERS_JSON"
OUT_FILE="credentials/seed_users.json"

# ---- checks ----
command -v bw >/dev/null 2>&1 || {
  echo "bw CLI not installed"
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq not installed (brew install jq)"
  exit 1
}

if [ -z "${BW_SESSION:-}" ]; then
  echo 'BW_SESSION not set. Run:'
  echo '  export BW_SESSION="$(bw unlock --raw)"'
  exit 1
fi

# ---- work ----
echo "Syncing Bitwarden..."
bw sync >/dev/null

mkdir -p credentials

ITEM_ID="$(bw list items --search "$BW_ITEM_NAME" | jq -r '.[0].id')"
if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
  echo "Bitwarden item not found: $BW_ITEM_NAME"
  exit 1
fi

bw get item "$ITEM_ID" \
  | jq -r '.fields[] | select(.name=="'"$BW_FIELD_NAME"'") | .value' \
  > "$OUT_FILE"

python -m json.tool "$OUT_FILE" >/dev/null

echo "✔ Restored $OUT_FILE"
