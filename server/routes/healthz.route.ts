// server/routes/healthz.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import type { HealthResponse, CheckResult } from "../../shared/types/health";

// Optional imports — leave as-is if your app doesn't provide these exact modules.
// Swap these for your project's actual helpers.
import { db } from "../db"; // expect a db client compatible with .execute or .query('SELECT 1')
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";

const router = Router();

type Probe = {
  name: "db" | "s3" | "smtp";
  fn: () => Promise<void>;
};

async function timeProbe(name: Probe["name"], fn: () => Promise<void>): Promise<CheckResult> {
  const t0 = performance.now();
  try {
    await fn();
    const t1 = performance.now();
    return { name, ok: true, latencyMs: Math.round(t1 - t0) };
  } catch (err: any) {
    const t1 = performance.now();
    return {
      name,
      ok: false,
      latencyMs: Math.round(t1 - t0),
      details: err?.message || String(err),
    };
  }
}

// --- default no-op fallbacks so this file is portable ---
// Replace these with your real implementations if needed.
async function checkDB() {
  // Try a tiny query. Adapt to your DB layer if needed.
  if (!db) throw new Error("db client not found");
  // Many ORMs expose a `execute` or raw query method; tweak accordingly.
  // @ts-ignore
  await db.execute?.("SELECT 1") ?? db.query?.("SELECT 1");
}

async function checkS3() {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  const s3 = new S3Client({ region });
  if (!bucket) throw new Error("S3 bucket env not set");
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

router.get("/", async (_req: Request, res: Response) => {
  const t0 = performance.now();

  const results = await Promise.all([
    timeProbe("db", checkDB),
    timeProbe("s3", checkS3),
    timeProbe("smtp", checkSMTP),
  ]);

  const allOk = results.every(r => r.ok);
  const t1 = performance.now();

  const payload: HealthResponse = {
    ok: allOk,
    latencyMs: Math.round(t1 - t0),
    checks: results,
    ts: new Date().toISOString(),
  };

  const status = allOk ? 200 : 503;
  res.status(status).json(payload);
});

export default router;
