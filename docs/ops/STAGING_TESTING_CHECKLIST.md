# Staging Environment Testing Checklist

Use this checklist after deploying to staging to verify all functionality.

## Pre-Deployment

- [ ] All environment variables configured in `.env.staging`
- [ ] Staging database created and migrated
- [ ] Staging S3 bucket/prefix configured
- [ ] Staging SMTP credentials configured
- [ ] DNS CNAME record created for `staging.yourdomain.com`
- [ ] TLS certificate issued and active
- [ ] Basic auth or Cloudflare Access configured

## Smoke Tests

```bash
# Set environment
export API_BASE=https://staging.yourdomain.com
export API_KEY=<your-staging-dth-api-token>
export FAMILY=gpt

# Run smoke tests
cd attached_assets/repo_patches
npx tsx smoke.ts
```

### Expected Results:
- [ ] All health checks pass (healthz, livez)
- [ ] Deploy mark/last endpoints working
- [ ] Metrics endpoint accessible
- [ ] LLM presets CRUD operations succeed
- [ ] Ops logs emit/rest endpoints working
- [ ] No assertion failures

## Dashboard Verification

### 1. Ops Overview (`/ops/overview`)

**Authentication:**
- [ ] Basic auth prompt appears (if using basic auth)
- [ ] Can log in with staging credentials
- [ ] Session persists across page refreshes

**Live Health Card:**
- [ ] Shows current health status (OK/Degraded)
- [ ] Displays probe results (DB, S3, SMTP)
- [ ] Latency metrics visible
- [ ] Refresh button works

**Last Deploy Chip:**
- [ ] Shows deployment timestamp
- [ ] Displays git SHA (if available)
- [ ] Shows git tag (if available)
- [ ] Shows deployer name (if available)

**Metrics Cards:**
- [ ] Inventory: Low stock count displays
- [ ] Images: S3 bucket status shows
- [ ] Affiliates: 7-day metrics visible
- [ ] LLM Linter: Active rules count shown

**Error Counter:**
- [ ] Error count displays
- [ ] Deep-link to errors works
- [ ] Clicking link filters logs to errors only

### 2. Ops Logs (`/ops/logs`)

**Log Display:**
- [ ] Recent logs load (last 15 minutes)
- [ ] Log entries show: timestamp, level, kind, owner, message
- [ ] Pagination works (if many logs)
- [ ] Auto-refresh works (30s interval)

**Filtering:**
- [ ] Can filter by level (info, warn, error)
- [ ] Can filter by kind (deploy, probe, publish, etc.)
- [ ] Can filter by owner
- [ ] Filters persist across refreshes

**Actions:**
- [ ] Copy summary button works
- [ ] Copied text includes key metrics
- [ ] Download CSV works (if implemented)

### 3. Ops Logs Stream Plus (`/ops/logs-stream-plus`)

**SSE Connection:**
- [ ] SSE connects successfully
- [ ] Connection status indicator shows "Connected"
- [ ] Real-time events appear when emitted
- [ ] Reconnects automatically if disconnected

**Filtering:**
- [ ] Level filter works (all, info, warn, error)
- [ ] Kind filter works
- [ ] Owner filter works
- [ ] Filters apply immediately to stream

**Preferences:**
- [ ] Filter preferences save to localStorage
- [ ] Preferences persist after page refresh
- [ ] Can clear/reset filters

**Actions:**
- [ ] Copy summary button works
- [ ] Copy JSON button works
- [ ] JSON output is valid and formatted
- [ ] Export functionality works (if implemented)

### 4. LLM Linter Presets (`/llm/linter/presets`)

**Preset List:**
- [ ] All 12 default presets load (4 for each family: gpt, claude, gemini)
- [ ] Each preset shows: family, label, system prompt preview
- [ ] Presets grouped/sorted by family

**CRUD Operations:**

**Create:**
- [ ] Can create new preset
- [ ] Form validation works
- [ ] New preset appears in list immediately
- [ ] Success toast notification shows

**Read:**
- [ ] Can view preset details
- [ ] Full system prompt displayed
- [ ] All metadata visible (family, label, created date)

