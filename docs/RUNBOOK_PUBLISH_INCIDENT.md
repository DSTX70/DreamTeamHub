# Runbook: Publish Incident Response

**Last Updated:** 2025-11-06  
**Severity:** P1 (Production Impact)  
**Audience:** On-call engineers, operators  
**Estimated Time:** 5-15 minutes

---

## Overview

This runbook covers responding to Knowledge Publishing incidents where:
- Files were published to wrong folder
- Duplicate publish operations occurred
- Idempotency failures
- Need to trace publish events through system

---

## Incident Scenarios

### Scenario 1: File Published to Wrong Folder

**Symptoms:**
- User reports file in wrong Business Unit or wrong folder (draft vs publish)
- File visible in Google Drive but in incorrect location

**Root Cause:**
- Incorrect `businessUnit` parameter passed to publish API
- Wrong `targetFolderId` in publish request
- File moved manually after publish

**Resolution Steps:**

1. **Identify the File**
   ```bash
   # Get file details from operations logs
   # Navigate to: /ops-logs
   # Filter: Kind = "PUBLISH", search for filename or X-Request-Id
   ```

2. **Locate X-Request-Id**
   - Find the publish event in Operations Logs
   - Copy the `X-Request-Id` from event metadata
   - Example: `meta.requestId: "req_abc123xyz"`

3. **Trace Full Request Chain**
   ```sql
   -- Run in database console (use execute_sql_tool)
   SELECT id, kind, message, meta, created_at
   FROM operations_events
   WHERE (meta->>'requestId')::text = 'req_abc123xyz'
   ORDER BY created_at DESC;
   ```
   
   This shows:
   - `KNOWLEDGE_DRAFT`: Original draft upload
   - `PUBLISH`: Publish attempt
   - `PUBLISH_ERROR`: Any errors during publish

4. **Move File to Correct Location**
   
   **Option A: Use Copilot (Recommended)**
   ```
   1. Navigate to /copilot
   2. Use quick action: "Move Published File"
   3. Enter file ID and target folder ID
   4. Verify file moved successfully
   ```

   **Option B: Manual via API**
   ```bash
   curl -X POST https://your-repl.replit.app/api/knowledge/move \
     -H "Authorization: Bearer $DTH_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "fileId": "1a2b3c4d5e6f",
       "targetFolderId": "correct-folder-id",
       "mode": "move"
     }'
   ```

5. **Verify and Document**
   - Confirm file is in correct location
   - Create new operations event for audit trail:
     ```
     Event: KNOWLEDGE_MANUAL_MOVE
     Message: "Moved file due to incorrect publish target"
     Meta: { originalRequestId: "req_abc123xyz", reason: "wrong BU" }
     ```

---

### Scenario 2: Duplicate Publish (Idempotency Failure)

**Symptoms:**
- Multiple copies of same file in Google Drive
- Database shows multiple `PUBLISH` events for same file
- User reports duplicate publish notifications

**Root Cause:**
- Idempotency key not provided in request
- Database unique constraint failed (should prevent this)
- Manual duplicate publish via UI

**Resolution Steps:**

1. **Identify Duplicates**
   ```sql
   -- Find duplicate publish events by filename + BU + timestamp window
   SELECT 
     meta->>'filename' as filename,
     meta->>'businessUnit' as bu,
     COUNT(*) as publish_count,
     ARRAY_AGG(id) as event_ids
   FROM operations_events
   WHERE kind = 'PUBLISH'
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY meta->>'filename', meta->>'businessUnit'
   HAVING COUNT(*) > 1;
   ```

2. **Review Idempotency Protection**
   ```sql
   -- Check if idempotency keys were used
   SELECT id, meta->>'idempotencyKey' as idem_key, created_at
   FROM operations_events
   WHERE kind = 'PUBLISH'
     AND (meta->>'filename')::text = 'problem-file.docx'
   ORDER BY created_at DESC;
   ```
   
   - If `idem_key` is NULL: Request lacked `Idempotency-Key` header
   - If `idem_key` is same: Database constraint should have prevented duplicate
   - If `idem_key` is different: Multiple legitimate requests

