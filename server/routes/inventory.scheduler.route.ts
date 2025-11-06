import express, { Request, Response } from "express";
import { startLowStockSchedulerDB } from "../scheduler/lowStockScheduler.db";

export const router = express.Router();

let runner: ReturnType<typeof startLowStockSchedulerDB> | null = null;
function getRunner() { if (!runner) runner = startLowStockSchedulerDB({ intervalMs: 60_000 }); return runner; }

router.post("/api/ops/inventory/scan-now", async (_req: Request, res: Response) => {
  const r = getRunner();
  await r.scan();
  res.json({ ok: true, ran: true });
});

export default router;
