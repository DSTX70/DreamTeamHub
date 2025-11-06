# Testing Guide for New Features

This guide provides regression tests for the 9-feature bundle integrated into Dream Team Hub.

## Overview

The following new API endpoints and pages were added:
- **POST /api/wo/playbook/preview** - Work Order playbook preview persistence
- **GET /api/coverage/summary** - Code coverage metrics
- **POST /api/ops/alert** - Operations alert hook
- **POST /api/llm/infer** - LLM inference with provider selection

## Prerequisites

### Authentication
All API endpoints require authentication. You can authenticate using either:

1. **Session-based auth** (interactive users)
   - Log in via Replit Auth at `/`
   - Session cookie is automatically included in requests

2. **API Token auth** (CI/CD, external integrations)
   - Set `Authorization: Bearer <DTH_API_TOKEN>` header
   - Token value from environment variable `DTH_API_TOKEN`

### Environment Variables
```bash
export DTH_API_TOKEN="your-api-token-here"
export BASE_URL="http://localhost:5000"
```

## API Endpoint Tests

### 1. Playbook Preview API

**Endpoint:** `POST /api/wo/playbook/preview`

**Purpose:** Save draft work order playbook configurations

**Test Case 1: Valid Playbook Submission**
```bash
curl -X POST "${BASE_URL}/api/wo/playbook/preview" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-playbook",
    "description": "Test playbook for regression",
    "steps": ["step1", "step2", "step3"]
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "received": {
    "name": "test-playbook",
    "description": "Test playbook for regression",
    "steps": ["step1", "step2", "step3"]
  }
}
```

**Test Case 2: Empty Payload**
```bash
curl -X POST "${BASE_URL}/api/wo/playbook/preview" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "ok": true,
  "received": {}
}
```

### 2. Coverage Summary API

**Endpoint:** `GET /api/coverage/summary`

**Purpose:** Retrieve code coverage metrics

**Test Case 1: Fetch Coverage Metrics**
```bash
curl -X GET "${BASE_URL}/api/coverage/summary" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}"
```

**Expected Response:**
```json
{
  "files": 42,
  "lines": 12345,
  "covered": 10234,
  "pct": 82.88
}
```

**Validation:**
- `files` > 0
- `lines` > 0
- `covered` <= `lines`
- `pct` = (covered / lines) * 100

### 3. Operations Alert Hook API

**Endpoint:** `POST /api/ops/alert`

**Purpose:** Trigger operations alerts for monitoring/testing

**Test Case 1: Info Alert**
```bash
curl -X POST "${BASE_URL}/api/ops/alert" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "info",
    "message": "Test info alert from regression test"
  }'
```

**Expected Response:**
```
Alert accepted
```

**Test Case 2: Error Alert**
```bash
curl -X POST "${BASE_URL}/api/ops/alert" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "error",
    "message": "Test error alert - database connection timeout"
  }'
```

**Expected Response:**
```
Alert accepted
```

**Validation:**
- Check server logs for `[OPS][info]` or `[OPS][error]` messages
- Alerts should be logged but not cause errors

**Test Case 3: Default Alert (No kind)**
```bash
curl -X POST "${BASE_URL}/api/ops/alert" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Default alert without kind"
  }'
```

**Expected Response:**
```
Alert accepted
```

### 4. LLM Inference API

**Endpoint:** `POST /api/llm/infer`

**Purpose:** Run LLM inference with pluggable provider selection

**Test Case 1: Mock Provider**
```bash
curl -X POST "${BASE_URL}/api/llm/infer" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mock",
    "model": "gpt-4.1-mini",
    "prompt": "Hello, world!"
  }'
```

**Expected Response:**
```
Mock response for prompt: Hello, world!
```

**Test Case 2: OpenAI Provider (requires OPENAI_API_KEY)**
```bash
curl -X POST "${BASE_URL}/api/llm/infer" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "prompt": "What is 2+2?"
  }'
```

