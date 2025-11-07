# ship_healthz_and_live_health_card

Drop-in health endpoint and UI card.

## Files
- `server/routes/healthz.route.ts`
- `shared/types/health.ts`
- `client/src/components/ops/LiveHealthCard.tsx`
- `patches/ops_overview.diff` (unified diff to add the card to `/ops/overview`)

## Server mount

In your Express server bootstrap (e.g., `server/index.ts` or `api/index.ts`):

```ts
import express from "express";
import healthzRouter from "./routes/healthz.route";

const app = express();
// … your other middleware
app.use("/api/healthz", healthzRouter);
```

Ensure the route file path matches your repo (adjust relative path if needed).

### Env required
- `S3_BUCKET` (or `AWS_S3_BUCKET`) and `AWS_REGION` for S3 probe
- `SMTP_HOST` (+ optionally `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) for SMTP probe
- Database client is imported from `../drizzle/db` by default — change to your actual db module if different.

## Client mount

1) Copy `client/src/components/ops/LiveHealthCard.tsx` into your repo.
2) Apply the patch (or manually import and place the card) to `client/src/pages/ops/Overview.tsx`:

```diff
*** a/client/src/pages/ops/Overview.tsx
--- b/client/src/pages/ops/Overview.tsx
@@
-import React from "react";
+import React from "react";
+import LiveHealthCard from "../../components/ops/LiveHealthCard";
@@
 export default function Overview() {
   return (
-    <div className="space-y-6">
-      {/* existing overview content */}
-    </div>
+    <div className="space-y-6">
+      {/* Live Health card */}
+      <LiveHealthCard />
+
+      {/* existing overview content */}
+    </div>
   );
 }

```

If you patch manually, add:

```ts
import LiveHealthCard from "../../components/ops/LiveHealthCard";
// … inside your component:
<LiveHealthCard />
```

## Types
Copy `shared/types/health.ts` and update your tsconfig path aliases if you use them.

## Test locally

```bash
# Server running (dev):
curl -sS http://localhost:3000/api/healthz | jq
```

Expected shape:

```json
{
  "ok": true,
  "latencyMs": 42,
  "checks": [
    {"name":"db","ok":true,"latencyMs":5},
    {"name":"s3","ok":true,"latencyMs":16},
    {"name":"smtp","ok":true,"latencyMs":18}
  ],
  "ts": "2025-11-07T23:37:10.320379Z"
}
```

If any probe fails, the endpoint returns `503` with `ok: false` and includes `details` for the failed checks.

## Notes
- Probes are intentionally small (no writes), suitable for a lightweight `/api/healthz`.
- The UI auto-refreshes every 30s and has a manual **Refresh** button.
- Tailwind classes give a clean, minimal look; adjust to your design system as needed.
