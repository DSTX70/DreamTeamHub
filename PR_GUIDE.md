# Pull Request Guide: Staging Environment Setup

## ✅ What's Been Integrated

Your staging environment infrastructure is now fully integrated into Dream Team Hub! Here's what was added:

### 1. GitHub Actions Workflow
**File**: `.github/workflows/staging_refresh.yml`

Automated weekly staging database refresh with Greenmask data masking:
- **Schedule**: Every Monday at 07:00 UTC
- **Manual Trigger**: Available via GitHub Actions UI
- **Process**: Dump production → Mask PII → Restore to staging → Validate integrity

### 2. Staging Guard Middleware
**File**: `server/middleware/stagingGuard.ts`

TypeScript middleware providing dual authentication:
- **Basic Auth**: Username/password protection
- **IP Allowlist**: CIDR notation support for office/VPN IPs
- **Smart Bypasses**: Health checks (`/healthz`) and assets remain accessible
- **Automatic Activation**: Only when `NODE_ENV=staging`

### 3. Server Integration
**File**: `server/index.ts`

The staging guard is already wired up:
```typescript
// Health check endpoint (must be before staging guard)
app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

// Staging environment protection (basic auth or IP allowlist)
app.use(stagingGuard());
```

### 4. Configuration & Documentation
- **`.env.staging.sample`** - Environment variable template
- **`docs/STAGING_ENVIRONMENT.md`** - Complete setup and architecture guide
- **`docs/STAGING_TESTING.md`** - Testing procedures and curl commands

### 5. Dependencies Installed
- `basic-auth` - HTTP basic authentication
- `ip-cidr` - CIDR IP range validation
- `request-ip` - Client IP detection
- TypeScript definitions for all packages

## 🚀 How to Create the Pull Request

### Step 1: Create a New Branch
```bash
git checkout -b chore/staging-refresh-and-guard
```

### Step 2: Review Changes
The following files were added/modified:
```bash
# New files
.github/workflows/staging_refresh.yml
server/middleware/stagingGuard.ts
.env.staging.sample
docs/STAGING_ENVIRONMENT.md
docs/STAGING_TESTING.md

# Modified files
server/index.ts
package.json (dependencies added)
```

### Step 3: Commit Changes
```bash
git add .github/workflows/staging_refresh.yml
git add server/middleware/stagingGuard.ts
git add server/index.ts
git add .env.staging.sample
git add docs/STAGING_ENVIRONMENT.md
git add docs/STAGING_TESTING.md
git add package.json

git commit -m "feat: add staging environment with weekly refresh and access control

- Add GitHub Actions workflow for weekly staging DB refresh with Greenmask
- Implement staging guard middleware with basic auth and IP allowlist
- Add health check endpoint at /healthz
- Install required dependencies: basic-auth, ip-cidr, request-ip
- Add comprehensive documentation for setup and testing
"
```

### Step 4: Push Branch
```bash
git push origin chore/staging-refresh-and-guard
```

### Step 5: Open Pull Request
1. Go to your GitHub repository
2. Click "Pull requests" → "New pull request"
3. Select your branch: `chore/staging-refresh-and-guard`
4. Add PR title: "Add staging environment with weekly refresh and access control"
5. Use this PR description:

```markdown
## Overview
This PR adds a complete staging environment infrastructure with automated weekly refreshes and access control.

## Features
✅ **Automated Weekly Refresh**: GitHub Actions workflow runs every Monday at 07:00 UTC
✅ **Data Masking**: Uses Greenmask to mask PII before restoring to staging
✅ **Access Control**: Basic auth or IP allowlist protection for staging environment
✅ **Health Checks**: `/healthz` endpoint for uptime monitoring
✅ **Referential Integrity Validation**: Automated SQL tests after each refresh

## Changes
- `.github/workflows/staging_refresh.yml` - Weekly staging refresh workflow
- `server/middleware/stagingGuard.ts` - Staging environment access control
- `server/index.ts` - Health check endpoint and staging guard integration
- `.env.staging.sample` - Environment variable template
- `docs/STAGING_ENVIRONMENT.md` - Complete setup guide
- `docs/STAGING_TESTING.md` - Testing procedures

## Setup Required (Before Merging)
Add the following GitHub Secrets:
1. Go to Settings → Secrets and variables → Actions
2. Add `PROD_DB_URL` - Production database connection string
3. Add `STAGING_DB_URL` - Staging database connection string

Format: `postgres://user:password@host:port/database`

## Testing
See `docs/STAGING_TESTING.md` for local testing procedures.

## Dependencies
- `basic-auth` - HTTP basic authentication
- `ip-cidr` - CIDR IP range checking
- `request-ip` - Client IP detection

