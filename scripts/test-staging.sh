#!/bin/bash
# scripts/test-staging.sh
# Comprehensive staging environment testing script

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${STAGING_URL:-https://staging.yourdomain.com}"
STAGING_API_KEY="${STAGING_DTH_API_TOKEN:-}"
LLM_FAMILY="${LLM_FAMILY:-gpt}"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Dream Team Hub - Staging Environment Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Check required environment variables
if [ -z "$STAGING_API_KEY" ]; then
  echo -e "${RED}✗ STAGING_DTH_API_TOKEN not set${NC}"
  echo "  Please set the staging API token:"
  echo "  export STAGING_DTH_API_TOKEN=your-staging-token"
  exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo "  Staging URL: $STAGING_URL"
echo "  LLM Family: $LLM_FAMILY"
echo ""

# Function to run a test step
run_step() {
  local step_name="$1"
  local step_command="$2"
  
  echo -e "${YELLOW}▶ $step_name${NC}"
  if eval "$step_command"; then
    echo -e "${GREEN}  ✓ Passed${NC}"
    echo ""
    return 0
  else
    echo -e "${RED}  ✗ Failed${NC}"
    echo ""
    return 1
  fi
}

# Test 1: Liveness check
run_step "Test 1: Liveness Check" \
  "curl -sf $STAGING_URL/api/healthz/livez > /dev/null"

# Test 2: Readiness check
run_step "Test 2: Readiness Check" \
  "curl -sf $STAGING_URL/api/healthz > /dev/null"

# Test 3: Metrics endpoint
run_step "Test 3: Metrics Endpoint" \
  "curl -sf $STAGING_URL/metrics > /dev/null"

# Test 4: Deploy marker (admin endpoint)
run_step "Test 4: Deploy Marker (Admin)" \
  "curl -sf -XPOST $STAGING_URL/api/admin/deploy/mark \
    -H 'x-api-key: $STAGING_API_KEY' \
    -H 'Content-Type: application/json' \
    -d '{\"sha\":\"test-staging-$(date +%s)\",\"tag\":\"v0.0.0-test\",\"actor\":\"staging-test-suite\"}' > /dev/null"

# Test 5: Last deploy (session-auth)
run_step "Test 5: Last Deploy Endpoint" \
  "curl -sf $STAGING_URL/api/ops/deploy/last > /dev/null"

# Test 6: Recent logs (session-auth)
run_step "Test 6: Recent Logs Endpoint" \
  "curl -sf $STAGING_URL/api/ops/logs/recent/ > /dev/null"

# Test 7: Smoke tests
echo -e "${YELLOW}▶ Test 7: Comprehensive Smoke Tests${NC}"
if [ -f "attached_assets/repo_patches/smoke.ts" ]; then
  API_BASE="$STAGING_URL" \
  API_KEY="$STAGING_API_KEY" \
  FAMILY="$LLM_FAMILY" \
  npx tsx attached_assets/repo_patches/smoke.ts
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Passed${NC}"
  else
    echo -e "${RED}  ✗ Failed${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}  ⊘ Skipped (smoke.ts not found)${NC}"
fi
echo ""

# Test 8: Synthetic error injection
echo -e "${YELLOW}▶ Test 8: Synthetic Error Injection${NC}"
ERROR_ID="test-$(date +%s)"
ERROR_RESPONSE=$(curl -s -XPOST "$STAGING_URL/api/ops/logs/emit" \
  -H "x-api-key: $STAGING_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\":\"$ERROR_ID\",
    \"ts\":\"$(date -Iseconds)\",
    \"level\":\"error\",
    \"kind\":\"probe\",
    \"owner\":\"staging-test-suite\",
    \"msg\":\"Synthetic error for staging validation at $(date)\"
  }")

if echo "$ERROR_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}  ✓ Error injected successfully${NC}"
  echo "  Error ID: $ERROR_ID"
  
  # Wait a moment for event to propagate
  sleep 2
  
  # Verify error appears in logs
  LOGS_RESPONSE=$(curl -s "$STAGING_URL/api/ops/logs/rest?since=1m" \
    -H "x-api-key: $STAGING_API_KEY")
  
  if echo "$LOGS_RESPONSE" | grep -q "$ERROR_ID"; then
    echo -e "${GREEN}  ✓ Error found in logs${NC}"
  else
    echo -e "${YELLOW}  ⚠ Error not yet in logs (may take a moment)${NC}"
  fi
else
  echo -e "${RED}  ✗ Failed to inject error${NC}"
  echo "  Response: $ERROR_RESPONSE"
fi
echo ""

# Test 9: Dashboard accessibility
echo -e "${YELLOW}▶ Test 9: Dashboard Accessibility${NC}"
dashboards=(
  "/ops/overview:Ops Overview"
  "/ops/logs:Ops Logs"
  "/ops/logs-stream-plus:Ops Logs Stream"
  "/llm/linter/presets:LLM Linter Presets"
  "/llm/linter/augment:LLM Linter Augment"
)

for dashboard in "${dashboards[@]}"; do
  IFS=':' read -r path name <<< "$dashboard"
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL$path")
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}  ✓ $name ($path)${NC}"
  else
    echo -e "${RED}  ✗ $name ($path) - HTTP $HTTP_CODE${NC}"
  fi
done
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Staging environment test suite completed${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Review test results above"
echo "  2. Check staging dashboards manually"
echo "  3. Verify error appears in /ops/overview"
echo "  4. Review staging alert notifications (Slack/PagerDuty)"
echo ""
echo "For detailed testing checklist, see:"
echo "  docs/ops/STAGING_TESTING_CHECKLIST.md"
echo ""