3. **Remove Duplicate Files**
   
   **CAUTION:** Only remove if you've confirmed it's a true duplicate
   
   ```bash
   # Delete duplicate from Google Drive
   curl -X DELETE https://www.googleapis.com/drive/v3/files/{fileId} \
     -H "Authorization: Bearer $GDRIVE_ACCESS_TOKEN"
   ```
   
   Or manually delete in Google Drive UI

4. **Prevent Future Duplicates**
   - Verify database constraint exists:
     ```sql
     SELECT constraint_name, constraint_type
     FROM information_schema.table_constraints
     WHERE table_name = 'published_knowledge'
       AND constraint_type = 'UNIQUE';
     ```
   - Expected: Unique index on `(business_unit, filename, file_hash)` with partial `WHERE deleted_at IS NULL`

5. **Client Fix**
   - Ensure clients use `Idempotency-Key` header:
     ```
     Idempotency-Key: publish_${businessUnit}_${filename}_${timestamp}
     ```

---

### Scenario 3: Publish Failed (Error State)

**Symptoms:**
- `PUBLISH_ERROR` event in logs
- File stuck in "draft" state
- User unable to complete publish workflow

**Root Cause:**
- Google Drive API error (403 Forbidden, 500 Internal)
- Service Account permissions issue
- Network timeout
- Invalid file format

**Resolution Steps:**

1. **Find Error Details**
   ```sql
   SELECT id, message, meta->>'error' as error_msg, meta->>'path' as api_path
   FROM operations_events
   WHERE kind = 'PUBLISH_ERROR'
     AND created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Diagnose Error Type**

   **403 Forbidden:**
   - Service Account lacks permissions to target folder
   - Fix: Share folder with `GDRIVE_SA_EMAIL` (see `GO_LIVE_ENV_VARS.md`)
   
   **500 Internal Server Error:**
   - Retry publish operation
   - Check Google Drive API status: https://www.google.com/appsstatus
   
   **Timeout:**
   - Large file upload timeout
   - Increase timeout in `server/api/knowledge.route.ts` if needed
   
   **Invalid Format:**
   - File type not supported
   - Verify `mimeType` in request matches allowed types

3. **Retry Publish**
   
   **Using Academy Sidebar UI (Recommended):**
   - Navigate to project or BU home page
   - Find draft file in evidence pack
   - Click "Publish" again with new `Idempotency-Key`
   
   **Manual Retry via API:**
   ```bash
   curl -X POST https://your-repl.replit.app/api/knowledge/publish \
     -H "Authorization: Bearer $DTH_API_TOKEN" \
     -H "Idempotency-Key: retry_$(date +%s)" \
     -H "Content-Type: application/json" \
     -d '{
       "draftId": "draft-file-id",
       "businessUnit": "IMAGINATION",
       "approver1": "user@example.com",
       "approver2": "user2@example.com"
     }'
   ```

4. **Escalation**
   - If retry fails 3+ times: Escalate to platform team
   - Check Service Account key expiry
   - Verify Drive API quotas not exceeded

---

## Tracing Requests with X-Request-Id

**Every API request** receives a unique `X-Request-Id` for distributed tracing.

### How to Find X-Request-Id

1. **From Browser DevTools**
   - Open browser console (F12)
   - Navigate to Network tab
   - Find failed/successful request
   - Check Response Headers → `X-Request-Id`

2. **From Operations Logs UI**
   - Navigate to `/ops-logs`
   - Find event
   - Expand "View metadata"
   - Look for `requestId` field

3. **From Workflow Logs**
   ```bash
   # Request ID is logged with each API call
   grep "X-Request-Id" /tmp/logs/Start_application_*.log
   ```

### Trace Complete Request Flow

```sql
-- Get all events for a request
SELECT 
  kind,
  message,
  actor,
  meta->>'path' as api_path,
  meta->>'method' as http_method,
  created_at
