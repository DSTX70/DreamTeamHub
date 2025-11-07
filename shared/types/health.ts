// shared/types/health.ts
// Canonical response contract for /api/healthz

export type HealthCheckName = "db" | "s3" | "smtp";

export interface CheckResult {
  name: HealthCheckName;
  ok: boolean;
  latencyMs: number;
  details?: string;
}

export interface HealthResponse {
  ok: boolean;
  latencyMs: number; // total latency in ms
  checks: CheckResult[];
  ts: string; // ISO timestamp
}