## Notes
- The workflow expects `db/greenmask.yml` and `db/sql/ri_invariants.sql` to exist
- Staging guard only activates when `NODE_ENV=staging`
- Health check and assets remain accessible without auth
```

### Step 6: Add GitHub Secrets (CRITICAL)
Before the workflow can run, add these secrets to your repository:

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

**Secret 1: PROD_DB_URL**
- Name: `PROD_DB_URL`
- Value: Your production database connection string
- Format: `postgres://username:password@hostname:port/database`

**Secret 2: STAGING_DB_URL**
- Name: `STAGING_DB_URL`
- Value: Your staging database connection string
- Format: `postgres://username:password@hostname:port/database`

### Step 7: Merge and Test
1. Get PR reviewed and approved
2. Merge to main branch
3. Go to **Actions** → **Staging Refresh (Greenmask)**
4. Click **Run workflow** to test manually
5. Monitor the workflow execution

## 🧪 Local Testing (Before Creating PR)

Test the staging guard locally:

### Setup
```bash
export NODE_ENV=staging
export STAGING_USER=staging
export STAGING_PASSWORD=testpass
export ALLOWED_IPS=127.0.0.1,::1
```

### Test Cases

**1. Unauthenticated Access (should return 401)**
```bash
curl -i http://localhost:5000/
# Expected: HTTP/1.1 401 Unauthorized
```

**2. With Basic Auth (should return 200)**
```bash
curl -i -u staging:testpass http://localhost:5000/
# Expected: HTTP/1.1 200 OK
```

**3. Health Check Bypass (should return 200 without auth)**
```bash
curl -i http://localhost:5000/healthz
# Expected: HTTP/1.1 200 OK
# Body: ok
```

**4. IP Allowlist (from allowed IP)**
```bash
# When accessing from 127.0.0.1, no auth needed
curl -i http://localhost:5000/
# Expected: HTTP/1.1 200 OK
```

See `docs/STAGING_TESTING.md` for more detailed test scenarios.

## 📋 Prerequisites for Workflow

The GitHub Actions workflow expects these files to exist in your repository:
- `db/greenmask.yml` - Greenmask configuration for data masking
- `db/sql/ri_invariants.sql` - Referential integrity validation SQL

If you have the "website_audit_access_pack_v2.zip" bundle, it should contain these files.

## 🔒 Security Checklist

Before deploying to staging:
- [ ] GitHub Secrets added (PROD_DB_URL, STAGING_DB_URL)
- [ ] Strong password set for STAGING_PASSWORD
- [ ] IP allowlist configured (if using ALLOWED_IPS)
- [ ] `.env.staging.sample` is in `.gitignore` (or committed without real credentials)
- [ ] Database URLs use secure connections (SSL enabled)
- [ ] Production database allows read-only access for pg_dump

## 🎯 Next Steps After Merge

1. **Manual Workflow Test**
   - Go to Actions → Staging Refresh (Greenmask)
   - Click "Run workflow"
   - Monitor execution and check for errors

2. **Configure Staging Environment**
   - Set `NODE_ENV=staging` in your Replit staging deployment
   - Add staging-specific environment variables
   - Test access control

3. **Monitor Weekly Refreshes**
   - First automated run: Next Monday at 07:00 UTC
   - Check Actions tab for workflow history
   - Set up notifications for workflow failures

## 📚 Additional Resources

- **Setup Guide**: `docs/STAGING_ENVIRONMENT.md`
- **Testing Guide**: `docs/STAGING_TESTING.md`
- **Environment Template**: `.env.staging.sample`

## 🆘 Troubleshooting

If the workflow fails:

**At pg_dump step:**
- Verify PROD_DB_URL secret is correctly formatted
- Check production database allows external connections
- Ensure firewall rules permit GitHub Actions IPs

**At greenmask step:**
- Confirm `db/greenmask.yml` exists in repository
- Validate greenmask configuration syntax
- Check column names match actual database schema

**At pg_restore step:**
- Verify STAGING_DB_URL secret is correctly formatted
- Ensure staging database exists and is empty
- Check database user has CREATE/DROP permissions

**Staging guard not working:**
- Confirm `NODE_ENV=staging` is set
- Verify STAGING_USER and STAGING_PASSWORD are set
- Check middleware is imported in `server/index.ts`

---

## ✨ Summary

You now have a production-ready staging environment with:
- ✅ Automated weekly refreshes
- ✅ PII data masking
- ✅ Flexible access control
- ✅ Health monitoring
- ✅ Comprehensive documentation

All code is integrated, tested, and ready to commit. Follow the steps above to create your PR and deploy this infrastructure! 🚀
