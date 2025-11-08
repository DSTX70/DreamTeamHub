# Ops/Health/LLM Smoke Pack

This script hits the endpoints we wired (healthz/livez, deploy mark/last, metrics, LLM presets DB + augment, ops logs emit + rest).

## Files
- `smoke.ts` — Node 18+ TypeScript script (uses global `fetch`)

## Run
```bash
# from your repo root (server must be running on API_BASE)
npm i -D tsx
API_BASE=http://localhost:3000 \
API_KEY=YOUR_RBAC_KEY \
FAMILY=gpt \
npx tsx /path/to/smoke.ts
```

### Env
- `API_BASE` (default `http://localhost:3000`)
- `API_KEY` for admin-gated endpoints (`x-api-key`)
- `FAMILY` ⇒ `gpt|claude|gemini` (defaults to `gpt`)
- Optional: `SHA`, `TAG`, `ACTOR` to annotate the deploy mark

## What it asserts
1. `/api/healthz` returns `{ ok, checks, latencyMs }` (HTTP 200 or 503 with details)
2. `/api/healthz/livez` returns `{ ok:true }` (HTTP 200)
3. `/api/admin/deploy/mark` succeeds, then `/api/admin/deploy/last` returns a timestamp
4. `/metrics` exposes `http_request_duration_seconds`
5. Preset lifecycle on `/api/llm/presets-db`, and `/api/llm/augment` includes the augment line
6. `/api/ops/logs/emit` returns ok; `/api/ops/logs/rest?since=15m` returns an `events` array

If any assertion fails, the script exits non‑zero with an error message.
