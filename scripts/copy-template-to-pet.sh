#!/bin/bash
# Copy Ship template to pet-project-rte-rag (run from ship repo root)
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHIP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="$SHIP_ROOT/pet-project-rte-rag"
TEMPLATE="$SHIP_ROOT/template"

echo "Copying template to pet-project-rte-rag..."
cp -r "$TEMPLATE/apps" "$TARGET/"
cp -r "$TEMPLATE/packages" "$TARGET/"
cp -r "$TEMPLATE/bin/setup.sh" "$TARGET/bin/" 2>/dev/null || true
cp -r "$TEMPLATE/.husky" "$TARGET/" 2>/dev/null || true
cp -r "$TEMPLATE/.cursor" "$TARGET/" 2>/dev/null || true
cp -r "$TEMPLATE/.editorconfig" "$TARGET/" 2>/dev/null || true
cp -r "$TEMPLATE/.github" "$TARGET/" 2>/dev/null || true
cp -r "$SHIP_ROOT/deploy/yandex-cloud" "$TARGET/deploy/" 2>/dev/null || mkdir -p "$TARGET/deploy" && cp -r "$SHIP_ROOT/deploy/yandex-cloud" "$TARGET/deploy/"
echo "Done. Run: cd pet-project-rte-rag && npm install"
