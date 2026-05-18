#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_DIR="$ROOT/resources/node/bin"
NODE_BIN="$(command -v node)"

mkdir -p "$NODE_DIR"
cp "$NODE_BIN" "$NODE_DIR/node"
chmod +x "$NODE_DIR/node"
echo "Bundled Node: $($NODE_DIR/node -v)"
