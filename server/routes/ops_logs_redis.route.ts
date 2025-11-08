// server/routes/ops_logs_redis.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import Redis from "ioredis";
import type { OpsEvent } from "../../shared/types/ops";

const router = Router();

const REDIS_URL = process.env.REDIS_URL;
const CHANNEL = process.env.OPS_LOGS_CHANNEL || "ops:logs";

type Client = { id: number; res: Response };
const clients: Client[] = [];
let counter = 0;

let pub: Redis | null = null;
let sub: Redis | null = null;

// Only initialize Redis if REDIS_URL is configured
if (REDIS_URL) {
  pub = new Redis(REDIS_URL);
  sub = new Redis(REDIS_URL);
  
  // Silence connection errors
  pub.on('error', (err) => console.warn('[Redis] Pub error:', err.message));
  sub.on('error', (err) => console.warn('[Redis] Sub error:', err.message));
  
  sub.subscribe(CHANNEL);
  sub.on("message", (_chan, msg) => {
    try {
      const evt = JSON.parse(msg);
      const data = { event: evt };
      for (const c of clients) c.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {}
  });
} else {
  console.warn('[Redis] REDIS_URL not configured, ops logs streaming disabled');
}

router.get("/stream", (req: Request, res: Response) => {
  if (!sub) {
    return res.status(503).json({ error: "Redis not configured" });
  }
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const id = ++counter;
  clients.push({ id, res });
  req.on("close", () => {
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) clients.splice(idx, 1);
  });
  res.write(`data: ${JSON.stringify({ hello: true, ts: new Date().toISOString() })}\n\n`);
});

router.post("/emit", (req: Request, res: Response) => {
  if (!pub) {
    return res.status(503).json({ error: "Redis not configured" });
  }
  
  const evt = req.body as OpsEvent;
  pub.publish(CHANNEL, JSON.stringify(evt));
  res.json({ ok: true });
});

export default router;
