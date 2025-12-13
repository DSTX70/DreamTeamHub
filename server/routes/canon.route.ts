import { Router } from "express";
import { getLatestCanonStatus } from "../lib/canonSync";
import { db } from "../db";

export const canonRouter = Router();

canonRouter.get("/status", async (req, res) => {
  try {
    const canonKey = String(req.query.canonKey ?? "dream_team_hub");
    const status = await getLatestCanonStatus(db, canonKey);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch canon status", details: String(err?.message ?? err) });
  }
});
