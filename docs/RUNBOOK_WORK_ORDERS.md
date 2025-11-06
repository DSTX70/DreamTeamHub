# Runbook: Work Orders Budget Management

**Last Updated:** 2025-11-06  
**Severity:** P2 (Budget Control)  
**Audience:** Operations team, finance team, platform engineers  
**Estimated Time:** 5-10 minutes

---

## Overview

Work Orders execute simulated agent tasks with **budget caps** to prevent runaway costs:
- **Runs per day:** Maximum number of executions per work order per calendar day (midnight to midnight UTC)
- **USD per day:** Maximum cost per work order per calendar day (midnight to midnight UTC)

**Key Concepts:**
- Budget enforcement uses **calendar day** (not rolling 24-hour window)
- Caps reset automatically at midnight UTC
- 429 responses are simple error messages (usage details in operations logs)
- Cost column stored as TEXT (requires `::numeric` cast in SQL queries)

This runbook covers:
- Understanding budget caps and calendar day enforcement
- Safely raising caps with approval workflows
- Responding to rate limit errors (HTTP 429)
- Monitoring work order spend via operations logs

---

## How Budget Caps Work

### Cap Enforcement Logic

**Location:** `server/api/work_orders.route.ts`

Each work order has two caps stored in database:
```typescript
{
  caps: {
    runsPerDay: 100,    // Max executions per calendar day
    usdPerDay: 2.00     // Max cost per calendar day (default)
  }
}
```

**Enforcement Window:** Calendar day (midnight to midnight UTC)

**How it works:**
- Code explicitly uses UTC: `startOfDay.setUTCHours(0, 0, 0, 0)` (line 61)
- Counts all runs with `started_at >= midnight today UTC`
- Resets automatically at midnight UTC regardless of server timezone

**Example:**
- Caps: 100 runs/day, $5.00/day
- First run: 2025-11-06 00:01 UTC
- 100th run: 2025-11-06 23:45 UTC
- Budget resets: 2025-11-07 00:00 UTC (can run again)

**IMPORTANT:** Budget window is **calendar day**, not 24 hours from first run.

### Rate Limit Response

When cap exceeded, API returns:

**HTTP 429 Too Many Requests**

```json
{
  "error": "runs/day cap reached"
}
```

OR

```json
{
  "error": "budget cap reached"
}
```

**Headers:**
```
Retry-After: 86400
```

**Note:** The 429 response does NOT include usage metrics in the JSON body. To see current usage, check:
1. **Operations Events:** Navigate to `/ops-logs`, filter by `RATE_LIMIT_429`
2. **Operations Dashboard:** View 429 counts at `/ops-dashboard`
3. **Database query:** See SQL examples below

**What Retry-After Means:**
- Value: `86400` (seconds = 24 hours)
- Client should wait before retrying
- **Location in code:** `server/api/work_orders.route.ts` lines 84, 106

---

## Scenario 1: Runs Per Day Cap Reached

**Symptoms:**
- User sees "Work order rate limit" error
- HTTP 429 response with simple JSON: `{ "error": "runs/day cap reached" }`
- **Note:** Response does NOT include current usage counts

**Root Cause:**
- Work order executed too many times in 24h window
- Cap set too low for legitimate use case
- Potential abuse/misconfiguration

**Resolution Steps:**

### 1. Verify Legitimacy

**Check recent runs:**
```sql
-- IMPORTANT: Use calendar day, not 24-hour window
-- NOTE: cost column is TEXT, requires ::numeric cast
SELECT 
  agent_name as agent,
  wo_id,
  COUNT(*) as run_count,
  SUM(cost::numeric) as total_cost,
  MIN(started_at) as first_run,
  MAX(finished_at) as last_run
FROM work_order_runs
WHERE wo_id = 'target-work-order-id'
  AND started_at >= DATE_TRUNC('day', NOW())  -- Midnight today (UTC)
GROUP BY agent_name, wo_id;
```

**Red Flags:**
- Single agent executing same work order >50 times/hour
- Runs from unknown agents
- Status = 'error' for most runs (infinite retry loop)

**Legitimate Use Cases:**
- High-frequency monitoring tasks
- Batch processing jobs
- Load testing (pre-approved)

### 2. Assess Budget Impact

