#!/usr/bin/env bash
set -euo pipefail

command -v bw >/dev/null 2>&1 || {
  echo "Bitwarden CLI is not installed."
  exit 1
}

STATUS="$(bw status | jq -r '.status')"

if [ "$STATUS" = "unauthenticated" ]; then
  bw login
fi

export BW_SESSION="$(bw unlock --raw)"

bw sync >/dev/null

make bootstrap