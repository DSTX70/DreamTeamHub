// server/metrics/prom.ts
import client from "prom-client";
import type { Request, Response } from "express";

export const register = new client.Registry();

// Standard default metrics
client.collectDefaultMetrics({ register });

// Example histograms/counters
export const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP response time in seconds",
  labelNames: ["method", "route", "status", "app"],
  buckets: [0.05, 0.1, 0.2, 0.4, 0.75, 1, 2, 5]
});
export const httpErrors = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests by status",
  labelNames: ["method", "route", "status", "app"]
});

register.registerMetric(httpDuration);
register.registerMetric(httpErrors);

// Express middleware example to record per-request metrics
export function metricsMiddleware(appLabel = "api") {
  return function (req: Request, res: Response, next: Function) {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const seconds = Number(end - start) / 1e9;
      const route = (req as any).route?.path || req.path;
      const labels = { method: req.method, route, status: String(res.statusCode), app: appLabel };
      httpDuration.labels(labels.method, labels.route, labels.status, labels.app).observe(seconds);
      httpErrors.labels(labels.method, labels.route, labels.status, labels.app).inc();
    });
    next();
  };
}
