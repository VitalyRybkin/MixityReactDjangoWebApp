#!/usr/bin/env bash
set -euo pipefail

ITEM="${BW_ITEM_NAME:-mixity-django}"
OUTPUT_FILE="${1:-credentials/.env}"

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

# macOS: brew install coreutils
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
else
  TIMEOUT_CMD=""
fi

echo "Syncing Bitwarden vault..."

if [[ -n "$TIMEOUT_CMD" ]]; then
  if ! "$TIMEOUT_CMD" 30 bw sync --session "$BW_SESSION" >/dev/null; then
    echo "Failed to sync Bitwarden vault."
    echo "Check BW_SESSION and your network connection."
    exit 1
  fi
else
  if ! bw sync --session "$BW_SESSION" >/dev/null; then
    echo "Failed to sync Bitwarden vault."
    echo "Check BW_SESSION and your network connection."
    exit 1
  fi
fi

echo "Reading Bitwarden item: $ITEM"

if [[ -n "$TIMEOUT_CMD" ]]; then
  if ! ITEM_JSON="$(
    "$TIMEOUT_CMD" 15 bw get item "$ITEM" --session "$BW_SESSION"
  )"; then
    echo "Failed to read Bitwarden item '$ITEM'."
    echo "Check BW_SESSION and the item name."
    exit 1
  fi
else
  if ! ITEM_JSON="$(
    bw get item "$ITEM" --session "$BW_SESSION"
  )"; then
    echo "Failed to read Bitwarden item '$ITEM'."
    echo "Check BW_SESSION and the item name."
    exit 1
  fi
fi

if ! jq -e . >/dev/null 2>&1 <<< "$ITEM_JSON"; then
  echo "Bitwarden returned invalid JSON."
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

TEMP_FILE="$(mktemp)"
trap 'rm -f "$TEMP_FILE"' EXIT

{
  echo "# Generated from Bitwarden item: $ITEM"
  echo "# Do not edit manually."
  echo

  jq -r '
    def valid_name:
      test("^[A-Za-z_][A-Za-z0-9_]*$");

    def strip_outer_quotes:
      if (startswith("\"") and endswith("\""))
         or (startswith("\u0027") and endswith("\u0027"))
      then .[1:-1]
      else .
      end;

    def note_fields:
      [
        (.notes // "")
        | split("\n")[]
        | sub("\\r$"; "")
        | sub("^[[:space:]]*export[[:space:]]+"; "")
        | select(test("^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*="))
        | capture("^[[:space:]]*(?<name>[A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(?<value>.*)$")
        | .value |= strip_outer_quotes
      ];

    def custom_fields:
      [
        .fields[]?
        | select((.name // "") | valid_name)
        | select(.value != null and .value != "")
        | {name: .name, value: .value}
      ];

    (note_fields + custom_fields)
    | reduce .[] as $field ({}; .[$field.name] = $field.value)
    | to_entries
    | sort_by(.key)
    | .[]
    | "\(.key)=\(.value | @json)"
  ' <<< "$ITEM_JSON"
} > "$TEMP_FILE"

VARIABLE_COUNT="$(
  grep -Ec '^[A-Za-z_][A-Za-z0-9_]*=' "$TEMP_FILE" || true
)"

if [[ "$VARIABLE_COUNT" -eq 0 ]]; then
  echo "No environment fields found in Bitwarden item '$ITEM'."
  exit 1
fi

MIN_VARIABLES="${BW_MIN_ENV_VARS:-1}"

if ! [[ "$MIN_VARIABLES" =~ ^[0-9]+$ ]]; then
  echo "BW_MIN_ENV_VARS must be a non-negative integer."
  exit 1
fi

if [[ "$VARIABLE_COUNT" -lt "$MIN_VARIABLES" ]]; then
  echo "Only $VARIABLE_COUNT variables found; expected at least $MIN_VARIABLES."
  echo "The existing environment file was not replaced."
  exit 1
fi

mv "$TEMP_FILE" "$OUTPUT_FILE"
trap - EXIT

chmod 600 "$OUTPUT_FILE"

echo "Created: $OUTPUT_FILE"
echo "Variables: $VARIABLE_COUNT"
