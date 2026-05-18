#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANDED_APP="$ROOT/node_modules/electron/dist/Open Bookmark.app/Contents/MacOS/Electron"

if [[ "$(uname -s)" == "Darwin" && -x "$BRANDED_APP" ]]; then
  exec "$BRANDED_APP" "$ROOT"
fi

exec "$ROOT/node_modules/.bin/electron" "$ROOT"
