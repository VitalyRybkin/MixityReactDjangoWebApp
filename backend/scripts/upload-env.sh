#!/usr/bin/env bash
set -euo pipefail

ITEM="${BW_ITEM_NAME:-mixity-django}"
ENV_FILE="${1:-credentials/.env}"

if [[ -z "${BW_SESSION:-}" ]]; then
  echo 'BW_SESSION not set. Run:'
  echo '  export BW_SESSION="$(bw unlock --raw)"'
  exit 1
fi

command -v bw >/dev/null 2>&1 || {
  echo "Bitwarden CLI is not installed."
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq is not installed."
  exit 1
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE"
  exit 1
fi

if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
else
  TIMEOUT_CMD=""
fi

run_with_timeout() {
  local seconds="$1"
  shift

  if [[ -n "$TIMEOUT_CMD" ]]; then
    "$TIMEOUT_CMD" "$seconds" "$@"
  else
    "$@"
  fi
}

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

ENV_JSON="$TEMP_DIR/env-fields.json"
ITEM_JSON_FILE="$TEMP_DIR/item.json"
UPDATED_JSON="$TEMP_DIR/updated-item.json"

# Parse .env without source/eval.
# Supported:
#   KEY=value
#   export KEY=value
#   KEY="value"
#   KEY='value'
#
# Ignored:
#   blank lines
#   comments
#
# Duplicate keys: the last value wins.
if ! jq -Rn '
  def trim:
    sub("^[[:space:]]+"; "")
    | sub("[[:space:]]+$"; "");

  def strip_outer_quotes:
    if (startswith("\"") and endswith("\""))
       or (startswith("\u0027") and endswith("\u0027"))
    then .[1:-1]
    else .
    end;

  [
    inputs
    | sub("\\r$"; "")
    | select(test("^[[:space:]]*(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*[[:space:]]*="))
    | sub("^[[:space:]]*export[[:space:]]+"; "")
    | capture("^[[:space:]]*(?<name>[A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(?<value>.*)$")
    | .value |= (trim | strip_outer_quotes)
  ]
  | reduce .[] as $field ({}; .[$field.name] = $field.value)
  | to_entries
  | sort_by(.key)
  | map({
      name: .key,
      value: .value,
      type: 0
    })
' < "$ENV_FILE" > "$ENV_JSON"; then
  echo "Failed to parse environment file: $ENV_FILE"
  exit 1
fi

VARIABLE_COUNT="$(jq 'length' "$ENV_JSON")"

if [[ "$VARIABLE_COUNT" -eq 0 ]]; then
  echo "No environment variables found in: $ENV_FILE"
  exit 1
fi

MIN_VARIABLES="${BW_MIN_ENV_VARS:-1}"

if ! [[ "$MIN_VARIABLES" =~ ^[0-9]+$ ]]; then
  echo "BW_MIN_ENV_VARS must be a non-negative integer."
  exit 1
fi

if [[ "$VARIABLE_COUNT" -lt "$MIN_VARIABLES" ]]; then
  echo "Only $VARIABLE_COUNT variables found; expected at least $MIN_VARIABLES."
  echo "Bitwarden was not changed."
  exit 1
fi

echo "Syncing Bitwarden vault..."

if ! run_with_timeout 30 bw sync --session "$BW_SESSION" >/dev/null; then
  echo "Failed to sync Bitwarden vault."
  echo "Check BW_SESSION and your network connection."
  exit 1
fi

echo "Reading Bitwarden item: $ITEM"

if ! run_with_timeout 15 bw get item "$ITEM" --session "$BW_SESSION" > "$ITEM_JSON_FILE"; then
  echo "Failed to read Bitwarden item '$ITEM'."
  echo "Check BW_SESSION and the item name."
  exit 1
fi

if ! jq -e . "$ITEM_JSON_FILE" >/dev/null 2>&1; then
  echo "Bitwarden returned invalid JSON."
  exit 1
fi

ITEM_ID="$(jq -r '.id // ""' "$ITEM_JSON_FILE")"

if [[ -z "$ITEM_ID" ]]; then
  echo "Bitwarden item ID was not found."
  exit 1
fi

CURRENT_COUNT="$(jq '(.fields // []) | length' "$ITEM_JSON_FILE")"

echo "Environment file: $ENV_FILE"
echo "Bitwarden item:  $ITEM"
echo "Current fields:  $CURRENT_COUNT"
echo "New fields:      $VARIABLE_COUNT"
echo
echo "All custom fields in this Bitwarden item will be replaced."
echo "Notes and other standard Bitwarden properties will remain unchanged."

if [[ "${BW_ENV_PUSH_FORCE:-0}" != "1" ]]; then
  printf 'Continue? [y/N] '
  read -r CONFIRM

  case "$CONFIRM" in
    y|Y|yes|YES|Yes)
      ;;
    *)
      echo "Cancelled. Bitwarden was not changed."
      exit 0
      ;;
  esac
fi

if ! jq --slurpfile fields "$ENV_JSON" '
  .fields = $fields[0]
' "$ITEM_JSON_FILE" > "$UPDATED_JSON"; then
  echo "Failed to prepare the updated Bitwarden item."
  exit 1
fi

echo "Updating Bitwarden item..."

if ! ENCODED_ITEM="$(bw encode < "$UPDATED_JSON")"; then
  echo "Failed to encode the Bitwarden item."
  exit 1
fi

if ! run_with_timeout 30 \
  bw edit item "$ITEM_ID" "$ENCODED_ITEM" --session "$BW_SESSION" >/dev/null; then
  echo "Failed to update Bitwarden item '$ITEM'."
  exit 1
fi

echo "Syncing updated vault..."

if ! run_with_timeout 30 bw sync --session "$BW_SESSION" >/dev/null; then
  echo "The item was updated, but the final Bitwarden sync failed."
  exit 1
fi

echo "Updated Bitwarden item: $ITEM"
echo "Variables: $VARIABLE_COUNT"
