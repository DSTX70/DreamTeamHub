#!/bin/bash
# API Regression Test Suite for Dream Team Hub - New Features
# Tests the 9-feature bundle API endpoints

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5000}"
DTH_API_TOKEN="${DTH_API_TOKEN}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

print_test() {
    echo -e "\n${YELLOW}TEST:${NC} $1"
}

assert_success() {
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_contains() {
    local response="$1"
    local expected="$2"
    TESTS_RUN=$((TESTS_RUN + 1))
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC} - Response contains: $expected"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - Expected to find: $expected"
        echo "Got: $response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_http_status() {
    local status="$1"
    local expected="$2"
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ "$status" -eq "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} - HTTP $status"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - Expected HTTP $expected, got $status"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Pre-flight checks
print_header "Pre-flight Checks"

if [ -z "$DTH_API_TOKEN" ]; then
    echo -e "${RED}ERROR: DTH_API_TOKEN not set${NC}"
    echo "Usage: export DTH_API_TOKEN='your-token' && ./api-regression.sh"
    exit 1
fi

echo "Base URL: $BASE_URL"
echo "API Token: ${DTH_API_TOKEN:0:10}..."

# Test server connectivity
print_test "Server connectivity"
if curl -s -f "$BASE_URL/healthz" > /dev/null; then
    echo -e "${GREEN}✓ Server is reachable${NC}"
else
    echo -e "${RED}✗ Server is not reachable at $BASE_URL${NC}"
    exit 1
fi

# Test 1: Playbook Preview API
print_header "1. Playbook Preview API Tests"

print_test "1.1 Valid playbook submission"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/wo/playbook/preview" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-playbook-regression",
    "description": "Automated test playbook",
    "schema": {"type": "object"},
    "data": {"test": "value"}
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "201"
assert_contains "$BODY" "success"
assert_contains "$BODY" "test-playbook-regression"
assert_contains "$BODY" "preview"

print_test "1.2 Minimal playbook submission"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/wo/playbook/preview" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "minimal-playbook-test"
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "201"
assert_contains "$BODY" "success"

print_test "1.3 Get all playbook previews"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/wo/playbook/preview" \
  -H "Authorization: Bearer $DTH_API_TOKEN")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "200"
# Response should be a JSON array
assert_contains "$BODY" "["

# Test 2: Coverage Summary API
print_header "2. Coverage Summary API Tests"

print_test "2.1 Fetch coverage metrics"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/coverage/summary" \
  -H "Authorization: Bearer $DTH_API_TOKEN")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "200"
assert_contains "$BODY" "files"
assert_contains "$BODY" "lines"
assert_contains "$BODY" "covered"
assert_contains "$BODY" "pct"

# Test 3: Operations Alert Hook API
print_header "3. Operations Alert Hook API Tests"

print_test "3.1 Info alert"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ops/alert" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "info",
    "message": "Test info alert from regression suite"
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "200"
assert_contains "$BODY" "Alert accepted"

print_test "3.2 Error alert"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ops/alert" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "error",
    "message": "Test error alert - simulated failure"
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
assert_http_status "$HTTP_STATUS" "200"

print_test "3.3 Default alert (no kind)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ops/alert" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Default alert message"
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
assert_http_status "$HTTP_STATUS" "200"

# Test 4: LLM Inference API
print_header "4. LLM Inference API Tests"

print_test "4.1 Mock provider inference"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/llm/infer" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mock",
    "model": "gpt-4.1-mini",
    "prompt": "Hello, regression test!"
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "200"
assert_contains "$BODY" "Mock response"

print_test "4.2 Invalid provider handling"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/llm/infer" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "invalid-provider-xyz",
    "prompt": "test"
  }')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
assert_http_status "$HTTP_STATUS" "400"
assert_contains "$BODY" "error"

print_test "4.3 Default parameters"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/llm/infer" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
assert_http_status "$HTTP_STATUS" "200"

# Test 5: Authentication Tests
print_header "5. Authentication Tests"

print_test "5.1 Request without token (should fail)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/coverage/summary")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
assert_http_status "$HTTP_STATUS" "401"

print_test "5.2 Request with invalid token (should fail)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/coverage/summary" \
  -H "Authorization: Bearer invalid-token-xyz")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
assert_http_status "$HTTP_STATUS" "401"

# Summary
print_header "Test Summary"
echo "Total tests run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
