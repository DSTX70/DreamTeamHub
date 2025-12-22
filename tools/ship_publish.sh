#!/usr/bin/env bash
set -euo pipefail

PROJECT_KEY="${PROJECT_KEY:?PROJECT_KEY is required}"
echo "SHIP PUBLISH: ${PROJECT_KEY}"

# 1) Dry gate (tests/smoke/build)
./tools/ci_gate.sh

# 2) Publish
npx tsx tools/publish_drive_steward.ts

echo "SHIP PUBLISH DONE ✅"
