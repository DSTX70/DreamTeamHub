import type { Request, Response } from "express";
import express from "express";
export const router = express.Router();

// Stub endpoint for WO Playbook preview persistence
router.post("/api/wo/playbook/preview", async (req: Request, res: Response) => {
  // In real app: validate against schema & save draft
  res.json({ ok: true, received: req.body });
});
