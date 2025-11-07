import express, { Request, Response } from "express";
import fs from "fs";
import { logEvent, logFilePath, getCounters } from "../ops/logger";

export const router = express.Router();

router.post("/api/ops/logs/event", express.json(), async (req: Request, res: Response) => {
  const msg = String(req.body?.message || "");
  const meta = (req.body?.meta && typeof req.body.meta === "object") ? req.body.meta : undefined;
  logEvent(msg || "event", meta);
  res.json({ ok: true, counters: getCounters() });
});

router.get("/api/ops/logs.csv", async (_req: Request, res: Response) => {
  const file = logFilePath();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=ops_logs.csv");
  fs.createReadStream(file).pipe(res);
});

// NEW: tail endpoint
router.get("/api/ops/logs/tail", async (req: Request, res: Response) => {
  const file = logFilePath();
  const limit = Number(req.query.limit || 200);
  try {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines.shift() || "ts,kind,message,meta";
    const tail = lines.slice(-limit);
    res.json({ header, lines: tail });
  } catch (e) {
    res.status(500).json({ error: "cannot read logs" });
  }
});

export default router;
