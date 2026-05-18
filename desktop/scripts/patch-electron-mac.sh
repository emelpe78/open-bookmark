#!/usr/bin/env bash
# macOS dev: branded Open Bookmark.app for Dock/Cmd+Tab name + custom icon.
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/node_modules/electron/dist"
ELECTRON_APP="$DIST/Electron.app"
BRANDED_APP="$DIST/Open Bookmark.app"
CUSTOM_ICNS="$ROOT/resources/icon.icns"
DISPLAY_NAME="Open Bookmark"

if [[ ! -d "$ELECTRON_APP" ]]; then
  echo "patch-electron-mac: Electron.app not found (npm install in desktop/)"
  exit 0
fi

if [[ ! -d "$BRANDED_APP" ]]; then
  cp -R "$ELECTRON_APP" "$BRANDED_APP"
  echo "Created $BRANDED_APP"
fi

patch_plist() {
  local app_dir="$1"
  local plist="$app_dir/Contents/Info.plist"
  local electron_icns="$app_dir/Contents/Resources/electron.icns"

  set_plist() {
    local key="$1"
    local value="$2"
    /usr/libexec/PlistBuddy -c "Set :${key} '${value}'" "$plist" 2>/dev/null \
      || /usr/libexec/PlistBuddy -c "Add :${key} string '${value}'" "$plist"
  }

  set_plist "CFBundleName" "$DISPLAY_NAME"
  set_plist "CFBundleDisplayName" "$DISPLAY_NAME"
  set_plist "CFBundleGetInfoString" "$DISPLAY_NAME"

  if [[ -f "$CUSTOM_ICNS" ]]; then
    cp "$CUSTOM_ICNS" "$app_dir/Contents/Resources/icon.icns"
    if [[ -f "$electron_icns" ]]; then
      cp "$CUSTOM_ICNS" "$electron_icns"
    fi
    set_plist "CFBundleIconFile" "icon.icns"
  fi
}

patch_plist "$BRANDED_APP"
patch_plist "$ELECTRON_APP"

echo "Dev start: „${DISPLAY_NAME}“ via Open Bookmark.app (Dock-Name)"
