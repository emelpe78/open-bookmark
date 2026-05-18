#!/usr/bin/env bash
# macOS dev: patch Electron.app name + bundle icon (About, Dock squircle).
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_APP="$ROOT/node_modules/electron/dist/Electron.app"
PLIST="$ELECTRON_APP/Contents/Info.plist"
CUSTOM_ICNS="$ROOT/resources/icon.icns"
ELECTRON_ICNS="$ELECTRON_APP/Contents/Resources/electron.icns"

if [[ ! -f "$PLIST" ]]; then
  exit 0
fi

/usr/libexec/PlistBuddy -c "Set :CFBundleName 'Open Bookmark'" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :CFBundleName string 'Open Bookmark'" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName 'Open Bookmark'" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string 'Open Bookmark'" "$PLIST"

if [[ -f "$CUSTOM_ICNS" ]]; then
  cp "$CUSTOM_ICNS" "$ELECTRON_APP/Contents/Resources/icon.icns"
  if [[ -f "$ELECTRON_ICNS" ]]; then
    cp "$CUSTOM_ICNS" "$ELECTRON_ICNS"
  fi
  /usr/libexec/PlistBuddy -c "Set :CFBundleIconFile icon.icns" "$PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string icon.icns" "$PLIST"
  echo "Patched Electron.app icons (icon.icns + electron.icns)"
fi
