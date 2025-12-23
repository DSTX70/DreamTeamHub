#!/usr/bin/env bash
set -euo pipefail

# i³ Step 4 Publisher Pack — ship_publish.sh
# gate → export → publish → post-verify
#
# DreamTeamHub patch v1.0:
# - Always enforce post-verify by exporting EXPECTED_SHA256 (and SHA256 for compatibility)

: "${PROJECT_KEY:?Missing PROJECT_KEY}"
: "${DRIVE_STEWARD_URL:?Missing DRIVE_STEWARD_URL}"
: "${DRIVE_STEWARD_TOKEN:?Missing DRIVE_STEWARD_TOKEN}"

echo "SHIP: start"
echo "CMD: bash tools/ship_publish.sh"
echo ""

echo "SHIP PUBLISH: ${PROJECT_KEY}"
echo "CI GATE: export bundle (no publish)"
bash tools/ci_gate.sh

echo "Build bundle"
EXPORT_JSON="$(tsx tools/export_bundle.ts)"

# Extract fields from export JSON (tarPath and sha256 are required)
BUNDLE_PATH="$(echo "$EXPORT_JSON" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);process.stdout.write(j.tarPath||'');});")"
SHA256="$(echo "$EXPORT_JSON" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);process.stdout.write(j.sha256||'');});")"

if [ -z "${BUNDLE_PATH}" ] || [ -z "${SHA256}" ]; then
  echo "SHIP_PUBLISH: FAIL — export_bundle.ts did not return tarPath/sha256"
  echo "$EXPORT_JSON"
  exit 1
fi

# Export both names (some repos/scripts check one or the other)
export SHA256
export EXPECTED_SHA256="${SHA256}"

echo ""
echo "CI GATE PASS ✅"
echo "Publishing to Drive Steward: ${DRIVE_STEWARD_URL%/}/api/exports/push"

PUBLISH_JSON="$(tsx tools/publish_drive_steward.ts "$BUNDLE_PATH")"
echo "$PUBLISH_JSON"

echo ""
echo "Post-verify: enforcing history inclusion (EXPECTED_SHA256=${EXPECTED_SHA256:0:12}...)"
bash tools/post_verify_history.sh

echo ""
echo "SHIP PUBLISH DONE ✅"
echo "Bundle: $(basename "$BUNDLE_PATH")"
echo "SHA256: $SHA256"
echo "Post-verify ✅ SHA found in Drive Steward history."
echo ""
echo "SHIP: done (exit=0)"