**Expected Response:**
```
The sum of 2 + 2 is 4.
```

**Test Case 3: Invalid Provider**
```bash
curl -X POST "${BASE_URL}/api/llm/infer" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "invalid-provider",
    "model": "test",
    "prompt": "test"
  }'
```

**Expected Response:**
```json
{
  "error": "Unknown provider: invalid-provider"
}
```

**HTTP Status:** 400

**Test Case 4: Default Parameters**
```bash
curl -X POST "${BASE_URL}/api/llm/infer" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```
Mock response for prompt: 
```

## Frontend Page Tests

### 1. Playbook Preview Page

**URL:** `/wo/playbook-preview`

**Manual Test Steps:**
1. Navigate to the page
2. Verify breadcrumb shows current location
3. Fill in the JSON schema form fields
4. Click submit
5. Verify preview shows submitted data

**Expected Elements:**
- Page title: "Playbook Preview"
- JSON schema form with input fields
- Submit button
- Live preview area (shows JSON)

### 2. Onboarding Success Page

**URL:** `/onboarding/success`

**Manual Test Steps:**
1. Navigate to the page
2. Verify success message is displayed
3. Click on next-step links
4. Verify navigation works

**Expected Elements:**
- Success confirmation message
- Links to next steps
- Breadcrumb navigation

### 3. Coverage Deep Dive Page

**URL:** `/coverage/deep-dive`

**Manual Test Steps:**
1. Navigate to the page
2. Verify coverage metrics are displayed
3. Check file/line coverage percentages

**Expected Elements:**
- Page title: "Coverage Deep Dive"
- Coverage summary (files, lines, covered, %)
- Breadcrumb navigation

### 4. Alert Hooks Demo Page

**URL:** `/ops/alerts`

**Manual Test Steps:**
1. Navigate to the page
2. Fill in alert message field
3. Select alert kind (info/error/warning)
4. Click send button
5. Verify success message

**Expected Elements:**
- Alert message input field
- Alert kind selector
- Send button
- Success/error feedback

### 5. LLM Provider Select Page

**URL:** `/llm/provider`

**Manual Test Steps:**
1. Navigate to the page
2. Select provider from dropdown (Mock/OpenAI/Vertex/Anthropic)
3. Enter prompt text
4. Click submit
5. Verify response is displayed

**Expected Elements:**
- Provider dropdown
- Prompt textarea
- Submit button
- Response display area

## Automated Test Script

A test script is available at `tests/api-regression.sh` for automated API testing.

**Usage:**
```bash
export DTH_API_TOKEN="your-token"
./tests/api-regression.sh
```

**Output:**
- ✓ for passing tests
- ✗ for failing tests
- Summary of results

## Continuous Integration

To integrate these tests into CI/CD:

1. Set `DTH_API_TOKEN` as a secret in your CI environment
2. Run the test script during deployment
3. Fail the build if any tests fail

**Example GitHub Actions:**
```yaml
- name: Run API Regression Tests
  env:
    DTH_API_TOKEN: ${{ secrets.DTH_API_TOKEN }}
    BASE_URL: https://staging.dreamteamhub.repl.co
  run: ./tests/api-regression.sh
```

## Troubleshooting

### 401 Unauthorized
- Verify `DTH_API_TOKEN` is set correctly
- Check token matches server environment variable
- Ensure Authorization header format: `Bearer <token>`

### 500 Internal Server Error
- Check server logs for detailed error
- Verify all required environment variables are set
- For OpenAI provider, ensure `OPENAI_API_KEY` is configured

### Network Errors
- Verify server is running on expected port
- Check firewall/network configuration
- Ensure `BASE_URL` is correct

## Next Steps

1. **Add E2E Tests**: When authentication stubs are available for Playwright
2. **Performance Tests**: Add load testing for LLM inference endpoint
3. **Security Tests**: Test authorization boundaries and input validation
