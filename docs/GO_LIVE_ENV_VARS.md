# Dream Team Hub - Environment Variables Reference

**Last Updated:** 2025-11-06  
**Status:** Pre-Production Checklist  
**Purpose:** Required environment variables and secrets for production deployment

---

## Core Application Secrets

### Database
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (auto-provided by Replit) | `postgresql://user:pass@host:5432/db` |
| `PGHOST` | ✅ Yes | PostgreSQL host (auto-provided) | `aws-0-us-west-1.pooler.supabase.com` |
| `PGPORT` | ✅ Yes | PostgreSQL port (auto-provided) | `5432` |
| `PGUSER` | ✅ Yes | PostgreSQL user (auto-provided) | `postgres.xyz` |
| `PGPASSWORD` | ✅ Yes | PostgreSQL password (auto-provided) | `[secret]` |
| `PGDATABASE` | ✅ Yes | PostgreSQL database name (auto-provided) | `postgres` |

**Action Required:** None - Replit auto-configures PostgreSQL secrets

---

## Authentication & Security

### Session Management
| Variable | Required | Description | How to Generate |
|----------|----------|-------------|-----------------|
| `SESSION_SECRET` | ✅ Yes | Express session signing key (64+ chars) | `openssl rand -base64 48` |

**Action Required:** Generate new secret for production using command above

### Replit Auth (OIDC)
| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `REPL_ID` | ✅ Yes | Replit workspace ID | Auto-provided by Replit |
| `ISSUER_URL` | ✅ Yes | OIDC issuer endpoint | Auto-provided (defaults to `https://replit.com/oidc`) |

**Action Required:** None - auto-configured by Replit

### API Token Authentication
| Variable | Required | Description | Use Case |
|----------|----------|-------------|----------|
| `DTH_API_TOKEN` | ✅ Yes | Bearer token for external API access (CI/CD, integrations) | Used in `Authorization: Bearer <token>` header |

**Action Required:** Generate secure random token (minimum 32 chars):
```bash
openssl rand -base64 32
```

**Security Notes:**
- This token provides full operator scopes
- Used for external integrations and CI/CD pipelines
- Rotate monthly in production
- Store in Replit Secrets (never commit to code)

---

## AI & External Services

### OpenAI (GPT-4)
| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for GPT-4 chat & Copilot | N/A |
| `OPENAI_MODEL` | ⚠️ Optional | Model to use for Copilot | `gpt-4o-mini` |
| `USE_OPENAI` | ⚠️ Optional | Enable/disable OpenAI (set to `1` to enable) | `1` |

**Action Required:**
1. Obtain API key from https://platform.openai.com/api-keys
2. Add to Replit Secrets as `OPENAI_API_KEY`
3. Set `USE_OPENAI=1` to enable AI features

**Cost Monitoring:** Monitor usage at https://platform.openai.com/usage

---

## Google Drive Integration (Knowledge Management)

### Service Account Credentials
| Variable | Required | Description | Format |
|----------|----------|-------------|--------|
| `GDRIVE_SA_EMAIL` | ✅ Yes | Google Service Account email | `dth-sa@project-id.iam.gserviceaccount.com` |
| `GDRIVE_SA_PRIVATE_KEY` | ✅ Yes | Service Account private key (PEM format) | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` |

**Action Required:**
1. Create Service Account in Google Cloud Console
2. Generate JSON key file
3. Extract `client_email` → set as `GDRIVE_SA_EMAIL`
4. Extract `private_key` → set as `GDRIVE_SA_PRIVATE_KEY`
5. **IMPORTANT:** When setting in Replit Secrets, use literal `\n` (backslash-n) for newlines
   - The code automatically converts `\\n` → actual newlines

### Drive Folder Structure (Least Privilege)
The Service Account requires access to **three folder trees** per Business Unit:

```
📁 IMAGINATION/
  📁 read/          ← SA needs: Reader
  📁 draft/         ← SA needs: Writer
  📁 publish/       ← SA needs: Writer

📁 INNOVATION/
  📁 read/          ← SA needs: Reader
  📁 draft/         ← SA needs: Writer
  📁 publish/       ← SA needs: Writer

📁 IMPACT/
  📁 read/          ← SA needs: Reader
  📁 draft/         ← SA needs: Writer
  📁 publish/       ← SA needs: Writer
```

**Scopes Used:**
- OAuth Scope: `https://www.googleapis.com/auth/drive` (full Drive access)
- **Note:** While the code requests full Drive scope, you should limit SA permissions at the **folder level** using Google Drive sharing settings

