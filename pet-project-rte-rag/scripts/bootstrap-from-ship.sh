#!/bin/bash
# Bootstrap pet-project-rte-rag from Ship template
# Run from pet-project-rte-rag directory
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PET_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SHIP_ROOT="$(cd "$PET_ROOT/.." && pwd)"
TEMPLATE="$SHIP_ROOT/ship/template"

# pet-project-rte-rag is inside ship repo, so: SHIP_ROOT = parent of pet-project = ship root
TEMPLATE="$SHIP_ROOT/template"

if [ ! -d "$TEMPLATE" ]; then
  echo "Error: Ship template not found at $TEMPLATE"
  echo "Run this script from pet-project-rte-rag (inside ship repo)"
  exit 1
fi

echo "Copying from $TEMPLATE..."

# Apps
if [ ! -d "$PET_ROOT/apps" ]; then
  cp -r "$TEMPLATE/apps" "$PET_ROOT/"
  echo "  - apps/"
fi

# Packages
if [ ! -d "$PET_ROOT/packages" ]; then
  cp -r "$TEMPLATE/packages" "$PET_ROOT/"
  echo "  - packages/"
fi

# Additional config
[ -d "$TEMPLATE/.husky" ] && cp -r "$TEMPLATE/.husky" "$PET_ROOT/" 2>/dev/null || true
[ -d "$TEMPLATE/.cursor" ] && cp -r "$TEMPLATE/.cursor" "$PET_ROOT/" 2>/dev/null || true
[ -f "$TEMPLATE/.editorconfig" ] && cp "$TEMPLATE/.editorconfig" "$PET_ROOT/" 2>/dev/null || true

# Deploy (Yandex Cloud)
YC="$SHIP_ROOT/deploy/yandex-cloud"
if [ -d "$YC" ]; then
  mkdir -p "$PET_ROOT/deploy" "$PET_ROOT/.github/workflows"
  [ -d "$YC/deploy" ] && cp -r "$YC/deploy/"* "$PET_ROOT/deploy/"
  [ -d "$YC/.github/workflows" ] && cp -r "$YC/.github/workflows/"* "$PET_ROOT/.github/workflows/"
  echo "  - deploy/ + .github/workflows/"
fi

# Apply customizations
if [ -f "$PET_ROOT/scripts/apply-customizations.sh" ]; then
  chmod +x "$PET_ROOT/scripts/apply-customizations.sh"
  "$PET_ROOT/scripts/apply-customizations.sh"
fi

echo "Done. Run: npm install"
