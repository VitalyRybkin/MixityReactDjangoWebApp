#!/usr/bin/env bash
set -euo pipefail

BW_ITEM_NAME="mixity-seed-users"
BW_FIELD_NAME="SEED_USERS_JSON"
IN_FILE="credentials/seed_users.json"

# ---- checks ----

command -v bw >/dev/null 2>&1 || {
  echo "Bitwarden CLI is not installed."
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq is not installed. Run: brew install jq"
  exit 1
}

command -v python >/dev/null 2>&1 || {
  echo "Python is not installed or not available in PATH."
  exit 1
}

if [ -z "${BW_SESSION:-}" ]; then
  echo "BW_SESSION is not set. Run:"
  echo '  export BW_SESSION="$(bw unlock --raw)"'
  exit 1
fi

if [ ! -f "$IN_FILE" ]; then
  echo "Seed file not found: $IN_FILE"
  exit 1
fi

# Validate local JSON before uploading.
if ! python -m json.tool "$IN_FILE" >/dev/null; then
  echo "Invalid JSON: $IN_FILE"
  exit 1
fi

# ---- Bitwarden ----

echo "Syncing Bitwarden..."
bw sync >/dev/null

ITEMS_JSON="$(bw list items --search "$BW_ITEM_NAME")"

ITEM_ID="$(
  echo "$ITEMS_JSON" |
    jq -r \
      --arg name "$BW_ITEM_NAME" \
      '[.[] | select(.name == $name)][0].id // empty'
)"

if [ -z "$ITEM_ID" ]; then
  echo "Bitwarden item not found: $BW_ITEM_NAME"
  exit 1
fi

ITEM_JSON="$(bw get item "$ITEM_ID")"

FIELD_EXISTS="$(
  echo "$ITEM_JSON" |
    jq \
      --arg field "$BW_FIELD_NAME" \
      '[.fields[]? | select(.name == $field)] | length'
)"

if [ "$FIELD_EXISTS" -eq 0 ]; then
  echo "Bitwarden field not found: $BW_FIELD_NAME"
  echo "Item: $BW_ITEM_NAME"
  exit 1
fi

JSON_CONTENT="$(cat "$IN_FILE")"

UPDATED_ITEM="$(
  echo "$ITEM_JSON" |
    jq \
      --arg field "$BW_FIELD_NAME" \
      --arg value "$JSON_CONTENT" \
      '
      .fields |= map(
        if .name == $field then
          .value = $value
        else
          .
        end
      )
      '
)"

echo "$UPDATED_ITEM" |
  bw encode |
  bw edit item "$ITEM_ID" >/dev/null

echo "✔ Updated Bitwarden item '$BW_ITEM_NAME'"
echo "✔ Updated field '$BW_FIELD_NAME'"