**Action Required:**
1. Share each folder with Service Account email
2. Grant minimum required permissions:
   - `read/` folders: **Viewer** role
   - `draft/` folders: **Editor** role
   - `publish/` folders: **Editor** role
3. Do NOT grant domain-wide access
4. Do NOT share root Drive folder

---

## Rate Limiting & Throttling

### Copilot Rate Limits
| Variable | Required | Description | Default | Recommended Production |
|----------|----------|-------------|---------|------------------------|
| `COPILOT_REQS_PER_MIN` | ⚠️ Optional | Max Copilot requests per user per minute | `30` | `10` (reduce for production) |

**Action Required:**
- Set `COPILOT_REQS_PER_MIN=10` in production to prevent abuse
- Monitor `/api/ops/metrics/24h` for rate limit violations (429 errors)

### Work Orders Budget Caps
**Configured in database, not environment variables**

Default caps per work order:
- `runsPerDay`: 100
- `usdPerDay`: 5.00

**Retry-After Behavior:**
- When caps exceeded: Returns HTTP 429
- Header: `Retry-After: 86400` (24 hours in seconds)
- Location: `server/api/work_orders.route.ts` lines 84, 106

**Action Required:**
- Review work order caps in database before go-live
- See `docs/RUNBOOK_WORK_ORDERS.md` for cap adjustment procedures

---

## Environment-Specific Configuration

### Staging Environment
| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ Yes | Environment mode | `staging` or `development` or `production` |
| `STAGING_USER` | ⚠️ Optional (staging only) | Basic auth username | `staging` |
| `STAGING_PASSWORD` | ⚠️ Optional (staging only) | Basic auth password | `""` (empty) |
| `ALLOWED_IPS` | ⚠️ Optional (staging only) | IP allowlist (CIDR format) | `""` (empty) |

**Action Required:**
- Set `NODE_ENV=staging` for staging environment
- Set strong `STAGING_PASSWORD` for staging access control
- Configure `ALLOWED_IPS` if IP-based restriction needed (e.g., `203.0.113.0/24,198.51.100.12`)

### Development Overrides
| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | ⚠️ Optional | Server port | `5000` |
| `DTH_API_BASE` | ⚠️ Optional | Base URL for internal API calls | `http://localhost:5000` |

**Action Required:** None - defaults are appropriate for Replit

---

## Pre-Launch Checklist

### ✅ Required Secrets (Production)
- [ ] `DATABASE_URL` (auto-configured)
- [ ] `SESSION_SECRET` (generate new, 64+ chars)
- [ ] `DTH_API_TOKEN` (generate secure token, 32+ chars)
- [ ] `OPENAI_API_KEY` (obtain from OpenAI)
- [ ] `GDRIVE_SA_EMAIL` (create Service Account)
- [ ] `GDRIVE_SA_PRIVATE_KEY` (from Service Account JSON)

### ✅ Configuration Verification
- [ ] Set `NODE_ENV=production`
- [ ] Set `USE_OPENAI=1` to enable AI features
- [ ] Set `COPILOT_REQS_PER_MIN=10` (production rate limit)
- [ ] Verify Google Drive folder permissions (least privilege)
- [ ] Test Service Account access to all 9 folders (3 BUs × 3 trees)
- [ ] Verify `Retry-After` header on 429 responses

### ✅ Security Audit
- [ ] No secrets in code/version control
- [ ] All secrets stored in Replit Secrets
- [ ] Service Account has folder-level permissions only
- [ ] `DTH_API_TOKEN` is rotated and documented
- [ ] Session secret is unique to production

---

## Troubleshooting

### "Missing GDRIVE_SA_EMAIL or GDRIVE_SA_PRIVATE_KEY"
**Cause:** Google Drive secrets not configured  
**Fix:** Add both secrets to Replit Secrets panel

### "JWT token missing or invalid"
**Cause:** Private key format issue  
**Fix:** Ensure `\n` is literal in Replit Secrets (code handles conversion)

### 429 Rate Limit Errors
**Cause:** User exceeded Copilot requests or work order caps  
**Fix:**
- Check `COPILOT_REQS_PER_MIN` value
- Review work order caps in database
- Check `/api/ops/metrics/24h` for rate limit events

### Drive API Forbidden (403)
**Cause:** Service Account lacks folder permissions  
**Fix:** Share folders with SA email and grant appropriate roles

---

## Support Contacts

- **Replit Database Issues:** https://replit.com/support
- **OpenAI API Issues:** https://help.openai.com
- **Google Drive Issues:** Google Cloud Console → IAM & Admin → Service Accounts
- **Application Issues:** See `docs/RUNBOOK_PUBLISH_INCIDENT.md` and `docs/RUNBOOK_WORK_ORDERS.md`