**Check current usage:**
```sql
-- IMPORTANT: Use calendar day, not 24-hour window
-- NOTE: cost column is TEXT, requires ::numeric cast
SELECT 
  wo_id,
  COUNT(*) as runs_today,
  SUM(cost::numeric) as cost_today,
  AVG(cost::numeric) as avg_cost_per_run
FROM work_order_runs
WHERE wo_id = 'target-work-order-id'
  AND started_at >= DATE_TRUNC('day', NOW())  -- Midnight today (UTC)
GROUP BY wo_id;
```

**Budget Thresholds:**
- **Safe to raise:** `cost_today < $2.00`
- **Caution:** `cost_today $2.00-$10.00` (requires approval)
- **Escalate:** `cost_today > $10.00` (finance team review)

### 3. Raise Runs Cap (If Approved)

**IMPORTANT:** Only raise caps after verifying legitimacy and budget impact

```sql
-- Raise runs/day cap to 200 (from default 100)
UPDATE work_orders
SET caps = jsonb_set(
  caps,
  '{runsPerDay}',
  '200'
)
WHERE id = 'target-work-order-id';
```

**Safe Cap Levels:**
- **Low frequency:** 50-100 runs/day
- **Medium frequency:** 100-500 runs/day
- **High frequency:** 500-1000 runs/day
- **Critical infrastructure:** 1000+ runs/day (requires director approval)

**Document Change:**
```sql
-- Create audit event for cap change
INSERT INTO operations_events (kind, message, owner_type, owner_id, actor, meta)
VALUES (
  'WORK_ORDER_CAP_CHANGE',
  'Raised runs/day cap from 100 to 200 due to legitimate high-frequency use',
  'work_order',
  'target-work-order-id',
  'ops-team@example.com',
  jsonb_build_object(
    'previousCap', 100,
    'newCap', 200,
    'reason', 'Approved by ops team - monitoring job',
    'approver', 'manager@example.com'
  )
);
```

---

## Scenario 2: USD Per Day Cap Reached

**Symptoms:**
- User sees "budget cap reached" error
- HTTP 429 response with simple JSON: `{ "error": "budget cap reached" }`
- **Note:** Response does NOT include cost amounts - check operations logs for details

**Root Cause:**
- Work order costs exceeded daily budget
- Expensive operations (e.g., GPT-4 calls)
- Cost per run higher than expected
- Potential abuse

**Resolution Steps:**

### 1. Analyze Cost Breakdown

**Check cost distribution:**
```sql
-- IMPORTANT: Use calendar day, not 24-hour window
SELECT 
  wo_id,
  agent_name as agent,
  COUNT(*) as run_count,
  AVG(cost::numeric) as avg_cost,
  MAX(cost::numeric) as max_cost,
  SUM(cost::numeric) as total_cost,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY cost::numeric) as p95_cost
FROM work_order_runs
WHERE wo_id = 'target-work-order-id'
  AND started_at >= DATE_TRUNC('day', NOW())  -- Midnight today (UTC)
GROUP BY wo_id, agent_name;
```

**Red Flags:**
- `avg_cost > $0.10` per run (expensive)
- `max_cost > $1.00` per run (very expensive)
- Sudden cost spike (>2x normal)

**Legitimate Scenarios:**
- LLM-heavy workloads (GPT-4 API calls)
- Large document processing
- Compute-intensive tasks

### 2. Investigate Cost Drivers

**Common Cost Factors:**
- OpenAI API usage (GPT-4 tokens)
- External API calls (paid services)
- Processing time (compute cost)

**Optimization Opportunities:**
- Switch to cheaper model (GPT-4o-mini vs GPT-4)
- Reduce token usage (shorter prompts)
- Batch operations
- Cache results

### 3. Raise USD Cap (If Justified)

**CRITICAL:** Requires finance approval for caps >$10/day

```sql
-- Raise USD/day cap to $10.00 (from default $5.00)
UPDATE work_orders
SET caps = jsonb_set(
  caps,
  '{usdPerDay}',
  '10.00'
)
WHERE id = 'target-work-order-id';
```

**Approval Levels:**
- **< $10/day:** Operations team approval
- **$10-$50/day:** Director approval
- **> $50/day:** Finance + VP approval

**Document Approval:**
```sql
INSERT INTO operations_events (kind, message, owner_type, owner_id, actor, meta)
VALUES (
  'WORK_ORDER_CAP_CHANGE',
  'Raised USD/day cap from $5.00 to $10.00 for critical LLM workflow',
  'work_order',
  'target-work-order-id',
  'finance-team@example.com',
  jsonb_build_object(
    'previousCap', 5.00,
    'newCap', 10.00,
    'reason', 'Approved GPT-4 usage for knowledge extraction',
    'approver', 'director@example.com',
    'approvalDate', NOW()
  )
);
```

