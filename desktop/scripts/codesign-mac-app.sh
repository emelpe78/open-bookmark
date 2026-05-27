#!/usr/bin/env bash
# Ad-hoc sign the .app and embedded Mach-O binaries (Node, native modules).
# Unsigned CI builds otherwise show „ist beschädigt“ after download (Gatekeeper + quarantine).
#
# Sign from innermost bundle to the root .app (no --deep on the main app).
# Bundled Node and *.node addons under Contents/Resources must be signed before the
# outer bundle or codesign --verify --strict fails with "No such file or directory".
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-$ROOT/release/mac-arm64/Open Bookmark.app}"
CONTENTS="$APP/Contents"

if [[ ! -d "$APP" ]]; then
  echo "codesign-mac-app: app bundle not found: $APP" >&2
  exit 1
fi

echo "==> Ad-hoc signing $(basename "$APP")…"

# Dangling symlinks under Resources make codesign --verify --strict fail.
find "$CONTENTS/Resources" -type l ! -exec test -e {} \; -delete 2>/dev/null || true

sign_if_macho() {
  local file="$1"
  if file -b "$file" 2>/dev/null | grep -q "Mach-O"; then
    codesign --sign - --force --timestamp=none "$file"
  fi
}

# 1. Sign bundled runtime binaries (paths must not use "*.app/*" — that matches the outer .app path).
if [[ -d "$CONTENTS/Resources" ]]; then
  while IFS= read -r -d '' file; do
    sign_if_macho "$file"
  done < <(find "$CONTENTS/Resources" -type f \( -name "*.node" -o -name "*.dylib" -o -name "node" \) -print0)
fi

# 2. Sign nested .framework bundles (deepest first).
find "$CONTENTS/Frameworks" -maxdepth 1 -name "*.framework" -type d -depth \
  -exec codesign --sign - --force --deep --timestamp=none {} \;

# 3. Sign nested helper .app bundles (deepest first).
find "$CONTENTS/Frameworks" -name "*.app" -type d -depth \
  -exec codesign --sign - --force --deep --timestamp=none {} \;

# 4. Sign the main app bundle (nested code already signed; do not use --deep here).
codesign --sign - --force --timestamp=none "$APP"

if ! codesign --verify --deep --strict "$APP"; then
  echo "codesign-mac-app: verification FAILED for $APP" >&2
  codesign --verify --deep --strict --verbose=4 "$APP" >&2 || true
  exit 1
fi
echo "==> Signed: $APP"
