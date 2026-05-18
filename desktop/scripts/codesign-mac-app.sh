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

sign_macho() {
  local file="$1"
  if file "$file" 2>/dev/null | grep -q "Mach-O"; then
    codesign --sign - --force --timestamp=none "$file"
  fi
}

echo "==> Ad-hoc signing Mach-O files in $(basename "$APP")…"

while IFS= read -r -d '' file; do
  sign_macho "$file"
done < <(find "$APP/Contents" -type f \( -name "*.node" -o -name "*.dylib" -o -perm +111 \) -print0)

codesign --sign - --force --deep --timestamp=none "$APP"
codesign --verify --deep --strict "$APP"
echo "==> Signed: $APP"
