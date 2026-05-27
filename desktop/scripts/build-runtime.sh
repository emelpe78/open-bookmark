#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Generating app icons…"
cd "$ROOT/desktop"
bash scripts/generate-icons.sh

echo "==> Building Nuxt runtime…"
cd "$ROOT/open-bookmark"
npm ci
npm run build
npm ci --omit=dev

# file:../packages/* symlinks break inside the packaged .app (target not copied).
TAG_UTILS="$ROOT/open-bookmark/node_modules/tag-utils"
if [[ -L "$TAG_UTILS" ]]; then
  rm "$TAG_UTILS"
  cp -R "$ROOT/packages/tag-utils" "$TAG_UTILS"
fi

echo "==> Building Chrome extension…"
cd "$ROOT/extension"
npm ci
npm run build

echo "==> Bundling Node for packaging…"
cd "$ROOT/desktop"
bash scripts/prepare-node.sh

echo "==> Runtime build complete."
