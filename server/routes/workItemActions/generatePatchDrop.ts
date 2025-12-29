import type { Request, Response } from "express";
import { runSkill } from "../../ai/runSkill";
import { PatchDropSchema } from "../../ai/schemas/patchDrop";
import { validatePatchDropFormat } from "../../ai/drops/validatePatchDrop";

/**
 * Pilot F — Patch Drop Generator (Milestone 1+)
 * Supports:
 *  - Patch needed: validated FILE blocks
 *  - No patch needed: noPatchRequired=true with rationale/evidence, validated as a no-op outcome
 */
export async function postGeneratePatchDrop(req: Request, res: Response) {
  try {
    const workItemId = req.params.id;
    const { title, repoHint, lockedRecommendation, notes } = (req.body || {}) as any;

    if (!lockedRecommendation || typeof lockedRecommendation !== "string" || lockedRecommendation.trim().length < 20) {
      return res.status(400).json({
        ok: false,
        error: "lockedRecommendation is required (include the saved Recommendation text, ideally with FILE blocks).",
      });
    }

    const input = {
      title: title || `Work Item ${workItemId}`,
      repoHint: repoHint || "GigsterGarage",
      lockedRecommendation,
      notes: notes || "",
    };

    const raw = await runSkill({
      skillName: "generatePatchDrop",
      input,
    });

    const parsed = PatchDropSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Model output did not match PatchDrop schema",
        details: parsed.error.flatten(),
        rawModelOutput: raw,
      });
    }

    const data = parsed.data as any;

    // Always validate the resulting dropText format (supports both paths)
    const validation = validatePatchDropFormat(data.dropText);
    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Generated drop failed format validation",
        details: { validationErrors: validation.errors },
        repo: data.repo,
        dropText: data.dropText,
        noPatchRequired: data.noPatchRequired === true,
        rationale: data.rationale,
        evidence: data.evidence,
      });
    }

    // Success (either patch needed or no patch needed)
    return res.json({
      ok: true,
      repo: data.repo,
      dropText: data.dropText,
      noPatchRequired: data.noPatchRequired === true,
      ...(data.noPatchRequired === true
        ? {
            rationale: data.rationale,
            evidence: data.evidence,
          }
        : {}),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