---

## Scenario 3: Suspicious Activity (Potential Abuse)

**Symptoms:**
- Unusual spike in work order runs
- Multiple 429 errors across different work orders
- Runs from unexpected agents or IP addresses

**Response:**

### 1. Immediate Action

**Disable work order:**
```sql
UPDATE work_orders
SET status = 'suspended'
WHERE id = 'suspicious-work-order-id';
```

**Check operations events:**
```sql
SELECT * FROM operations_events
WHERE kind IN ('WORK_ORDER_START', 'RATE_LIMIT_429')
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### 2. Investigate Actor

**Find who initiated runs:**
```sql
-- IMPORTANT: Use calendar day, not 24-hour window
SELECT 
  actor,
  COUNT(*) as run_count,
  meta->>'agentName' as agent_name,
  MIN(created_at) as first_run,
  MAX(created_at) as last_run
FROM operations_events
WHERE kind = 'WORK_ORDER_START'
  AND (meta->>'woId')::text = 'suspicious-work-order-id'
  AND created_at >= DATE_TRUNC('day', NOW())  -- Midnight today (UTC)
GROUP BY actor, meta->>'agentName';
```

### 3. Escalate

- **Internal user:** Contact account owner
- **External user:** Revoke DTH_API_TOKEN, contact security team
- **Automated abuse:** Implement IP-based rate limiting

---

## Monitoring & Alerts

### Real-Time Dashboard

**Operations Dashboard** (`/ops-dashboard`)

Key metrics:
- **Work Order Runs (24h):** Total executions
- **429 Rate Limits:** Cap violations
- **Error Rate:** Failed runs

**Alert Thresholds:**
- **Low Priority:** >10 rate limit hits in 10 min (user education)
- **Medium Priority:** >1% error rate (potential misconfiguration)
- **High Priority:** >10 rate limits across different work orders (potential abuse)

### Daily Budget Report

**Run manually or schedule:**
```sql
-- IMPORTANT: Use calendar day, not 24-hour window
SELECT 
  w.id,
  w.title,
  w.caps->>'runsPerDay' as run_cap,
  w.caps->>'usdPerDay' as usd_cap,
  COUNT(r.id) as actual_runs,
  COALESCE(SUM(r.cost::numeric), 0) as actual_cost,
  ROUND(100.0 * COUNT(r.id) / (w.caps->>'runsPerDay')::int, 1) as run_utilization_pct,
  ROUND(100.0 * COALESCE(SUM(r.cost::numeric), 0) / (w.caps->>'usdPerDay')::numeric, 1) as cost_utilization_pct
FROM work_orders w
LEFT JOIN work_order_runs r 
  ON w.id = r.wo_id 
  AND r.started_at >= DATE_TRUNC('day', NOW())  -- Midnight today (UTC)
WHERE w.status = 'draft'  -- Note: status is 'draft', not 'active' in current schema
GROUP BY w.id, w.title, w.caps
ORDER BY cost_utilization_pct DESC;
```

**Action Items:**
- Work orders at >80% utilization: Consider raising caps
- Work orders at <10% utilization: Review necessity
- Work orders at 100%: User likely blocked, investigate

---

## Retry-After Header Details

### Where It's Set

**File:** `server/api/work_orders.route.ts`

**Lines:**
- Line 84: Runs per day cap exceeded
- Line 106: USD per day cap exceeded

**Code:**
```typescript
res.setHeader("Retry-After", "86400");
return res.status(429).json({ error: "...", caps, usage });
```

### Client Handling

**Recommended client behavior:**
```javascript
const response = await fetch('/api/work-orders/start', { ... });

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  
  // Wait and retry
  setTimeout(() => {
    // Retry request
  }, retryAfter * 1000);
}
```

### Changing Retry-After Value

**Default:** 86400 seconds (24 hours)

**To change (requires code deployment):**
```typescript
// server/api/work_orders.route.ts

// Option 1: Fixed shorter window
res.setHeader("Retry-After", "3600"); // 1 hour

