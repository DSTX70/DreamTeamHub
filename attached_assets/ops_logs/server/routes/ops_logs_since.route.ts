// server/routes/ops_logs_since.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import type { OpsEvent } from "../../shared/types/ops";

// Replace with DB-backed store in production
const BUF_MAX = 5000;
const buffer: OpsEvent[] = [];

export function appendOpsEvent(e: OpsEvent) {
  buffer.push(e);
  if (buffer.length > BUF_MAX) buffer.splice(0, buffer.length - BUF_MAX);
}

const router = Router();

// GET /api/ops/logs/rest?since=15m|1h|24h|epochMs&level=&owner=&kind=
router.get("/", (req: Request, res: Response) => {
  const { level, owner, kind } = req.query as any;
  const since = req.query.since as string | undefined;

  let cutoff = 0;
  if (since) {
    if (/^\d+$/.test(since)) cutoff = Number(since);
    else if (since === "15m") cutoff = Date.now() - 15*60*1000;
    else if (since === "1h") cutoff = Date.now() - 60*60*1000;
    else if (since === "24h") cutoff = Date.now() - 24*60*60*1000;
  }

  const out = buffer.filter(e => {
    if (level && e.level !== level) return false;
    if (owner && e.owner !== owner) return false;
    if (kind && e.kind !== kind) return false;
    if (cutoff && new Date(e.ts).getTime() < cutoff) return false;
    return true;
  }).slice(-1000);

  res.json({ events: out });
});

export default router;
