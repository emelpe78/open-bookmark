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

echo "==> Building Chrome extension…"
cd "$ROOT/extension"
npm ci
npm run build

echo "==> Bundling Node for packaging…"
cd "$ROOT/desktop"
bash scripts/prepare-node.sh

echo "==> Runtime build complete."
