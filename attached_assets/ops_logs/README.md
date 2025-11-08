# ship_ops_logs_stream_redis_and_since

Adds Redis-backed pub/sub for ops logs stream, a REST logs endpoint with `since` filtering, and UI toggles for copy mode.

## Server
```ts
import opsLogsRedisRouter from "./routes/ops_logs_redis.route";
import opsLogsSinceRouter from "./routes/ops_logs_since.route";

app.use("/api/ops/logs", express.json(), opsLogsRedisRouter);  // provides /stream and /emit
app.use("/api/ops/logs/rest", opsLogsSinceRouter);             // provides ?since=15m|1h|24h|epochMs
```

Env:
- `REDIS_URL=redis://localhost:6379`
- `OPS_LOGS_CHANNEL=ops:logs`

Emit example:
```bash
curl -X POST /api/ops/logs/emit -H "Content-Type: application/json" -d '{ "id":"1", "ts":"2025-11-07T00:00:00Z", "level":"info", "kind":"deploy", "owner":"forge", "msg":"deploy main@abc" }'
```

## Client
- Page: `/ops/logs-stream-plus` → `client/src/pages/ops/LogsStreamPlus.tsx`
- Controls: time window (15m/1h/24h), level/owner/kind filters, **Copy summary / Copy JSON** toggle.

Notes
- Replace the buffer in `ops_logs_since.route.ts` with your DB-backed store.
- Redis pub/sub is production-friendly; ensure proper auth/TLS in production.
