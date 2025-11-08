# ship_ci_rbac_and_metrics

Adds:
- **RBAC** middleware for admin endpoints (`x-api-key`)
- **Prometheus metrics** (`/metrics`) + per-request histograms/counters
- **Tests** skeleton for `/api/healthz`
- **CI**: GitHub Actions workflow + docker-compose.ci.yml for db/s3/smtp

## Mount

```ts
// server/index.ts
import { metricsMiddleware } from "./metrics/prom";
import metricsRouter from "./routes/metrics.route";
import { requireAdmin } from "./middleware/rbac";

app.use(metricsMiddleware("api"));
app.use("/metrics", metricsRouter);

// Example: guard admin routes
app.use("/api/admin", requireAdmin, adminRouter);
```

## CI
- Adjust workflow `node server/devserver.js` to your dev entry.
- If using LocalStack S3/ Mailhog, set env in your tests to point at them.
