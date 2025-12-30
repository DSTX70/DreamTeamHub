import type { Request, Response } from "express";
import { storage } from "../../storage";

/**
 * POST /api/work-items/:id/actions/appendEvidenceNotes
 * Body: { evidenceNotes: string }
 *
 * Appends the incoming evidenceNotes onto the existing workItem.evidenceNotes.
 * This enables the Intent Console to attach fetched evidence directly to a Work Item
 * without requiring manual copy/paste.
 */
export async function appendEvidenceNotes(req: Request, res: Response) {
  try {
    const workItemId = Number(req.params.id);
    if (!Number.isFinite(workItemId) || workItemId <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid workItem id" });
    }

    const { evidenceNotes } = req.body ?? {};
    const incoming = String(evidenceNotes ?? "").trim();
    if (!incoming) {
      return res.status(400).json({ ok: false, error: "Missing evidenceNotes" });
    }

    const existing = await storage.getWorkItem(workItemId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Work item not found" });
    }

    const prior = String(existing.evidenceNotes ?? "").trim();
    const merged = prior ? `${prior}\n\n${incoming}` : incoming;

    await storage.updateWorkItem(workItemId, { evidenceNotes: merged });

    return res.json({
      ok: true,
      workItemId,
      appendedChars: incoming.length,
      totalChars: merged.length,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message ?? "appendEvidenceNotes failed" });
  }
}
