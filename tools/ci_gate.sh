#!/usr/bin/env bash
set -euo pipefail

echo "CI GATE: export bundle (no publish)"
PROJECT_KEY="${PROJECT_KEY:-DreamTeamHub}"

node -v
npm -v

# Optional: add real tests here
echo "Smoke: (none yet) PASS"

echo "Build bundle"
PROJECT_KEY="$PROJECT_KEY" npx tsx tools/export_bundle.ts

echo "CI GATE PASS ✅"