FROM operations_events
WHERE (meta->>'requestId')::text = 'req_abc123xyz'
ORDER BY created_at ASC;
```

**Expected Event Chain for Successful Publish:**

1. `KNOWLEDGE_DRAFT` - Draft uploaded to Drive
2. `PUBLISH` - Publish initiated with two-reviewer approval
3. (Optional) Additional audit events

**Event Chain for Failed Publish:**

1. `KNOWLEDGE_DRAFT` - Draft uploaded successfully
2. `PUBLISH_ERROR` - Error during publish (check `meta.error`)

---

## Rollback Procedures

### Rollback Published File

**IMPORTANT:** "Rollback" means moving file from `publish/` back to `draft/`

1. **Identify File Location**
   - Get `fileId` from publish event metadata
   - Verify file is in `publish/` folder

2. **Move to Draft Folder**
   ```bash
   # Use Copilot or API
   curl -X POST /api/knowledge/move \
     -H "Authorization: Bearer $DTH_API_TOKEN" \
     -d '{
       "fileId": "published-file-id",
       "targetFolderId": "draft-folder-id",
       "mode": "move"
     }'
   ```

3. **Update Database**
   ```sql
   -- Mark as unpublished in database
   UPDATE published_knowledge
   SET deleted_at = NOW()
   WHERE file_id = 'published-file-id';
   ```

4. **Create Rollback Audit Event**
   - Log manual rollback in operations events
   - Document reason in event message

---

## Prevention & Monitoring

### Idempotency Best Practices

**Always use Idempotency-Key header:**
```
Idempotency-Key: publish_${businessUnit}_${filename}_${timestamp}
```

Database constraint prevents duplicates if same key used within 24h window.

### Monitoring Dashboards

**Operations Dashboard** (`/ops-dashboard`)
- PUBLISH events (24h count)
- PUBLISH_ERROR rate
- Alert triggers:
  - High: >2 PUBLISH errors in 10 minutes
  - Medium: >1% error rate in 24h

**Operations Logs** (`/ops-logs`)
- Real-time event stream
- Filter by Kind, Owner Type, Time Range
- Export to CSV for analysis

### Alert Thresholds

- **P1 Alert:** >2 PUBLISH_ERROR in 10 minutes
- **P2 Alert:** >1% error rate in 24 hours
- **P3 Info:** >10 PUBLISH events in 1 hour (potential abuse)

---

## Quick Reference

### Key Files
- **Publish API:** `server/api/knowledge.route.ts`
- **Idempotency Logic:** `server/api/knowledge.route.ts` (lines ~180-200)
- **Drive Client:** `server/integrations/googleDrive_real.ts`

### Key Database Tables
- `operations_events` - All telemetry events
- `published_knowledge` - Published file registry (idempotency)

### Key Environment Variables
- `GDRIVE_SA_EMAIL` - Service Account email
- `GDRIVE_SA_PRIVATE_KEY` - Service Account key
- See `docs/GO_LIVE_ENV_VARS.md` for full reference

### Useful SQL Queries

**Recent publish events:**
```sql
SELECT * FROM operations_events 
WHERE kind IN ('PUBLISH', 'PUBLISH_ERROR')
ORDER BY created_at DESC LIMIT 20;
```

**Events by request ID:**
```sql
SELECT * FROM operations_events
WHERE (meta->>'requestId')::text = 'your-request-id'
ORDER BY created_at;
```

**Error rate by hour:**
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE kind = 'PUBLISH') as publishes,
  COUNT(*) FILTER (WHERE kind = 'PUBLISH_ERROR') as errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE kind = 'PUBLISH_ERROR') / NULLIF(COUNT(*) FILTER (WHERE kind = 'PUBLISH'), 0), 2) as error_rate_pct
FROM operations_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## Escalation

**L1 Support:** Follow this runbook  
**L2 Support:** Platform team (if Service Account issues, Drive API failures)  
**L3 Support:** Development team (if database constraint failures, code bugs)

**Emergency Contacts:** See `replit.md` for team contacts
