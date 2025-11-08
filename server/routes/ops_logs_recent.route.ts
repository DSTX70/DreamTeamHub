// server/routes/ops_logs_recent.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { getOpsEventsSince } from "./ops_logs_since.route";

const router = Router();

// GET /api/ops/logs/recent (session-authenticated, read-only)
// Returns events from the last 15 minutes
// Note: This route is mounted at /api/ops/logs/recent, so the path here is just /
router.get("/", (_req: Request, res: Response) => {
  const events = getOpsEventsSince(15 * 60 * 1000); // 15 minutes in ms
  res.json({ events });
});

export default router;
