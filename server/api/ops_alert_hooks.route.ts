import type { Request, Response } from "express";
import express from "express";
export const router = express.Router();

// Minimal alert hook: fan-out to console / webhook / queue (stubs)
router.post("/api/ops/alert", async (req: Request, res: Response) => {
  const { kind = "info", message = "" } = req.body || {};
  // TODO: push to Slack/Webhook/Queue; for now just log
  console.log(`[OPS][${kind}] ${message}`);
  res.send("Alert accepted");
});
