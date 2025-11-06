# Google Drive Service Account - Least Privilege Verification

**Last Updated:** 2025-11-06  
**Status:** Pre-Production Requirement  
**Purpose:** Verify Service Account has minimum required permissions

---

## Overview

Dream Team Hub uses a **Google Service Account** to access Google Drive for Knowledge Management features:
- Search files in `read/` folders
- Upload drafts to `draft/` folders  
- Publish (move) files from `draft/` to `publish/` folders

**Security Principle:** Service Account should have **folder-level** permissions only, NOT domain-wide or root Drive access.

---

## Required Folder Structure

Each Business Unit (BU) requires **three folders** in Google Drive:

### IMAGINATION Business Unit
```
📁 IMAGINATION/
  📁 read/          ← Folder ID: [to be configured]
  📁 draft/         ← Folder ID: [to be configured]
  📁 publish/       ← Folder ID: [to be configured]
```

### INNOVATION Business Unit
```
📁 INNOVATION/
  📁 read/          ← Folder ID: [to be configured]
  📁 draft/         ← Folder ID: [to be configured]
  📁 publish/       ← Folder ID: [to be configured]
```

### IMPACT Business Unit
```
📁 IMPACT/
  📁 read/          ← Folder ID: [to be configured]
  📁 draft/         ← Folder ID: [to be configured]
  📁 publish/       ← Folder ID: [to be configured]
```

**Total:** 9 folders requiring Service Account access

---

## Database Configuration

Folder IDs are stored in the `knowledge_links` table:

```sql
-- View current configuration
SELECT 
  business_unit,
  role,
  drive_folder_id
FROM knowledge_links
ORDER BY business_unit, role;
```

**Expected output:**
| business_unit | role | drive_folder_id |
|---------------|------|-----------------|
| IMAGINATION | read | 1abc...xyz |
| IMAGINATION | draft | 2def...uvw |
| IMAGINATION | publish | 3ghi...rst |
| INNOVATION | read | 4jkl...opq |
| INNOVATION | draft | 5mno...lmn |
| INNOVATION | publish | 6pqr...ijk |
| IMPACT | read | 7stu...ghi |
| IMPACT | draft | 8vwx...def |
| IMPACT | publish | 9yza...abc |

**Action Required:**
1. Create 9 folders in Google Drive (3 per BU)
2. Capture each folder's ID from its URL
   - Example: `https://drive.google.com/drive/folders/1abc...xyz`
   - Folder ID: `1abc...xyz`
3. Insert into database:
   ```sql
   -- IMAGINATION
   INSERT INTO knowledge_links (business_unit, role, drive_folder_id, description)
   VALUES 
     ('IMAGINATION', 'read', 'YOUR_READ_FOLDER_ID', 'IMAGINATION read-only knowledge'),
     ('IMAGINATION', 'draft', 'YOUR_DRAFT_FOLDER_ID', 'IMAGINATION draft uploads'),
     ('IMAGINATION', 'publish', 'YOUR_PUBLISH_FOLDER_ID', 'IMAGINATION published knowledge');
   
   -- INNOVATION
   INSERT INTO knowledge_links (business_unit, role, drive_folder_id, description)
   VALUES 
     ('INNOVATION', 'read', 'YOUR_READ_FOLDER_ID', 'INNOVATION read-only knowledge'),
     ('INNOVATION', 'draft', 'YOUR_DRAFT_FOLDER_ID', 'INNOVATION draft uploads'),
     ('INNOVATION', 'publish', 'YOUR_PUBLISH_FOLDER_ID', 'INNOVATION published knowledge');
   
   -- IMPACT
   INSERT INTO knowledge_links (business_unit, role, drive_folder_id, description)
   VALUES 
     ('IMPACT', 'read', 'YOUR_READ_FOLDER_ID', 'IMPACT read-only knowledge'),
     ('IMPACT', 'draft', 'YOUR_DRAFT_FOLDER_ID', 'IMPACT draft uploads'),
     ('IMPACT', 'publish', 'YOUR_PUBLISH_FOLDER_ID', 'IMPACT published knowledge');
   ```

---

## Minimum Required Permissions

### Service Account Email

**Location:** Environment variable `GDRIVE_SA_EMAIL`

**Format:** `dth-sa@{project-id}.iam.gserviceaccount.com`

**How to find:**
1. Google Cloud Console → IAM & Admin → Service Accounts
2. Find your service account
3. Copy email address

---

### Folder Permissions Matrix

| Folder Type | Required Permission | API Operations Allowed |
|-------------|---------------------|------------------------|
| `read/` | **Viewer** | List files, read metadata, download |
| `draft/` | **Editor** | List files, read metadata, create files |
| `publish/` | **Editor** | List files, read metadata, create files, move files |

