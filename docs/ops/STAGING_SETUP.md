# Staging Environment Setup Guide

## Overview

This guide walks you through setting up a private staging environment for your testing team at `staging.yourdomain.com`.

## Authentication Options

### Option 1: Basic Auth (Fastest - Recommended for Quick Setup)

The application includes built-in basic auth middleware for staging environments.

**Setup:**
1. Set environment variable:
   ```bash
   STAGING_AUTH_USER=your-username
   STAGING_AUTH_PASS=your-password
   NODE_ENV=staging
   ```

2. The middleware automatically activates when `NODE_ENV=staging`

3. Share credentials with your testing team securely (1Password, Vault, etc.)

**Pros:**
- No infrastructure changes needed
- Works immediately
- Easy to rotate credentials

**Cons:**
- Less sophisticated than SSO
- Credentials must be shared manually

### Option 2: Cloudflare Access (Recommended for Production-like Staging)

**Setup:**
1. Add CNAME record: `staging.yourdomain.com` → Your Replit deployment URL
2. Create Cloudflare Access application:
   - Application URL: `https://staging.yourdomain.com`
   - Policy: Email domains (@yourcompany.com) or specific group
   - Session duration: 24 hours (recommended for testers)

3. Enable "Orange Cloud" proxy in Cloudflare DNS

**Pros:**
- SSO integration (Google, GitHub, Okta)
- Device posture checks
- Audit logs
- No shared credentials

**Cons:**
- Requires Cloudflare account and DNS control
- More complex setup

### Option 3: Ingress Basic Auth (For Kubernetes/NGINX)

If deploying to k8s, use ingress annotations:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: staging-ingress
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth-secret
    nginx.ingress.kubernetes.io/auth-realm: "Staging Environment"
spec:
  rules:
  - host: staging.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dream-team-hub
            port:
              number: 5000
```

Create the secret:
```bash
htpasswd -c auth your-username
kubectl create secret generic basic-auth-secret --from-file=auth
```

## Environment Configuration

### Required Environment Variables

Create a `.env.staging` file with these variables:

```bash
# Environment
NODE_ENV=staging

# Authentication
DTH_API_TOKEN=<generate-new-token-for-staging>
SESSION_SECRET=<generate-new-secret-for-staging>
STAGING_AUTH_USER=<basic-auth-username>
STAGING_AUTH_PASS=<basic-auth-password>

# Database (Use separate staging database!)
DATABASE_URL=postgresql://user:pass@staging-db.example.com:5432/dreamteamhub_staging

# Redis (Optional - for ops logs streaming)
REDIS_URL=redis://staging-redis.example.com:6379

# S3 Storage (Use staging bucket or prefix)
AWS_S3_BUCKET=dreamteamhub-staging
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<staging-key>
AWS_SECRET_ACCESS_KEY=<staging-secret>

# SMTP (Use test email settings)
SMTP_HOST=smtp.mailtrap.io  # Or other test SMTP service
SMTP_PORT=587
SMTP_USER=<test-smtp-user>
SMTP_PASS=<test-smtp-pass>
SMTP_FROM=staging@yourdomain.com

# Health Check Configuration
HEALTHZ_PROBE_TIMEOUT_MS=5000
HEALTHZ_GLOBAL_CAP_MS=2500
HEALTHZ_CACHE_TTL_MS=60000

# Alerts (Route to test channels)
SLACK_WEBHOOK_URL=<staging-slack-webhook>
PAGERDUTY_INTEGRATION_KEY=<staging-pagerduty-key>
```

### Security Best Practices

1. **Separate Resources**: Never point staging to production DB/Redis/S3
2. **Rotate Tokens**: Generate unique `DTH_API_TOKEN` for staging
3. **Test Alerts**: Configure staging alerts to go to test Slack channels
4. **Data Isolation**: Use staging-specific S3 bucket or key prefix
5. **Token Storage**: Store secrets in Replit Secrets or your secrets manager

### DNS and TLS Setup

**For Replit Deployment:**

1. Get your Replit deployment URL (e.g., `your-app.replit.app`)

2. Add CNAME record in your DNS:
   ```
   staging.yourdomain.com  CNAME  your-app.replit.app
   ```

3. TLS is automatically handled by Replit for custom domains

4. If using Cloudflare:
   - Set CNAME as above
   - Enable "Orange Cloud" (proxy through Cloudflare)
   - TLS mode: "Full" or "Full (strict)"

## Deployment Workflow

### 1. Deploy to Staging

**Option A: Manual Deployment**
```bash
# Set environment variables
export NODE_ENV=staging
export DTH_API_TOKEN=<staging-token>
# ... other vars from .env.staging

# Deploy to Replit
git push origin staging
```

**Option B: CI/CD Deployment**

Create `.github/workflows/deploy-staging.yml`:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Replit Staging
        run: |
          # Your deployment script here
          # Could use Replit API or other deployment method
          echo "Deploying to staging..."
```

### 2. Run Smoke Tests

```bash
API_BASE=https://staging.yourdomain.com \
API_KEY=$STAGING_DTH_API_TOKEN \
FAMILY=gpt \
npx tsx attached_assets/repo_patches/smoke.ts
```

**Expected Output:**
```
[timestamp] GET /api/healthz 
[timestamp] healthz { status: 200, ok: true, latencyMs: 45 }
[timestamp] GET /api/healthz/livez 
[timestamp] livez { status: 200 }
[timestamp] POST /api/admin/deploy/mark 
[timestamp] deploy mark ok 
...
✅ Smoke finished without assertion failures.
```

