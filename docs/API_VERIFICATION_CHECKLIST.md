# API Verification Checklist

## ⚠️ Important Note

Due to tsx runtime caching in the development environment, localhost testing may not reflect the latest code changes. **All endpoints must be tested from an external environment** using the public base URL.

## 🌐 External Testing Setup

```bash
export BASE_URL="https://workspace.DustinSparks1.repl.co"
export DTH_API_TOKEN="<YOUR_TOKEN_HERE>"
```

## ✅ Verification Tests

### 1. Health Check (No Auth)
```bash
curl -i "$BASE_URL/healthz"
```
**Expected**: `200 OK` with body `ok`

---

### 2. Roles API - List with Pagination
```bash
curl -i -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/roles?limit=5&offset=0"
```
**Check**:
- ✅ Status: `200 OK`
- ✅ Header: `X-Total-Count` present
- ✅ Body: JSON array of roles

---

### 3. Roles API - Get by Handle
```bash
curl -s -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/roles/by-handle/product_owner"
```
**Expected**: Single role object or `404` if not found

---

### 4. Agents Summary - Default Page
```bash
curl -i -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?limit=5&offset=0"
```
**Check**:
- ✅ Status: `200 OK`
- ✅ Header: `X-Total-Count` present  
- ✅ Body: Array of agent summary objects

---

### 5. Agents Summary - Business Unit Filter
```bash
curl -s -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?bu=Support&limit=10"
```
**Expected**: Only agents with `business_unit: "Support"`

---

### 6. Agents Summary - Autonomy Level Filter
```bash
curl -s -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?level=L1"
```
**Expected**: Only agents with `autonomy_level: "L1"`

---

### 7. Agents Summary - Status Filter
```bash
curl -s -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?status=pilot"
```
**Expected**: Only agents with `status: "pilot"`

---

### 8. Agents Summary - Text Search
```bash
curl -s -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?q=router"
```
**Expected**: Agents matching "router" in name or display_name

---

### 9. Agents Summary - Combined Filters
```bash
curl -s -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?bu=Support&level=L1&status=pilot"
```
**Expected**: Agents matching ALL filter criteria

---

### 10. Response Format Verification

Each agent summary object must include:

```json
{
  "name": "agent_handle",
  "display_name": "Human Readable Name",
  "autonomy_level": "L0|L1|L2|L3",
  "status": "pilot|live|watch|rollback",
  "next_gate": 1|2|3|null,
  "promotion_progress_pct": 0-100,
  "business_unit": "Pod Name or General",
  "kpis": {
    "task_success": 0.0-1.0,
    "latency_p95_s": number,
    "cost_per_task_usd": number
  },
  "links": {
    "pr": "GitHub PR URL or skill pack path",
    "promotion_request": "/path/to/promotion_request_template.md",
    "evidence_pack": "/path/to/evidence/pack/"
  }
}
```

---

### 11. Authentication Tests

**Missing Token (expect 401)**:
```bash
curl -i "$BASE_URL/api/agents/summary"
```

**Invalid Token (expect 401)**:
```bash
curl -i -H "Authorization: Bearer INVALID_TOKEN" \
  "$BASE_URL/api/agents/summary"
```

**Valid Token (expect 200)**:
```bash
curl -i -H "Authorization: Bearer $DTH_API_TOKEN" \
  "$BASE_URL/api/agents/summary?limit=1"
```

---

## 📊 Field Validation

### KPIs
- `task_success`: Float between 0.0 and 1.0 (e.g., 0.84 = 84% success rate)
- `latency_p95_s`: Float representing 95th percentile latency in seconds
- `cost_per_task_usd`: Float representing average cost per task in USD

### Promotion Data
- `autonomy_level`: L0 (Advisory), L1 (Collaborative), L2 (Autonomous), L3 (Strategic)
- `next_gate`: Next promotion gate number (null for L3 agents)
- `promotion_progress_pct`: Integer 0-100 showing progress to next gate

### Links
- `pr`: Pull request URL or skill pack file path
- `promotion_request`: Path to promotion request template
- `evidence_pack`: Path to evidence pack directory

---

## 🔍 Common Issues

### 401 Unauthorized
- Verify `DTH_API_TOKEN` is set in Replit Secrets
- Check Authorization header format: `Bearer <token>`
- Ensure no extra whitespace in token value

### Empty Results
- Check filter parameters aren't too restrictive
- Verify database contains matching records
- Try without filters first, then add one at a time

### Missing X-Total-Count
- Check response headers (not body)
- Use `curl -i` to see headers
- Should show total count of matching records

---

## ✅ Success Criteria

All tests pass when:
1. ✅ `/healthz` returns 200 without auth
2. ✅ API endpoints require valid Bearer token
3. ✅ Pagination headers (`X-Total-Count`) present
4. ✅ Filters correctly narrow results
5. ✅ Text search finds matching agents
6. ✅ Response format matches specification
7. ✅ KPIs, links, and promotion data included in all responses

---

## 📝 Implementation Status

- ✅ Dual authentication middleware (session + API token)
- ✅ `/api/agents/summary` endpoint with full filtering
- ✅ Pagination (limit/offset) with X-Total-Count header
- ✅ KPI data (task_success, latency_p95_s, cost_per_task_usd)
- ✅ Promotion progress tracking
- ✅ Business unit, level, status, and text search filters
- ✅ Links to PRs, promotion requests, and evidence packs
- ✅ Architect-reviewed and approved

**Next Step**: Test all endpoints from external environment using the curl commands above.
