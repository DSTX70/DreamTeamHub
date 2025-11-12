# E2E Test Plan: Uploader Admin UI & Audit Trail

## Overview
End-to-end playwright test validating the complete hybrid uploader configuration system including RBAC enforcement, UI interactions, config updates, and audit trail monitoring.

## Test Environment Setup
- Authentication: Replit Auth (OIDC) with test user claims
- Database: Development database with ops_settings and ops_settings_audit tables
- Roles: Test users with ops_viewer, ops_editor, and ops_admin roles

## Test Scenarios

### 1. RBAC Enforcement - Access Control

**Scenario 1.1: Ops Viewer Access (Read-Only)**
1. [OIDC] Configure next login: `{sub: "viewer-001", email: "viewer@test.com", roles: ["ops_viewer"]}`
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Verify] Assert page loads successfully
4. [Verify] Assert "Save Settings" button is NOT visible (read-only for viewer)
5. [Browser] Navigate to `/ops/audit`
6. [Verify] Assert audit trail page loads
7. [Verify] Assert audit records are visible

**Scenario 1.2: Ops Admin Access (Full Control)**
1. [OIDC] Configure next login: `{sub: "admin-001", email: "admin@test.com", roles: ["ops_admin"]}`
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Verify] Assert page loads successfully
4. [Verify] Assert "Save Settings" button IS visible
5. [Verify] Assert all form fields are editable

**Scenario 1.3: Unauthenticated Access Blocked**
1. [New Context] Create new browser context (no auth)
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Verify] Assert redirect to login page OR 401 error

### 2. Uploader Configuration UI

**Scenario 2.1: View Current Configuration**
1. [New Context] Create new browser context
2. [OIDC] Configure next login as ops_admin
3. [Browser] Navigate to `/ops/settings/uploader`
4. [Verify] Assert backend field shows current value
5. [Verify] Assert maxSizeMB field shows value between 1-200
6. [Verify] Assert allowlist field contains comma-separated values
7. [Verify] Assert enabled toggle is present

**Scenario 2.2: Update Max File Size**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Browser] Clear maxSizeMB input field
4. [Browser] Enter "85" in maxSizeMB field
5. [Browser] Click "Save Settings" button (data-testid="button-save")
6. [Verify] Assert success toast appears with "Saved" message
7. [Browser] Refresh page
8. [Verify] Assert maxSizeMB field shows "85"

**Scenario 2.3: Update Allowlist**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Browser] Clear allowlist input field
4. [Browser] Enter "png,jpeg,pdf,docx" in allowlist field
5. [Browser] Click "Save Settings"
6. [Verify] Assert success toast appears
7. [Browser] Refresh page
8. [Verify] Assert allowlist field contains "png,jpeg,pdf,docx"

**Scenario 2.4: Validation - Invalid Allowlist Format**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Browser] Enter "image/png,image/jpeg" in allowlist field (invalid: contains '/')
4. [Browser] Click "Save Settings"
5. [Verify] Assert error toast appears with allowlist validation message
6. [Verify] Assert allowlist field is NOT saved (refresh shows old value)

**Scenario 2.5: Validation - Out of Range Size**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Browser] Enter "300" in maxSizeMB field (exceeds 200 max)
4. [Browser] Click "Save Settings"
5. [Verify] Assert success (should clamp to 200 automatically)
6. [Browser] Refresh page
7. [Verify] Assert maxSizeMB field shows "200" (clamped)

**Scenario 2.6: Toggle Enabled State**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Browser] Click enabled toggle to disable
4. [Browser] Click "Save Settings"
5. [Verify] Assert success toast
6. [Browser] Refresh page
7. [Verify] Assert enabled toggle is OFF

### 3. Audit Trail Monitoring

**Scenario 3.1: View Audit Trail Page**
1. [New Context] Create authenticated ops_viewer context
2. [Browser] Navigate to `/ops/audit`
3. [Verify] Assert page title is "Audit Trail"
4. [Verify] Assert trigger verification status shows ✅ active
5. [Verify] Assert summary stats are displayed (Total Changes, Most Active User, Most Changed Setting)

**Scenario 3.2: Verify Audit Record After Config Change**
1. [New Context] Create authenticated ops_admin context
2. [API] GET `/api/ops/audit/trail/uploads` to capture initial state
3. [Browser] Navigate to `/ops/settings/uploader`
4. [Browser] Change maxSizeMB to unique value (e.g., 42)
5. [Browser] Click "Save Settings"
6. [Browser] Navigate to `/ops/audit`
7. [Verify] Assert new audit record appears with maxSizeMB change
8. [Verify] Assert old value and new value (42) are displayed
9. [Verify] Assert changed_by shows current user ID

**Scenario 3.3: Filter Audit Trail by Setting**
1. [New Context] Create authenticated ops_viewer context
2. [Browser] Navigate to `/ops/audit`
3. [Browser] Select "Uploader" from setting filter dropdown
4. [Verify] Assert only uploader-related audit records are shown
5. [Browser] Select "All Settings" from filter
6. [Verify] Assert all audit records are shown again

**Scenario 3.4: Audit Trail Refresh**
1. [New Context] Create authenticated ops_viewer context
2. [Browser] Navigate to `/ops/audit`
3. [Browser] Note current record count
4. [API] POST `/api/ops/uploader/config` with header `x-role: ops_admin` to make a change
5. [Browser] Click "Refresh" button (data-testid="button-refresh")
6. [Verify] Assert new audit record appears in the list

