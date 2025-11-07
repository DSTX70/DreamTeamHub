# CI/CD & Environment Health Setup

## Overview

This document describes the GitHub Actions CI/CD pipeline and environment health monitoring system for Dream Team Hub.

## Components Deployed

### 1. GitHub Actions Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

**Pipeline Steps:**
1. **Checkout**: Clone the repository
2. **Setup pnpm**: Install pnpm package manager (v8)
3. **Setup Node.js**: Install Node 20 with pnpm cache
4. **Install dependencies**: Run `pnpm install --frozen-lockfile`
5. **Type check**: Run `pnpm run typecheck` or `npx tsc --noEmit`
6. **Run tests**: Execute test suite with `pnpm test` or `npm test`
7. **Environment health check**: Validate required environment variables

**Forked PR Support:**
- The env health check step is conditionally skipped on forked PRs
- Condition: `if: github.event_name == 'push' || !github.event.pull_request.head.repo.fork`
- This prevents failures when GitHub withholds secrets from forked PRs

### 2. Environment Check Script (`scripts/check-env.ts`)

**Purpose:** Validates that all required environment variables are set before deployment.

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_S3_BUCKET` - S3 bucket name for image storage
- `OPS_API_TOKEN` - API token for ops authentication

**Optional Variables:**
- `AWS_REGION` - AWS region (defaults to `us-east-1` if not set)

**Features:**
- Masks sensitive values in output (shows first 4 and last 4 characters)
- CI-aware: Detects when running in CI with no secrets and gracefully exits
- Exit codes: 1 on failure, 0 on success
- Color-coded output: ✅ (required present), ❌ (required missing), ⚠️ (optional missing)

**Usage:**
```bash
# Run locally
npx tsx scripts/check-env.ts

# Run in CI (automatically handles missing secrets on forked PRs)
npx tsx scripts/check-env.ts
```

### 3. Ops Overview Route Update (`server/routes/ops.overview.route.ts`)

**New API Response Field:**
```typescript
{
  env: {
    databaseUrl: boolean,  // true if DATABASE_URL is set
    s3Bucket: boolean,     // true if AWS_S3_BUCKET is set
    opsToken: boolean,     // true if OPS_API_TOKEN is set
    awsRegion: boolean     // true if AWS_REGION is set
  }
}
```

**Endpoint:** `GET /api/ops/overview`

### 4. Ops Overview UI Update (`client/src/pages/ops/OpsOverview.tsx`)

**New Section: Environment Health**

Displays real-time status of critical environment variables with:
- Shield icon header
- Grid layout (responsive: 1 column mobile → 4 columns desktop)
- Badge indicators:
  - **Green "OK"** badge: Variable is set
  - **Red "Missing"** badge: Variable is not set
- Test IDs for automated testing: `data-testid="env-database-url"`, etc.

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ 🛡️ Environment Health                       │
├─────────────────────────────────────────────┤
│ Database URL    [ OK ]                      │
│ S3 Bucket       [ Missing ]                 │
│ Ops API Token   [ Missing ]                 │
│ AWS Region      [ OK ]                      │
└─────────────────────────────────────────────┘
```

### 5. Test Suite (`tests/env_health.test.ts`)

**Test Cases:**
1. **Missing required vars**: Script exits with code 1
2. **All required vars present**: Script exits with code 0
3. **Missing optional vars**: Script passes with warning

**Coverage:** Validates script behavior in different scenarios

## Setup Instructions

### For GitHub Repository

1. **Add Repository Secrets:**
   Navigate to: `Settings → Secrets and variables → Actions → New repository secret`

   Add the following secrets:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `AWS_S3_BUCKET` - Your S3 bucket name
   - `OPS_API_TOKEN` - Your ops API token
   - `AWS_REGION` - (Optional) Your AWS region (defaults to us-east-1)