// Option 2: Dynamic based on cap reset time
const resetTime = Math.max(0, 86400 - (Date.now() - firstRunToday));
res.setHeader("Retry-After", String(Math.ceil(resetTime / 1000)));
```

**IMPORTANT:** Changing this requires code review and deployment

---

## Safe Cap Adjustment Workflow

### 1. Request Received

**Information needed:**
- Work order ID
- Current cap values
- Requested new cap values
- Business justification
- Estimated cost impact

### 2. Risk Assessment

**Criteria:**
- Is usage legitimate? (check run history)
- Is cost reasonable? (check budget impact)
- Is there optimization potential? (check avg cost per run)

**Approval Matrix:**
| Cap Increase | Approver Required |
|--------------|-------------------|
| < $10/day | Operations Team |
| $10-$50/day | Director |
| > $50/day | Finance + VP |

### 3. Implementation

**Update database:**
```sql
UPDATE work_orders
SET caps = jsonb_set(
  jsonb_set(caps, '{runsPerDay}', 'NEW_RUN_CAP'),
  '{usdPerDay}',
  'NEW_USD_CAP'
)
WHERE id = 'work-order-id';
```

**Create audit trail:**
```sql
INSERT INTO operations_events (kind, message, owner_type, owner_id, actor, meta)
VALUES (
  'WORK_ORDER_CAP_CHANGE',
  'Cap adjustment approved',
  'work_order',
  'work-order-id',
  'approver@example.com',
  jsonb_build_object(
    'changes', jsonb_build_object(
      'runsPerDay', jsonb_build_object('old', OLD_VALUE, 'new', NEW_VALUE),
      'usdPerDay', jsonb_build_object('old', OLD_VALUE, 'new', NEW_VALUE)
    ),
    'reason', 'User justification here',
    'approvalLevel', 'Director'
  )
);
```

### 4. Verification

**Wait 5 minutes, then check:**
```sql
SELECT id, title, caps, status
FROM work_orders
WHERE id = 'work-order-id';
```

**Test execution:**
- User should be able to start run
- No 429 error
- Run appears in work_order_runs table

---

## Prevention Best Practices

### For Operators

1. **Set conservative caps by default:** Start with 100 runs/day, $5/day
2. **Monitor daily:** Review utilization dashboard
3. **Document changes:** Always create audit events for cap adjustments
4. **Educate users:** Explain budget caps in onboarding

### For Users

1. **Optimize costs:** Use cheaper models when possible
2. **Batch operations:** Reduce number of runs
3. **Monitor usage:** Check Ops Dashboard regularly
4. **Request cap increases proactively:** Don't wait for 429 errors

### For Developers

1. **Implement cost warnings:** Alert at 80% utilization
2. **Add cost estimation:** Show estimated cost before run
3. **Optimize LLM calls:** Cache results, use streaming
4. **Add retry logic:** Handle 429 gracefully in clients

---

## Quick Reference

### Key Files
- **Budget enforcement:** `server/api/work_orders.route.ts`
- **Retry-After config:** Lines 84, 106 in above file

### Key Database Tables
- `work_orders` - Cap configuration
- `work_order_runs` - Execution history and costs

### Key SQL Queries

**Current usage (today's calendar day):**
```sql
SELECT wo_id, COUNT(*) as runs, SUM(cost::numeric) as cost
FROM work_order_runs
WHERE started_at >= DATE_TRUNC('day', NOW())  -- Midnight today (UTC)
GROUP BY wo_id;
```

**Cap violators (with details):**
```sql
SELECT 
  id,
  actor,
  message,
  meta->>'woId' as work_order_id,
  meta->>'woTitle' as work_order_title,
  meta->>'agentName' as agent,
  meta->>'reason' as cap_type,
  meta->>'runsToday' as runs_today,
  meta->>'cap' as cap_limit,
  created_at
FROM operations_events
WHERE kind = 'RATE_LIMIT_429'
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Default Values
- **Runs per day:** 100
- **USD per day:** $2.00 (default in code, often adjusted to $5.00+)
- **Retry-After:** 86400 seconds (24 hours)
- **Budget window:** Calendar day (midnight to midnight UTC)
- **Status field:** `draft` (not `active` - all work orders use 'draft' status)

---

## Escalation

**L1 Support:** Review usage, approve <$10/day increases  
**L2 Support:** Approve $10-$50/day increases, investigate abuse  
**L3 Support:** Finance/VP approval >$50/day, code changes to Retry-After

**Emergency Contacts:** See `replit.md` for team contacts
