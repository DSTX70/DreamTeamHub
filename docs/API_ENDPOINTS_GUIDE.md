# Dream Team Hub API Endpoints Guide

## 🌐 Base URL

```
https://workspace.DustinSparks1.repl.co
```

## 🔐 Authentication

Dream Team Hub supports **dual authentication** for maximum flexibility:

### 1. Session Authentication (Interactive Users)
- Login via Replit Auth at `/login`
- Session cookie automatically included in subsequent requests
- Used by the web application

### 2. API Token Authentication (External Integrations)
- **Header Format**: `Authorization: Bearer YOUR_DTH_API_TOKEN`
- Used by CI/CD, ChatGPT agents, external systems
- Token stored in Replit Secrets as `DTH_API_TOKEN`

## 📋 Available Endpoints

### Health Check
**No authentication required**

```http
GET /healthz
```

**Response:**
```
ok
```

---

### Role Cards

#### List All Roles
**Dual Authentication Supported**

```http
GET /api/roles?limit=50&offset=0
Authorization: Bearer YOUR_DTH_API_TOKEN
```

**Query Parameters:**
- `limit` (optional): Number of results (1-200, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response Headers:**
- `X-Total-Count`: Total number of roles

**Response Body:**
```json
[
  {
    "id": 1,
    "name": "Product Owner",
    "handle": "product_owner",
    "pod": "Product",
    "category": "Leadership",
    "display_name": "Sage",
    "autonomy_level": "Advisory",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Get Role by Handle
**Dual Authentication Supported**

```http
GET /api/roles/by-handle/{handle}
Authorization: Bearer YOUR_DTH_API_TOKEN
```

**Path Parameters:**
- `handle` (required): Unique identifier for the role (e.g., "product_owner")

**Response:** Single role object (same structure as list)

#### Create Role
**Dual Authentication Supported**

```http
POST /api/roles
Authorization: Bearer YOUR_DTH_API_TOKEN
Content-Type: application/json

{
  "name": "Product Owner",
  "handle": "product_owner",
  "pod": "Product",
  "category": "Leadership"
}
```

**Response:** Created role object with HTTP 201

#### Update Role by Handle
**Dual Authentication Supported**

```http
PUT /api/roles/by-handle/{handle}
Authorization: Bearer YOUR_DTH_API_TOKEN
Content-Type: application/json

{
  "name": "Product Owner",
  "handle": "product_owner",
  "pod": "Product",
  "category": "Leadership",
  "display_name": "Sage"
}
```

**Response:** Updated role object

---

### Agent Summaries (Academy Dashboard)

#### List Agent Summaries
**✨ NEW - Dual Authentication Supported**

```http
GET /api/agents/summary?limit=50&offset=0&bu=Support&level=L1&status=pilot&q=router
Authorization: Bearer YOUR_DTH_API_TOKEN
```

**Query Parameters:**
- `limit` (optional): Number of results (1-200, default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `bu` (optional): Filter by Business Unit (e.g., "Support", "Marketing")
- `level` (optional): Filter by autonomy level (L0, L1, L2, L3)
- `status` (optional): Filter by status (pilot, live, watch, rollback)
- `q` (optional): Text search on agent name/display name

**Response Headers:**
- `X-Total-Count`: Total number of matching agents

**Response Body:**
```json
[
  {
    "name": "agent_router",
    "display_name": "Router",
    "autonomy_level": "L1",
    "status": "pilot",
    "next_gate": 2,
    "promotion_progress_pct": 60,
    "business_unit": "Support",
    "kpis": {
      "task_success": 0.84,
      "latency_p95_s": 4.2,
      "cost_per_task_usd": 0.035
    },
    "links": {
      "pr": "https://github.com/example/dream-team/pull/123",
      "promotion_request": "/Agent-Lab/40_Playbooks/promotion_request_template.md",
      "evidence_pack": "/Agent-Lab/30_EvidencePacks/exp_2025-11-03_agent_router/"
    }
  }
]
```

**Field Descriptions:**
- `name`: Agent handle/identifier
- `display_name`: Human-readable agent name
- `autonomy_level`: L0 (Advisory), L1 (Collaborative), L2 (Autonomous), L3 (Strategic)
- `status`: Current operational status
- `next_gate`: Next promotion gate (null for L3 agents)
- `promotion_progress_pct`: Progress toward next gate (0-100)
- `business_unit`: Organizational unit (derived from pod)
- `kpis`: Key performance indicators
  - `task_success`: Task completion rate (0.0-1.0)
  - `latency_p95_s`: 95th percentile latency in seconds
  - `cost_per_task_usd`: Average cost per task in USD
- `links`: Related resources
  - `pr`: Pull request URL
  - `promotion_request`: Promotion request template path
  - `evidence_pack`: Evidence pack directory path

---

## 🧪 Testing the API

### Using cURL

**Test health check (no auth):**
```bash
curl https://workspace.DustinSparks1.repl.co/healthz
```

**List roles (with API token):**
```bash
curl -H "Authorization: Bearer YOUR_DTH_API_TOKEN" \
     https://workspace.DustinSparks1.repl.co/api/roles
```

**Get agent summaries with filters:**
```bash
curl -H "Authorization: Bearer YOUR_DTH_API_TOKEN" \
     "https://workspace.DustinSparks1.repl.co/api/agents/summary?limit=10&level=L1&status=pilot"
```

### Using Postman

Import the collection from `docs/POSTMAN_COLLECTION.json`:

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `POSTMAN_COLLECTION.json`
4. Set the `DTH_API_TOKEN` variable with your token
5. Run requests

---

## 🤖 ChatGPT Agent Integration

### For Custom GPTs

1. Go to your GPT's **Configure** page
2. Under **Actions**, click **Create new action**
3. Import the schema from `docs/GPT_ACTIONS_SCHEMA.yaml`
4. Set **Authentication** to:
   - **Type**: API Key
   - **Auth Type**: Bearer
   - **API Key**: Your `DTH_API_TOKEN` value

### Example GPT Instructions

```
You are an AI assistant with access to the Dream Team Hub API.

You can:
- Retrieve role cards from the organization
- List agent summaries with their performance metrics
- Filter agents by business unit, autonomy level, or status
- Search for specific agents by name

Always use the API endpoints to get current data rather than making assumptions.
```

### Available Operations for GPTs

1. **getRoles** - List all role cards
2. **getRoleByHandle** - Get specific role details
3. **getAgentSummaries** - List agents with KPIs and filters

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created (for POST requests) |
| 204  | Success (no content) |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized (missing or invalid token) |
| 404  | Not Found |
| 500  | Internal Server Error |

---

## 📖 Full API Documentation

- **OpenAPI Spec**: `docs/API_SPEC_v0.1.1.yaml`
- **GPT Actions Schema**: `docs/GPT_ACTIONS_SCHEMA.yaml`
- **Postman Collection**: `docs/POSTMAN_COLLECTION.json`

---

## 🔒 Security Best Practices

1. **Keep your API token secret** - Never commit `DTH_API_TOKEN` to git
2. **Use HTTPS only** - All API requests use secure connections
3. **Rotate tokens regularly** - Update `DTH_API_TOKEN` in Replit Secrets periodically
4. **Limit token scope** - Create separate tokens for different integrations when possible
5. **Monitor API usage** - Check server logs for unauthorized access attempts

---

## 💡 Example Use Cases

### Use Case 1: Academy Dashboard
```javascript
// Fetch all L1 agents in pilot status for the Support team
const response = await fetch(
  'https://workspace.DustinSparks1.repl.co/api/agents/summary?bu=Support&level=L1&status=pilot',
  {
    headers: {
      'Authorization': `Bearer ${DTH_API_TOKEN}`
    }
  }
);
const agents = await response.json();
const totalCount = response.headers.get('X-Total-Count');
```

### Use Case 2: Role Card Sync
```javascript
// Upsert a role card by handle
async function upsertRole(handle, roleData) {
  // Try to get existing role
  const getResponse = await fetch(
    `https://workspace.DustinSparks1.repl.co/api/roles/by-handle/${handle}`,
    {
      headers: { 'Authorization': `Bearer ${DTH_API_TOKEN}` }
    }
  );
  
  if (getResponse.status === 404) {
    // Create new role
    return fetch('https://workspace.DustinSparks1.repl.co/api/roles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DTH_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roleData)
    });
  } else {
    // Update existing role
    return fetch(
      `https://workspace.DustinSparks1.repl.co/api/roles/by-handle/${handle}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${DTH_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      }
    );
  }
}
```

### Use Case 3: Search Agents
```javascript
// Search for agents by name
async function searchAgents(query) {
  const response = await fetch(
    `https://workspace.DustinSparks1.repl.co/api/agents/summary?q=${encodeURIComponent(query)}`,
    {
      headers: { 'Authorization': `Bearer ${DTH_API_TOKEN}` }
    }
  );
  return response.json();
}

// Usage
const routers = await searchAgents('router');
```

---

## 🆘 Troubleshooting

### 401 Unauthorized
- **Check**: Is your `Authorization` header correct?
- **Format**: `Authorization: Bearer YOUR_TOKEN_HERE`
- **Verify**: Token exists in Replit Secrets as `DTH_API_TOKEN`

### 404 Not Found
- **Check**: Is the endpoint path correct?
- **Remember**: Use `/api/agents/summary` not `/agents/summary`

### Empty Results
- **Check**: Are your filter parameters too restrictive?
- **Test**: Try without filters first, then add them one by one

### CORS Errors (Browser)
- The API includes CORS headers for browser access
- If issues persist, check browser console for specific error messages

---

## 📞 Support

For API issues or questions:
1. Check the logs: Review server logs in Replit
2. Test with cURL: Verify the endpoint works outside your application
3. Review docs: Check `docs/API_SPEC_v0.1.1.yaml` for detailed schemas