2. **Enable GitHub Actions:**
   - Go to `Settings → Actions → General`
   - Ensure "Allow all actions and reusable workflows" is selected
   - Save settings

3. **Test the Workflow:**
   - Push a commit to `main` or `develop`
   - Or create a pull request
   - Check the "Actions" tab to see the workflow run

### For Local Development

1. **Set Environment Variables:**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
   export AWS_S3_BUCKET="your-bucket-name"
   export OPS_API_TOKEN="your-api-token"
   export AWS_REGION="us-east-1"  # Optional
   ```

2. **Run Health Check:**
   ```bash
   npx tsx scripts/check-env.ts
   ```

3. **View Dashboard:**
   - Navigate to `/ops/overview`
   - Check the "Environment Health" section at the bottom

## Security Considerations

### What's Safe

✅ **Showing boolean status** (OK/Missing) - Does not expose actual values
✅ **Masking in logs** - Script masks sensitive values in console output
✅ **Skipping on forks** - Prevents secret exposure on forked PRs

### What's Not Included

❌ **Actual values** - Never displayed in UI or logs
❌ **Partial values** - Only masked format in script output
❌ **Secret rotation** - Handled separately in GitHub/Replit settings

## Troubleshooting

### CI Failing on Forked PRs

**Symptom:** Environment health check fails on PRs from forks

**Solution:** Already handled! The workflow conditionally skips the env check on forked PRs.

### Local Script Fails

**Symptom:** Script exits with code 1 locally

**Solution:** 
1. Check which variables are missing (red ❌ in output)
2. Set missing variables in your environment
3. Re-run the script

### Dashboard Shows "Missing"

**Symptom:** Ops Overview shows red "Missing" badges

**Solution:**
1. Verify environment variables are set in your deployment
2. Restart the application after setting variables
3. Refresh the dashboard

## Integration Points

### With Existing Systems

- **Ops Overview Dashboard**: Displays env health alongside other system metrics
- **GitHub Actions**: Runs on every push and PR
- **Test Suite**: Automated validation of script behavior
- **Documentation**: Updated in `replit.md` and `USER_MANUAL.md`

### Future Enhancements

Potential improvements:
- Add email alerts when env vars are missing in production
- Track env health history over time
- Add validation for env var formats (e.g., valid URL, valid region)
- Integrate with monitoring services (Datadog, New Relic)

## Files Modified/Created

### Created
- `.github/workflows/ci.yml` - GitHub Actions workflow
- `scripts/check-env.ts` - Environment validation script
- `tests/env_health.test.ts` - Test suite
- `CI_ENV_HEALTH_SETUP.md` - This documentation

### Modified
- `server/routes/ops.overview.route.ts` - Added env health to API response
- `client/src/pages/ops/OpsOverview.tsx` - Added Environment Health UI
- `replit.md` - Updated system documentation
- `USER_MANUAL.md` - (To be updated with user-facing instructions)

## Testing the Implementation

### Manual Testing

1. **Test Env Check Script:**
   ```bash
   # With missing vars (should fail)
   env -i PATH=$PATH npx tsx scripts/check-env.ts
   
   # With all vars (should pass)
   DATABASE_URL=test AWS_S3_BUCKET=test OPS_API_TOKEN=test npx tsx scripts/check-env.ts
   ```

2. **Test Dashboard:**
   - Navigate to `/ops/overview`
   - Verify "Environment Health" section appears
   - Check badge colors match actual env var status

3. **Test CI Workflow:**
   - Create a test branch
   - Push a commit
   - Check GitHub Actions tab for workflow run
   - Verify all steps pass

### Automated Testing

```bash
# Run test suite
npm test tests/env_health.test.ts
```

## Support

For issues or questions:
1. Check this documentation first
2. Review the script output for specific error messages
3. Verify environment variables are correctly set
4. Check GitHub Actions logs for CI failures

---

**Last Updated:** November 2025  
**Version:** 1.0.0
