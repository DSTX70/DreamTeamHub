// server/routes/healthz.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import type { HealthResponse, CheckResult } from "../../shared/types/health";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import { db } from "../drizzle/db";

const router = Router();

// ---- helpers ----
const DEFAULT_TIMEOUT_MS = Number(process.env.HEALTHZ_PROBE_TIMEOUT_MS || 3000);

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timeout after ${ms}ms`)), ms)),
  ]) as T;
}

async function timeProbe(name: "db" | "s3" | "smtp", fn: () => Promise<void>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<CheckResult> {
  const t0 = performance.now();
  try {
    await withTimeout(fn(), timeoutMs, name);
    const t1 = performance.now();
    return { name, ok: true, latencyMs: Math.round(t1 - t0) };
  } catch (err: any) {
    const t1 = performance.now();
    return { name, ok: false, latencyMs: Math.round(t1 - t0), details: err?.message || String(err) };
  }
}

async function checkDB() {
  if (!db) throw new Error("db client not found");
  // @ts-ignore
  await db.execute?.("SELECT 1") ?? db.query?.("SELECT 1");
}

async function checkS3() {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  if (!bucket) throw new Error("S3 bucket env not set");
  const s3 = new S3Client({ region });
  await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
}

async function checkSMTP() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host) throw new Error("SMTP_HOST not set");
  const transporter = nodemailer.createTransport({ host, port, auth: user && pass ? { user, pass } : undefined });
  await transporter.verify();
}

// readiness: aggregates probes, returns 503 if any fail
router.get("/", async (_req: Request, res: Response) => {
  const t0 = performance.now();
  const results = await Promise.all([
    timeProbe("db", checkDB),
    timeProbe("s3", checkS3),
    timeProbe("smtp", checkSMTP),
  ]);
  const t1 = performance.now();
  const payload: HealthResponse = {
    ok: results.every(r => r.ok),
    latencyMs: Math.round(t1 - t0),
    checks: results,
    ts: new Date().toISOString(),
  };
  res.status(payload.ok ? 200 : 503).json(payload);
});

// liveness: cheap always-on fast check (no dependencies)
router.get("/livez", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

export default router;
