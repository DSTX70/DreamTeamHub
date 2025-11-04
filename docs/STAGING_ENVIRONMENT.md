# Staging Environment Setup

This document describes the staging environment infrastructure for Dream Team Hub, including automated weekly refreshes with data masking and access control.

## Overview

The staging environment features:
- **Automated Weekly Refresh**: GitHub Actions workflow refreshes staging database every Monday at 07:00 UTC
- **Data Masking**: Uses Greenmask to mask PII (personally identifiable information)
- **Access Control**: Basic auth or IP allowlist protection
- **Referential Integrity Validation**: Automated testing to ensure data consistency

## Components

### 1. GitHub Actions Workflow

**File**: `.github/workflows/staging_refresh.yml`

**Triggers**:
- Weekly schedule: Mondays at 07:00 UTC
- Manual dispatch via GitHub Actions UI

**Process**:
1. Dump production database using `pg_dump`
2. Mask sensitive data with Greenmask
3. Restore masked data to staging database
4. Validate referential integrity with SQL tests

**Required GitHub Secrets**:
- `PROD_DB_URL` - Production database connection string
- `STAGING_DB_URL` - Staging database connection string

**Setup Instructions**:
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add both secrets with your database connection strings
3. Format: `postgres://user:password@host:port/database`

### 2. Staging Guard Middleware

**File**: `server/middleware/stagingGuard.ts`

**Features**:
- Only activates when `NODE_ENV=staging`
- Supports dual authentication:
  - **Basic Auth**: Username/password prompt
  - **IP Allowlist**: CIDR notation support (e.g., `203.0.113.0/24`)
- Health check bypass: `/healthz` remains accessible
- Assets bypass: `/assets/*` remains accessible

**Environment Variables**:
```bash
NODE_ENV=staging                    # Enables the guard
STAGING_USER=staging                # Basic auth username
STAGING_PASSWORD=your_password      # Basic auth password
ALLOWED_IPS=127.0.0.1,::1          # Optional: Comma-separated IPs/CIDRs
```

**Integration**:
The middleware is already integrated into `server/index.ts` and will activate automatically when `NODE_ENV=staging`.

### 3. Configuration Files

**`.env.staging.sample`** - Sample environment variables for staging
```bash
NODE_ENV=staging
STAGING_USER=staging
STAGING_PASSWORD=change_me
ALLOWED_IPS=127.0.0.1,::1
PROD_DB_URL=postgres://user:pass@prod-host:5432/prod
STAGING_DB_URL=postgres://user:pass@staging-host:5432/staging
```

## Testing the Staging Guard

See `docs/STAGING_TESTING.md` for detailed testing instructions.

### Quick Test

1. Set environment variables:
```bash
export NODE_ENV=staging
export STAGING_USER=staging
export STAGING_PASSWORD=testpass
```

2. Start the server:
```bash
npm run dev
```

3. Test unauthenticated access (should return 401):
```bash
curl -i http://localhost:5000/
```

4. Test with basic auth (should return 200):
```bash
curl -i -u staging:testpass http://localhost:5000/
```

5. Test health check bypass (should return 200 without auth):
```bash
curl -i http://localhost:5000/healthz
```

## Greenmask Configuration

The workflow expects the following files in your repository:
- `db/greenmask.yml` - Greenmask configuration for data masking rules
- `db/sql/ri_invariants.sql` - Referential integrity validation tests

These files define which columns to mask and how to validate the masked data maintains referential integrity.

## Manual Refresh

To manually trigger a staging refresh:

1. Go to your GitHub repository
2. Navigate to Actions → Staging Refresh (Greenmask)
3. Click "Run workflow"
4. Select the branch (usually `main`)
5. Click "Run workflow"

The workflow will execute and you can monitor progress in the Actions tab.

## Security Considerations

1. **Never commit real credentials** - Use `.env.staging.sample` as a template only
2. **Use strong passwords** - For STAGING_PASSWORD in production staging environments
3. **Restrict IP access** - Use ALLOWED_IPS for known office/VPN IPs
4. **GitHub Secrets** - Store all sensitive database URLs in GitHub Secrets
5. **Regular rotation** - Change staging passwords periodically

## Architecture

```
┌─────────────────┐
│  Production DB  │
└────────┬────────┘
         │ pg_dump
         ▼
┌─────────────────┐
│  prod.dump      │
└────────┬────────┘
         │ greenmask transform
         ▼
┌─────────────────┐
│  staging.dump   │ (PII masked)
└────────┬────────┘
         │ pg_restore
         ▼
┌─────────────────┐
│   Staging DB    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ RI Validation   │
└─────────────────┘
```

## Troubleshooting

### Workflow Fails at pg_dump
- Check `PROD_DB_URL` secret is correctly formatted
- Verify network access from GitHub Actions to production database
- Ensure production database allows external connections

### Workflow Fails at greenmask
- Verify `db/greenmask.yml` exists and is valid
- Check that column names in greenmask.yml match actual database schema

### Workflow Fails at pg_restore
- Check `STAGING_DB_URL` secret is correctly formatted
- Ensure staging database exists and is accessible
- Verify staging database user has sufficient permissions

### Staging Guard Not Working
- Confirm `NODE_ENV=staging` is set
- Check that `STAGING_USER` and `STAGING_PASSWORD` are set
- Verify the middleware is imported and used in `server/index.ts`

## Next Steps

To create a pull request with these changes:

1. Create a new branch:
```bash
git checkout -b chore/staging-refresh-and-guard
```

2. Commit the changes:
```bash
git add .github/workflows/staging_refresh.yml
git add server/middleware/stagingGuard.ts
git add .env.staging.sample
git add docs/STAGING_*.md
git add server/index.ts
git commit -m "feat: add staging environment with weekly refresh and access control"
```

3. Push and create PR:
```bash
git push origin chore/staging-refresh-and-guard
```

4. Add GitHub Secrets before merging (see "Required GitHub Secrets" above)

5. Test the workflow manually after merging using "Run workflow"