### 3. Verify Dashboards

Open these URLs and verify functionality:

**Ops Overview Dashboard**
- URL: `https://staging.yourdomain.com/ops/overview`
- Check: Live Health card, Last Deploy chip, Err count
- Verify: All inventory, images, affiliates metrics display

**Ops Logs**
- URL: `https://staging.yourdomain.com/ops/logs`
- Check: Log entries appear, filtering works
- Test: Copy summary button

**Ops Logs Stream Plus**
- URL: `https://staging.yourdomain.com/ops/logs-stream-plus`
- Check: SSE connection established
- Test: Filter by level/kind, Copy JSON button
- Verify: localStorage preferences persist

**LLM Linter Presets**
- URL: `https://staging.yourdomain.com/llm/linter/presets`
- Check: Preset list loads (12 presets for gpt/claude/gemini)
- Test: CRUD operations work

**LLM Linter Augment**
- URL: `https://staging.yourdomain.com/llm/linter/augment`
- Check: Can paste prompt and select family
- Test: Augment round-trip (paste → augment → copy)
- Verify: Apply fixes button works

## Testing Checklist

### 4. Trigger Synthetic Error

Test alert system with synthetic error:

```bash
curl -XPOST "https://staging.yourdomain.com/api/ops/logs/emit" \
  -H "x-api-key: $STAGING_DTH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id":"test-'$(date +%s)'",
    "ts":"'$(date -Iseconds)'",
    "level":"error",
    "kind":"probe",
    "owner":"smoke",
    "msg":"synthetic error for staging test"
  }'
```

**Verify:**
- [ ] Error appears in `/ops/logs`
- [ ] Error count increments on `/ops/overview`
- [ ] Err deep-link navigates to filtered error view
- [ ] Slack/PagerDuty test alert fires (if configured)

### 5. Negative Health Check Test

Verify health check failure handling:

```bash
# 1. Note current SMTP_HOST
echo $SMTP_HOST

# 2. Temporarily set bad SMTP host
export SMTP_HOST=invalid-smtp-host.example.com

# 3. Restart application (or wait for health check cache to expire)
# Cache TTL is 60s, so wait 60s or restart

# 4. Check health endpoint
curl https://staging.yourdomain.com/api/healthz
```

**Expected Response (503):**
```json
{
  "ok": false,
  "latencyMs": 45,
  "checks": [
    {"name": "db", "ok": true, "latencyMs": 12},
    {"name": "s3", "ok": true, "latencyMs": 18},
    {"name": "smtp", "ok": false, "latencyMs": 5000, "details": "timeout after 5000ms"}
  ],
  "ts": "2025-11-08T01:00:00.000Z"
}
```

**Verify:**
- [ ] Status code is 503
- [ ] `ok: false` in response
- [ ] SMTP check shows `ok: false` with timeout details
- [ ] DB and S3 checks still pass

```bash
# 5. Revert to correct SMTP_HOST
export SMTP_HOST=smtp.mailtrap.io

# 6. Restart or wait 60s for cache expiry

# 7. Verify health restored
curl https://staging.yourdomain.com/api/healthz
```

**Expected Response (200):**
```json
{
  "ok": true,
  "latencyMs": 38,
  "checks": [
    {"name": "db", "ok": true, "latencyMs": 12},
    {"name": "s3", "ok": true, "latencyMs": 15},
    {"name": "smtp", "ok": true, "latencyMs": 11}
  ],
  "ts": "2025-11-08T01:01:00.000Z"
}
```

## Maintenance

### Weekly Tasks
- [ ] Review staging logs for anomalies
- [ ] Verify smoke tests still passing
- [ ] Check disk usage on staging DB/S3

### Monthly Tasks
- [ ] Rotate `DTH_API_TOKEN` and basic auth credentials
- [ ] Clean up old staging data (DB, S3)
- [ ] Review and update test scenarios
- [ ] Sync staging environment with production config

### Quarterly Tasks
- [ ] Full disaster recovery test (restore from backup)
- [ ] Security audit of staging access
- [ ] Review and update this documentation

## Troubleshooting

### Health Check Always 503
- Check `HEALTHZ_CACHE_TTL_MS` - may need to wait for cache expiry
- Verify DB/S3/SMTP credentials are correct
- Check network connectivity to dependencies
- Review logs: `curl https://staging.yourdomain.com/api/ops/logs/rest?since=15m -H "x-api-key: $TOKEN"`

### Basic Auth Not Working
- Verify `NODE_ENV=staging` is set
- Check `STAGING_AUTH_USER` and `STAGING_AUTH_PASS` env vars
- Ensure middleware is enabled (see server logs)
- Try clearing browser cache/cookies

### Smoke Tests Failing
- Verify `API_BASE` URL is correct
- Check `DTH_API_TOKEN` matches staging token
- Ensure staging deployment is running
- Review smoke test output for specific failures

### SSE Logs Not Streaming
- Check `REDIS_URL` is configured for staging
- Verify Redis is accessible from staging environment
- Falls back to in-memory buffer if Redis unavailable
- Check browser console for connection errors

## Support

For issues with staging environment:
1. Check this documentation first
2. Review application logs in `/ops/logs`
3. Run smoke tests to identify failing components
4. Contact DevOps team with error details

## References

- [Health Probes Documentation](./ops_runbooks.md#1-health-probes)
- [RBAC & Rate Limits](./ops_runbooks.md#5-rbac--rate-limits)
- [Environment Matrix](./env_matrix.md)
- [Security Policy](../../SECURITY.md)
