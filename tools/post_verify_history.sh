#!/usr/bin/env bash
set -euo pipefail

# i³ Step 4 Publisher Pack — post_verify_history.sh
# Enforced check: fails unless EXPECTED_SHA256 appears in Drive Steward history for PROJECT_KEY.

: "${DRIVE_STEWARD_URL:?Missing DRIVE_STEWARD_URL}"
: "${DRIVE_STEWARD_TOKEN:?Missing DRIVE_STEWARD_TOKEN}"
: "${PROJECT_KEY:?Missing PROJECT_KEY}"
: "${EXPECTED_SHA256:?Missing EXPECTED_SHA256}"

BASE="${DRIVE_STEWARD_URL%/}"

echo "POST_VERIFY: checking history for project=${PROJECT_KEY} sha=${EXPECTED_SHA256}"

# Prefer find endpoint (fast), then fallback to by-project
FIND_URL="${BASE}/api/debug/exports/find?sha256=${EXPECTED_SHA256:0:12}&limit=25"
RESP="$(curl -sS -H "x-i3-token: ${DRIVE_STEWARD_TOKEN}" "${FIND_URL}" || true)"

if echo "$RESP" | grep -q "$EXPECTED_SHA256"; then
  echo "POST_VERIFY: PASS (found via find)"
  exit 0
fi

BYPROJ_URL="${BASE}/api/debug/exports/by-project?projectKey=${PROJECT_KEY}&limit=50"
RESP2="$(curl -sS -H "x-i3-token: ${DRIVE_STEWARD_TOKEN}" "${BYPROJ_URL}" || true)"

if echo "$RESP2" | grep -q "$EXPECTED_SHA256"; then
  echo "POST_VERIFY: PASS (found via by-project)"
  exit 0
fi

echo "POST_VERIFY: FAIL — SHA not present in Drive Steward history"
exit 1