### 4. File Upload Flow Integration

**Scenario 4.1: File Upload with Config Enabled**
1. [New Context] Create authenticated user context
2. [API] POST `/api/ops/uploader/config` with `{enabled: true}` to enable uploads
3. [Browser] Navigate to work item page with FilesPanel
4. [Browser] Select a test file (test-file.pdf, ~1MB)
5. [Browser] Select visibility: "org"
6. [Browser] Click "Upload" button
7. [Verify] Assert success toast appears
8. [Verify] Assert file appears in files list table

**Scenario 4.2: File Upload Blocked When Disabled**
1. [New Context] Create authenticated ops_admin context
2. [API] POST `/api/ops/uploader/config` with `{enabled: false}` to disable uploads
3. [Browser] Navigate to work item page with FilesPanel
4. [Verify] Assert "Upload" button is disabled OR shows message "Uploads disabled"

**Scenario 4.3: File Upload Respects Size Limit**
1. [New Context] Create authenticated ops_admin context
2. [API] POST `/api/ops/uploader/config` with `{maxSizeMB: 1}` (1 MB limit)
3. [Browser] Navigate to work item page with FilesPanel
4. [Browser] Select a large test file (test-large.pdf, ~5MB)
5. [Browser] Click "Upload" button
6. [Verify] Assert error toast appears with "file size" or "exceeds limit" message

**Scenario 4.4: File Upload Respects Allowlist**
1. [New Context] Create authenticated ops_admin context
2. [API] POST `/api/ops/uploader/config` with `{allowlist: "png,jpeg"}` (images only)
3. [Browser] Navigate to work item page with FilesPanel
4. [Browser] Select a PDF file (test-doc.pdf)
5. [Browser] Click "Upload" button
6. [Verify] Assert error toast appears with "file type" or "not allowed" message

### 5. Concurrent Admin Operations

**Scenario 5.1: Multiple Admins Updating Config**
1. [Context A] Create authenticated ops_admin context (admin-A)
2. [Context B] Create authenticated ops_admin context (admin-B)
3. [Context A Browser] Navigate to `/ops/settings/uploader`
4. [Context B Browser] Navigate to `/ops/settings/uploader`
5. [Context A Browser] Set maxSizeMB to 100
6. [Context B Browser] Set maxSizeMB to 120
7. [Context A Browser] Click "Save Settings"
8. [Context B Browser] Click "Save Settings"
9. [Verify] Both saves succeed (last write wins)
10. [Context A Browser] Refresh page
11. [Verify] Assert maxSizeMB shows 120 (Context B's value)
12. [Browser] Navigate to `/ops/audit`
13. [Verify] Assert TWO audit records exist showing both changes

### 6. Edge Cases & Error Handling

**Scenario 6.1: Network Error During Save**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [Browser] Offline mode OR intercept POST request to fail
4. [Browser] Change maxSizeMB to 50
5. [Browser] Click "Save Settings"
6. [Verify] Assert error toast appears with network/connection message
7. [Verify] Assert form fields retain entered values (not cleared)

**Scenario 6.2: Stale Data Warning**
1. [New Context] Create authenticated ops_admin context
2. [Browser] Navigate to `/ops/settings/uploader`
3. [API] POST `/api/ops/uploader/config` with updated values (simulate another admin changing it)
4. [Browser] Change maxSizeMB
5. [Browser] Click "Save Settings"
6. [Verify] Save succeeds (overwrites with latest)
7. [Optional] Assert warning toast: "Config may have changed since page load"

## Test Data Requirements

### Sample Files
- `test-file-small.pdf` (500 KB)
- `test-file-medium.pdf` (2 MB)
- `test-file-large.pdf` (10 MB)
- `test-image.png` (100 KB)
- `test-image.jpeg` (200 KB)
- `test-doc.docx` (1 MB)

### Test Users (OIDC Claims)
```json
{
  "viewer": {
    "sub": "viewer-test-001",
    "email": "viewer@dth-test.com",
    "first_name": "View",
    "last_name": "Only",
    "roles": ["ops_viewer"]
  },
  "editor": {
    "sub": "editor-test-001",
    "email": "editor@dth-test.com",
    "first_name": "Edit",
    "last_name": "User",
    "roles": ["ops_editor"]
  },
  "admin": {
    "sub": "admin-test-001",
    "email": "admin@dth-test.com",
    "first_name": "Admin",
    "last_name": "User",
    "roles": ["ops_admin"]
  }
}
```

## Success Criteria

- ✅ All RBAC scenarios pass (viewer can view, admin can edit)
- ✅ Config updates persist across page refreshes
- ✅ Validation prevents invalid data (allowlist format, size limits)
- ✅ Audit trail captures ALL config changes with user ID and timestamp
- ✅ File uploads respect config settings (enabled, size limit, allowlist)
- ✅ Error handling provides clear feedback to users
- ✅ Concurrent operations are handled gracefully

## Notes for Test Implementation

1. **Replit Auth Integration**: Use the OIDC test helper that sets next login claims
2. **Database Cleanup**: Each test context should start with a clean state
3. **Async Operations**: Use proper waits for toast messages and API calls
4. **Test IDs**: All interactive elements have data-testid attributes for reliable selection
5. **Screenshots**: Capture on failure for debugging
6. **Audit Trail**: Verify trigger behavior by checking ops_settings_audit table directly