**Update:**
- [ ] Can edit existing preset
- [ ] Changes save successfully
- [ ] Updated preset reflects changes
- [ ] Success toast notification shows

**Delete:**
- [ ] Can delete preset
- [ ] Confirmation dialog appears
- [ ] Preset removed from list
- [ ] Success toast notification shows

### 5. LLM Linter Augment (`/llm/linter/augment`)

**Interface:**
- [ ] Prompt textarea renders
- [ ] Family selector shows (gpt, claude, gemini)
- [ ] Augment button enabled when valid input
- [ ] Loading state shown during augmentation

**Augment Round-Trip:**

**Step 1: Paste Prompt**
```
Analyze the user data and return JSON with fields: name, email, age
```
- [ ] Prompt pastes into textarea
- [ ] Character count updates
- [ ] Family selector defaults to 'gpt'

**Step 2: Select Family**
- [ ] Can change family (gpt → claude → gemini)
- [ ] Family selection persists

**Step 3: Augment**
- [ ] Click "Augment" button
- [ ] Loading spinner shows
- [ ] Augmented prompt appears in output area
- [ ] Output includes family-specific tips
- [ ] Output includes strict JSON instructions

**Step 4: Copy Augmented**
- [ ] Click "Copy" button on output
- [ ] Success toast notification
- [ ] Clipboard contains augmented prompt
- [ ] Can paste into other applications

**Apply Fixes:**
- [ ] "Apply fixes" button works
- [ ] Fixes apply to prompt correctly
- [ ] Can re-augment after fixes

## Error Testing

### Synthetic Error Injection

```bash
curl -XPOST "$API_BASE/api/ops/logs/emit" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id":"test-'$(date +%s)'",
    "ts":"'$(date -Iseconds)'",
    "level":"error",
    "kind":"probe",
    "owner":"smoke-test",
    "msg":"Synthetic error for staging validation"
  }'
```

**Verification:**
- [ ] HTTP 200 response from emit endpoint
- [ ] Error appears in `/ops/logs` within seconds
- [ ] Error count increments on `/ops/overview`
- [ ] Clicking Err deep-link shows only errors
- [ ] Error shows in `/ops/logs-stream-plus` (if connected)
- [ ] Slack notification sent to test channel (if configured)
- [ ] PagerDuty alert created (if configured, check test routing)

### Alert System Check

**If Slack configured:**
- [ ] Message appears in staging Slack channel
- [ ] Message includes error details (level, kind, owner, msg)
- [ ] Message includes link to staging logs
- [ ] Timestamp is correct

**If PagerDuty configured:**
- [ ] Incident created in PagerDuty
- [ ] Severity is correct (based on level)
- [ ] Incident routed to test service (not production!)
- [ ] Details include error context

## Negative Health Check Test

### Phase 1: Induce SMTP Failure

**Record Current State:**
```bash
# Check current health (should be 200 OK)
curl $API_BASE/api/healthz | jq
```
- [ ] Response is 200 OK
- [ ] `ok: true`
- [ ] All checks show `ok: true`

**Inject Bad SMTP Config:**

**Option A: Environment Variable (requires restart)**
```bash
# Set bad SMTP host
export SMTP_HOST=invalid-smtp-host.example.com

# Restart application or deployment
# (method depends on your deployment strategy)
```

**Option B: Config Update (if using config service)**
```bash
# Update staging config with bad SMTP host
# Wait for app to reload config
```

**Wait for Cache Expiry:**
- [ ] Wait 60+ seconds (HEALTHZ_CACHE_TTL_MS)
- [ ] Or restart application to force immediate check

### Phase 2: Verify Degraded State

```bash
# Check health (should be 503)
curl -i $API_BASE/api/healthz | jq
```

**Expected Response:**
- [ ] HTTP status: 503 Service Unavailable
- [ ] `ok: false` in JSON body
- [ ] DB check shows `ok: true` (still healthy)
- [ ] S3 check shows `ok: true` (still healthy)
- [ ] SMTP check shows `ok: false`
- [ ] SMTP check includes error details
- [ ] SMTP check latencyMs ≈ 5000ms (timeout)

