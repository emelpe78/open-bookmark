#!/usr/bin/env bash
# Ad-hoc sign the .app and embedded Mach-O binaries (Node, native modules).
# Unsigned CI builds otherwise show „ist beschädigt“ after download (Gatekeeper + quarantine).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-$ROOT/release/mac-arm64/Open Bookmark.app}"

if [[ ! -d "$APP" ]]; then
  echo "codesign-mac-app: app bundle not found: $APP" >&2
  exit 1
fi

echo "==> Ad-hoc signing $(basename "$APP")…"

codesign --sign - --force --deep --timestamp=none "$APP"
codesign --verify --deep --strict "$APP"
echo "==> Signed: $APP"
