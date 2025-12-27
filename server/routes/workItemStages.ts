import type { Express } from "express";
import { buildDrop, buildRecommendation, getStage, saveStage } from "../lib/workItemStages";

export function registerWorkItemStageRoutes(app: Express) {
  // Read stage record
  app.get("/api/work-items/:id/stage", async (req, res) => {
    try {
      const rec = await getStage(req.params.id);
      res.json(rec);
    } catch (error) {
      console.error("Error getting stage:", error);
      res.status(500).json({ error: "Failed to get stage" });
    }
  });

  // Generate recommendation (non-executing)
  app.post("/api/work-items/:id/stage/recommendation", async (req, res) => {
    try {
      const workItemId = req.params.id;
      const rec = await getStage(workItemId);

      const { title, inputs, repoHint, strategySessionId } = req.body || {};
      const text = buildRecommendation({ title, inputs, repoHint, strategySessionId });

      const next = await saveStage({
        ...rec,
        stage: "RECOMMENDATION_DRAFT",
        recommendation: { text, created_at: new Date().toISOString() },
      });
      res.json(next);
    } catch (error) {
      console.error("Error generating recommendation:", error);
      res.status(500).json({ error: "Failed to generate recommendation" });
    }
  });

  // Approve recommendation (Dustin gate)
  app.post("/api/work-items/:id/stage/approve", async (req, res) => {
    try {
      const workItemId = req.params.id;
      const rec = await getStage(workItemId);
      if (!rec.recommendation?.text) {
        return res.status(400).json({ ok: false, error: "No recommendation to approve." });
      }
      const approved_by = (req.body?.approved_by as string) || "Dustin Sparks";
      const next = await saveStage({
        ...rec,
        stage: "RECOMMENDATION_APPROVED",
        approval: { approved_by, approved_at: new Date().toISOString() },
      });
      res.json(next);
    } catch (error) {
      console.error("Error approving recommendation:", error);
      res.status(500).json({ error: "Failed to approve recommendation" });
    }
  });

  // Generate drop (FILE/END_FILE) for target repo (GigsterGarage default)
  app.post("/api/work-items/:id/stage/drop", async (req, res) => {
    try {
      const workItemId = req.params.id;
      const rec = await getStage(workItemId);

      if (rec.stage !== "RECOMMENDATION_APPROVED") {
        return res.status(400).json({ ok: false, error: "Recommendation must be approved before generating a drop." });
      }

      const targetRepo = (req.body?.targetRepo as string) || "GigsterGarage";
      const dropText = buildDrop({
        targetRepo,
        workItemId,
        recommendationText: rec.recommendation?.text || "",
      });

      const next = await saveStage({
        ...rec,
        stage: "DROP_READY",
        drop: { targetRepo, text: dropText, created_at: new Date().toISOString() },
      });
      res.json(next);
    } catch (error) {
      console.error("Error generating drop:", error);
      res.status(500).json({ error: "Failed to generate drop" });
    }
  });
}
