import type { Request, Response } from "express";
import { runSkill } from "../../ai/runSkill";
import { PatchDropSchema } from "../../ai/schemas/patchDrop";
import { validatePatchDropFormat } from "../../ai/drops/validatePatchDrop";

/**
 * Pilot F — Milestone 1 (Draft)
 * Server-only patch drop generator.
 *
 * Contract:
 * POST /api/work-items/:id/actions/generatePatchDrop
 *
 * Body:
 * {
 *   title?: string,
 *   repoHint?: string,
 *   lockedRecommendation?: string,
 *   notes?: string
 * }
 *
 * Returns:
 * 200 { ok:true, repo, dropText }
 * 400 { ok:false, error, details:{ validationErrors, rawModelOutput? } }
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

    const { repo, dropText } = parsed.data;

    const validation = validatePatchDropFormat(dropText);
    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Generated drop failed format validation",
        details: {
          validationErrors: validation.errors,
        },
        repo,
        dropText,
      });
    }

    return res.json({
      ok: true,
      repo,
      dropText,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
