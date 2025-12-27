import type { Express } from "express";
import {
  createStrategySession,
  deleteStrategySession,
  getStrategySession,
  listStrategySessions,
  updateStrategySession,
} from "../lib/strategySessions";

export function registerStrategySessionRoutes(app: Express) {
  // List
  app.get("/api/strategy-sessions", async (_req, res) => {
    const sessions = await listStrategySessions();
    res.json(sessions);
  });

  // Create
  app.post("/api/strategy-sessions", async (req, res) => {
    const session = await createStrategySession(req.body || {});
    res.json(session);
  });

  // Read
  app.get("/api/strategy-sessions/:id", async (req, res) => {
    const s = await getStrategySession(req.params.id);
    if (!s) return res.status(404).json({ ok: false, error: "Not found" });
    res.json(s);
  });

  // Update
  app.put("/api/strategy-sessions/:id", async (req, res) => {
    const s = await updateStrategySession(req.params.id, req.body || {});
    if (!s) return res.status(404).json({ ok: false, error: "Not found" });
    res.json(s);
  });

  // Delete (rare; mainly for cleanup)
  app.delete("/api/strategy-sessions/:id", async (req, res) => {
    const ok = await deleteStrategySession(req.params.id);
    res.json({ ok });
  });
}