**Example Expected Output:**
```json
{
  "ok": false,
  "latencyMs": 5123,
  "checks": [
    { "name": "db", "ok": true, "latencyMs": 14 },
    { "name": "s3", "ok": true, "latencyMs": 89 },
    { 
      "name": "smtp", 
      "ok": false, 
      "latencyMs": 5000,
      "details": "smtp timeout after 5000ms"
    }
  ],
  "ts": "2025-11-08T01:23:45.678Z"
}
```

**Dashboard Verification:**
- [ ] `/ops/overview` shows "Degraded" status
- [ ] Live Health card shows red/warning indicator
- [ ] SMTP probe specifically marked as failing
- [ ] Alert notification sent (if configured for health degradation)

### Phase 3: Restore and Verify

**Restore Correct SMTP Config:**
```bash
# Restore correct SMTP host
export SMTP_HOST=smtp.mailtrap.io  # or your staging SMTP

# Restart application or wait for config reload
```

**Wait for Recovery:**
- [ ] Wait 60+ seconds for cache expiry
- [ ] Or restart to force immediate check

**Verify Health Restored:**
```bash
curl -i $API_BASE/api/healthz | jq
```

**Expected Response:**
- [ ] HTTP status: 200 OK
- [ ] `ok: true`
- [ ] All checks show `ok: true`
- [ ] SMTP check shows `ok: true`
- [ ] SMTP check latencyMs < 1000ms (healthy)

**Dashboard Verification:**
- [ ] `/ops/overview` shows "Healthy" status
- [ ] Live Health card shows green/ok indicator
- [ ] All probes show as passing

## Performance Testing

### Load Test (Optional)

**Simple Load Test:**
```bash
# Install hey (HTTP load testing tool)
# https://github.com/rakyll/hey

# Test healthz endpoint under load
hey -n 1000 -c 10 $API_BASE/api/healthz/livez

# Test with caching
hey -n 1000 -c 10 $API_BASE/api/healthz
```

**Verify:**
- [ ] Liveness endpoint handles load (should be fast)
- [ ] Readiness endpoint uses cache (consistent latency)
- [ ] No 5xx errors under moderate load
- [ ] Response times within acceptable range

## Security Testing

### Authentication Bypass Attempts

**Basic Auth (if configured):**
```bash
# Attempt without credentials
curl -i $API_BASE/ops/overview
# Expected: 401 Unauthorized

# Attempt with wrong credentials
curl -i -u "wrong:credentials" $API_BASE/ops/overview
# Expected: 401 Unauthorized

# Attempt with correct credentials
curl -i -u "$STAGING_USER:$STAGING_PASS" $API_BASE/ops/overview
# Expected: 200 OK
```

**Admin Endpoints:**
```bash
# Attempt without API key
curl -XPOST $API_BASE/api/admin/deploy/mark \
  -H "Content-Type: application/json" \
  -d '{"sha":"test"}'
# Expected: 401 Unauthorized

# Attempt with wrong API key
curl -XPOST $API_BASE/api/admin/deploy/mark \
  -H "x-api-key: wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"sha":"test"}'
# Expected: 403 Forbidden

# Attempt with correct API key
curl -XPOST $API_BASE/api/admin/deploy/mark \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sha":"test","tag":"v1.0.0"}'
# Expected: 200 OK
```

**Verify:**
- [ ] All endpoints properly enforce authentication
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting active on protected endpoints
- [ ] CORS headers configured correctly

## Final Sign-Off

- [ ] All smoke tests pass
- [ ] All dashboards functional
- [ ] Synthetic error test successful
- [ ] Negative health check test successful
- [ ] Performance acceptable
- [ ] Security controls verified
- [ ] Documentation reviewed and updated
- [ ] Testing team trained on staging access
- [ ] Credentials distributed securely

## Issues Found

Document any issues discovered during testing:

| Issue | Severity | Component | Status | Notes |
|-------|----------|-----------|--------|-------|
| Example: Health check timeout too short | Medium | Healthz | Fixed | Increased to 5000ms |
|       |          |           |        |       |

## Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Staging URL:** _______________  
**Deployment Version:** _______________  

**Notes:**
