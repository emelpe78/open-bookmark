#!/usr/bin/env bash
# Ad-hoc sign the .app and embedded Mach-O binaries (Node, native modules).
# Unsigned CI builds otherwise show „ist beschädigt“ after download (Gatekeeper + quarantine).
#
# Strategy: sign from innermost to outermost without --deep on the main app.
# codesign --deep on the top-level .app is notoriously unreliable with nested
# Electron helper bundles and can produce "No such file or directory" errors.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-$ROOT/release/mac-arm64/Open Bookmark.app}"

if [[ ! -d "$APP" ]]; then
  echo "codesign-mac-app: app bundle not found: $APP" >&2
  exit 1
fi

echo "==> Ad-hoc signing $(basename "$APP")…"

# 1. Sign nested .framework bundles (deepest first via -depth)
find "$APP/Contents/Frameworks" -maxdepth 1 -name "*.framework" -type d -depth \
  -exec codesign --sign - --force --deep --timestamp=none {} \;

# 2. Sign nested .app helper bundles (deepest first via -depth)
find "$APP/Contents/Frameworks" -name "*.app" -type d -depth \
  -exec codesign --sign - --force --deep --timestamp=none {} \;

# 3. Sign standalone Mach-O binaries that live outside any bundle
while IFS= read -r -d '' file; do
  if file -b "$file" 2>/dev/null | grep -q "Mach-O"; then
    codesign --sign - --force --timestamp=none "$file"
  fi
done < <(find "$APP/Contents" -type f \
  \( -name "*.node" -o -name "*.dylib" -o -perm +111 \) \
  ! -path "*.framework/*" \
  ! -path "*.app/*" \
  -print0 2>/dev/null)

# 4. Sign the main app bundle (no --deep — nested bundles already signed)
codesign --sign - --force --timestamp=none "$APP"

codesign --verify --deep --strict "$APP" || {
  echo "codesign-mac-app: verification FAILED for $APP" >&2
  exit 1
}
echo "==> Signed: $APP"