#!/bin/bash
# Apply pet-project customizations after bootstrap
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PET_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CUSTOM="$PET_ROOT/customizations"

if [ ! -d "$PET_ROOT/apps/web" ]; then
  echo "Run bootstrap-from-ship.sh first!"
  exit 1
fi

echo "Applying customizations..."

# Landing
cp "$CUSTOM/landing.tsx" "$PET_ROOT/apps/web/src/app/landing.tsx" 2>/dev/null || true
cp "$CUSTOM/page.tsx" "$PET_ROOT/apps/web/src/app/page.tsx" 2>/dev/null || true

# Dashboard
cp "$CUSTOM/dashboard-page.tsx" "$PET_ROOT/apps/web/src/app/(dashboard)/app/page.tsx" 2>/dev/null || true

echo "Done."
