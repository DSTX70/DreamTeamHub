# Environment Variables Setup Guide

This guide provides step-by-step instructions for configuring the required environment variables in Dream Team Hub.

## 📋 Required Environment Variables

### 1. **Google Drive Service Account** (for Knowledge Management)

Dream Team Hub uses a Google Cloud Service Account to access Google Drive for the Knowledge/Publishing system.

#### Setup Steps:

1. **Create a Google Cloud Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name it (e.g., `dth-knowledge-sa`)
   - Grant it **"Service Account User"** role
   - Click **Done**

2. **Generate and Download Private Key:**
   - Click on the created service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Choose **JSON** format
   - Download the file (keep it secure!)

3. **Extract Values from JSON:**
   
   The downloaded JSON file contains:
   ```json
   {
     "client_email": "dth-knowledge-sa@your-project.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...YOUR_KEY_HERE...\n-----END PRIVATE KEY-----\n"
   }
   ```

4. **Share Google Drive Folders with Service Account:**
   - In Google Drive, right-click the folder you want to access
   - Click **Share**
   - Add the `client_email` from the JSON file
   - Grant **Editor** or **Viewer** permissions

#### Add to Replit Secrets:

In your Replit project:

1. Click **Tools** → **Secrets**
2. Add these two secrets:

```
GDRIVE_SA_EMAIL=dth-knowledge-sa@your-project.iam.gserviceaccount.com
```

```
GDRIVE_SA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...PASTE_FULL_KEY_HERE...\n-----END PRIVATE KEY-----\n
```

**⚠️ Important Notes:**
- Keep the `\n` newline characters in the private key
- The private key should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`
- Make sure to include the trailing newline after `-----END PRIVATE KEY-----`

---

### 2. **Database Configuration** (PostgreSQL)

These are automatically configured by Replit when you create a PostgreSQL database.

**Pre-configured Secrets:**
```
DATABASE_URL       # Full PostgreSQL connection string
PGHOST            # Database host
PGPORT            # Database port (usually 5432)
PGUSER            # Database user
PGPASSWORD        # Database password
PGDATABASE        # Database name
```

**✅ No Action Required** - These are set automatically by Replit.

---

### 3. **Authentication & Security**

#### DTH_API_TOKEN (for CI/CD and External Integrations)

Generate a secure random token for API access:

```bash
# Generate a secure 32-character token
openssl rand -base64 32
```

Add to Replit Secrets:
```
DTH_API_TOKEN=<your-generated-token-here>
```

**Used by:**
- GitHub Actions workflows (Agent Lab CI/CD)
- External integrations
- ChatGPT custom actions

---

#### SESSION_SECRET (for Express Sessions)

Generate a secure session secret:

```bash
# Generate a secure session secret
openssl rand -base64 32
```

Add to Replit Secrets:
```
SESSION_SECRET=<your-generated-secret-here>
```

**Used by:**
- Express session management
- Replit Auth integration

---

#### OPENAI_API_KEY (for AI Features)

Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

Add to Replit Secrets:
```
OPENAI_API_KEY=sk-proj-...your-key-here...
```

**Used by:**
- Dream Team Chat (32 AI personas)
- DTH Copilot assistant
- Brainstorm Studio

---

### 4. **Staging Environment** (Optional)

If using staging environment protection:

```
ALLOWED_IPS=192.168.1.0/24,10.0.0.1
```

**Format:** Comma-separated list of IP addresses or CIDR ranges

---

## 🔍 Verification Checklist

After setting up environment variables, verify they're configured correctly:

### Check Secrets in Replit:

1. Open **Tools** → **Secrets**
2. Verify all required secrets are present:

```
✅ GDRIVE_SA_EMAIL
✅ GDRIVE_SA_PRIVATE_KEY
✅ DATABASE_URL
✅ DTH_API_TOKEN
✅ SESSION_SECRET
✅ OPENAI_API_KEY
```

### Test Each Integration:

#### **Google Drive:**
```bash
# Search for files (should return results or empty array)
curl -X GET "http://localhost:5000/api/knowledge/BU/<bu-id>/search?q=test" \
  -H "Cookie: <your-session-cookie>"
```

Expected: HTTP 200 with array of files

#### **API Token Authentication:**
```bash
# Test API token auth
curl -X GET "http://localhost:5000/api/roles" \
  -H "Authorization: Bearer $DTH_API_TOKEN"
```

Expected: HTTP 200 with role cards array

#### **Database:**
```bash
# Test database connection
curl -X GET "http://localhost:5000/api/pods" \
  -H "Cookie: <your-session-cookie>"
```

Expected: HTTP 200 with pods array

#### **OpenAI:**
```bash
# Test AI chat
curl -X POST "http://localhost:5000/api/chat" \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"persona":"Support","message":"Hello"}'
```

Expected: HTTP 200 with AI response

---

## 🐛 Troubleshooting

### Google Drive Issues:

**Error: "Service account not found"**
- Verify `GDRIVE_SA_EMAIL` matches the `client_email` from JSON
- Check for typos or extra spaces

**Error: "Permission denied"**
- Make sure the service account email is shared on the Drive folder
- Grant **Editor** permissions (not just Viewer)

**Error: "Invalid key format"**
- Ensure the private key includes `\n` newline characters
- Copy the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### Database Issues:

**Error: "DATABASE_URL not found"**
- Create a PostgreSQL database in Replit (**Tools** → **Database**)
- Restart the workflow after database creation

### Authentication Issues:

**Error: "Invalid API token"**
- Verify `DTH_API_TOKEN` is set correctly
- Check for extra spaces or newlines in the secret value

**Error: "Session secret not configured"**
- Set `SESSION_SECRET` in Replit Secrets
- Restart the workflow

---

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
   - Use Replit Secrets exclusively
   - Add `.env` to `.gitignore`

2. **Rotate tokens regularly**
   - Change `DTH_API_TOKEN` quarterly
   - Update `SESSION_SECRET` annually

3. **Use least-privilege access**
   - Grant minimal Google Drive permissions
   - Use read-only access where possible

4. **Monitor usage**
   - Check Google Cloud Console for service account activity
   - Review OpenAI API usage dashboard

---

## 📚 Related Documentation

- [API Endpoints Guide](./API_ENDPOINTS_GUIDE.md)
- [Google Drive Integration](../server/integrations/googleDrive_real.ts)
- [Security & Scopes](../server/security/scopes_and_csp.ts)
- [OpenAPI Specification](./API_SPEC_v0.1.1.yaml)

---

## 💡 Quick Reference

| Secret | Purpose | Example Value |
|--------|---------|---------------|
| `GDRIVE_SA_EMAIL` | Service account email | `dth-sa@project.iam.gserviceaccount.com` |
| `GDRIVE_SA_PRIVATE_KEY` | Service account key | `-----BEGIN PRIVATE KEY-----\n...` |
| `DTH_API_TOKEN` | API authentication | `abc123xyz...` (32+ chars) |
| `SESSION_SECRET` | Session encryption | `def456uvw...` (32+ chars) |
| `OPENAI_API_KEY` | OpenAI API access | `sk-proj-...` |
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@host/db` |
| `ALLOWED_IPS` | Staging IP allowlist | `192.168.1.0/24,10.0.0.1` |

---

**Need Help?** Check the troubleshooting section above or review the [API Documentation](./API_ENDPOINTS_GUIDE.md).