**IMPORTANT:**
- Do NOT grant "Owner" permission
- Do NOT share root Drive folder with Service Account
- Do NOT enable domain-wide delegation
- Do NOT grant broader Drive scope than specific folders

---

## Permission Verification Checklist

### Step 1: Create Service Account (If Not Done)

1. **Google Cloud Console** → IAM & Admin → Service Accounts
2. Click **Create Service Account**
3. Name: `dth-knowledge-sa`
4. Description: `Dream Team Hub Knowledge Management`
5. Click **Create and Continue**
6. **Skip** role assignment (we'll use folder-level permissions)
7. Click **Done**
8. Click on new service account → **Keys** tab
9. Click **Add Key** → **Create new key** → **JSON**
10. Download JSON file
11. Extract values:
    - `client_email` → Set as `GDRIVE_SA_EMAIL` in Replit Secrets
    - `private_key` → Set as `GDRIVE_SA_PRIVATE_KEY` in Replit Secrets

### Step 2: Share Folders with Service Account

For **each of the 9 folders**:

1. **Open folder in Google Drive**
2. Right-click folder → **Share**
3. Enter Service Account email (`GDRIVE_SA_EMAIL`)
4. Set permission based on folder type:
   - `read/` folders: **Viewer**
   - `draft/` folders: **Editor**
   - `publish/` folders: **Editor**
5. **Uncheck** "Notify people" (Service Account can't receive email)
6. Click **Share**
7. Document folder ID in checklist below

### Step 3: Verification Checklist

**IMAGINATION:**
- [ ] `read/` folder shared with SA as Viewer
  - Folder ID: ________________
  - Permission verified: Yes / No
- [ ] `draft/` folder shared with SA as Editor
  - Folder ID: ________________
  - Permission verified: Yes / No
- [ ] `publish/` folder shared with SA as Editor
  - Folder ID: ________________
  - Permission verified: Yes / No

**INNOVATION:**
- [ ] `read/` folder shared with SA as Viewer
  - Folder ID: ________________
  - Permission verified: Yes / No
- [ ] `draft/` folder shared with SA as Editor
  - Folder ID: ________________
  - Permission verified: Yes / No
- [ ] `publish/` folder shared with SA as Editor
  - Folder ID: ________________
  - Permission verified: Yes / No

**IMPACT:**
- [ ] `read/` folder shared with SA as Viewer
  - Folder ID: ________________
  - Permission verified: Yes / No
- [ ] `draft/` folder shared with SA as Editor
  - Folder ID: ________________
  - Permission verified: Yes / No
- [ ] `publish/` folder shared with SA as Editor
  - Folder ID: ________________
  - Permission verified: Yes / No

### Step 4: Test Access

**Test read access:**
```bash
curl -X GET "https://your-repl.replit.app/api/knowledge/IMAGINATION/search?q=test" \
  -H "Authorization: Bearer $DTH_API_TOKEN"
```

**Expected:** Returns list of files (or empty array if no files)
**Error 403:** Service Account lacks permission to folder

**Test draft upload:**
```bash
curl -X POST "https://your-repl.replit.app/api/knowledge/IMAGINATION/draft" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-draft.md",
    "text": "# Test\nThis is a test draft.",
    "mimeType": "text/markdown"
  }'
```

**Expected:** Returns `{ "ok": true, "file": {...} }`
**Error 403:** Service Account lacks write permission to draft folder

**Test publish (move file):**
```bash
curl -X POST "https://your-repl.replit.app/api/knowledge/IMAGINATION/publish/{draftFileId}" \
  -H "Authorization: Bearer $DTH_API_TOKEN" \
  -H "X-Reviewer-Token: reviewer1@example.com" \
  -H "Idempotency-Key: test-publish-001" \
  -H "Content-Type: application/json" \
  -d '{
    "approver": "reviewer2@example.com",
    "note": "Test publish"
  }'
```

**Expected:** File moved from draft to publish folder
**Error 403:** Service Account lacks permission to source or target folder

---

## Security Audit

### Pre-Production Checklist

- [ ] Service Account has NO project-level IAM roles
- [ ] Service Account has NO domain-wide delegation enabled
- [ ] Service Account can ONLY access 9 specific folders
- [ ] No "Owner" permissions granted (only Viewer/Editor)
- [ ] Service Account key is stored in Replit Secrets (not code)
- [ ] Private key uses literal `\n` in Replit Secrets
- [ ] All 9 folders tested and accessible
- [ ] No unnecessary folders shared with Service Account

### Verify No Excessive Permissions

**Check project-level roles:**
1. Google Cloud Console → IAM & Admin → IAM
2. Search for Service Account email
3. **Expected:** NO entries found (Service Account should not appear)
4. **If found:** Remove all project-level roles

**Check domain-wide delegation:**
1. Google Cloud Console → IAM & Admin → Service Accounts
2. Click on Service Account
3. **Advanced settings** → Domain-wide delegation
4. **Expected:** Status = "Disabled"
5. **If enabled:** Disable immediately

**Check folder access:**
```bash
# List all folders Service Account has access to
# (This requires Drive API client script, not shown here)
# Manually verify in Google Drive:
1. Sign in with Service Account credentials (via API/script)
2. List all accessible folders
3. Expected: Only 9 folders (3 per BU)
4. If more: Revoke extra permissions
```

---

## OAuth Scope Verification

**Code location:** `server/integrations/googleDrive_real.ts` line 32

```typescript
scopes: ["https://www.googleapis.com/auth/drive"]
```

**Current scope:** Full Google Drive access

**Why this is acceptable:**
- OAuth scope is requested at application level
- Actual access is restricted via folder-level sharing
- Service Account can only access folders explicitly shared with it
- This is Google's recommended pattern for Service Accounts

**What prevents abuse:**
- Folder-level permissions (not scope)
- Service Account cannot access files/folders not shared with it
- No domain-wide delegation enabled

**Alternative (more restrictive) scope:**
```typescript
scopes: ["https://www.googleapis.com/auth/drive.file"]
```

**`drive.file` scope:**
- Only allows access to files created by the application
- Does NOT allow access to existing user files (even if shared)
- **Problem:** Cannot search in `read/` folders created by users
- **Conclusion:** Full `drive` scope is required for read-only Knowledge search feature

**Decision:** Use full `drive` scope + folder-level permission control (current implementation)

---

## Least Privilege Best Practices

### ✅ DO:
- Use folder-level sharing (Viewer/Editor)
- Store Service Account key in Replit Secrets
- Rotate Service Account key annually
- Audit folder access quarterly
- Document folder IDs in database

### ❌ DON'T:
- Grant project-level IAM roles to Service Account
- Enable domain-wide delegation
- Share root Drive folder with Service Account
- Grant "Owner" permission on folders
- Commit Service Account key to code
- Use personal Google account instead of Service Account

---

## Incident Response

### Scenario: Service Account Compromised

**Immediate Actions:**
1. Revoke Service Account key:
   - Google Cloud Console → IAM & Admin → Service Accounts
   - Click Service Account → Keys tab
   - Delete compromised key
2. Remove folder sharing:
   - For each folder, remove Service Account from sharing
3. Generate new Service Account key
4. Update `GDRIVE_SA_PRIVATE_KEY` in Replit Secrets
5. Re-share 9 folders with Service Account

**Investigation:**
- Check Operations Logs for suspicious KNOWLEDGE_DRAFT or PUBLISH events
- Review `operations_events` table for unauthorized access
- Audit Google Drive activity logs (Admin Console)

### Scenario: Excessive Permissions Detected

**Actions:**
1. Identify extra folders/permissions
2. Remove Service Account from folders not in checklist
3. Verify only 9 folders remain accessible
4. Document findings in security incident log

---

## Monitoring

### Quarterly Audit

**Run every 3 months:**
1. Verify Service Account email and key are current
2. Check all 9 folder IDs match database configuration
3. Test access to each folder (read, draft, publish)
4. Verify no additional folders shared with Service Account
5. Confirm no project-level IAM roles exist
6. Review Operations Logs for anomalies

**Audit SQL:**
```sql
-- Verify folder configuration
SELECT business_unit, role, drive_folder_id, created_at, updated_at
FROM knowledge_links
ORDER BY business_unit, role;

-- Check recent Drive activity
SELECT kind, message, actor, created_at
FROM operations_events
WHERE kind IN ('KNOWLEDGE_DRAFT', 'PUBLISH', 'PUBLISH_ERROR')
  AND created_at > NOW() - INTERVAL '90 days'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Support & Resources

**Google Cloud Documentation:**
- Service Accounts: https://cloud.google.com/iam/docs/service-accounts
- Drive API: https://developers.google.com/drive/api/guides/about-auth

**Internal Documentation:**
- Environment Variables: `docs/GO_LIVE_ENV_VARS.md`
- Publish Runbook: `docs/RUNBOOK_PUBLISH_INCIDENT.md`

**Troubleshooting:**
- 403 Forbidden errors → Verify folder sharing
- "Missing GDRIVE_SA_EMAIL" → Check Replit Secrets
- "JWT token invalid" → Check private key format (`\n` handling)

---

## Sign-Off

**Completed by:** _________________  
**Date:** _________________  
**Verification Method:** Manual testing + SQL audit  
**Next Audit Due:** _________________ (3 months from completion)  

**Approvals:**
- [ ] Operations Team Lead
- [ ] Security Team
- [ ] Platform Engineer
