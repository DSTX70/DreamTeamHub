import type { Request, Response } from "express";
import { runSkill } from "../../ai/runSkill";
import { IntentStrategyDraftSchema } from "../../ai/schemas/intentStrategyDraft";
import { validateIntentStrategyDraft } from "../../ai/drops/validateIntentStrategyDraft";

/**
 * Pilot G — Milestone 1 (Draft)
 * POST /api/work-items/:id/actions/draftIntentStrategy
 *
 * Body:
 * {
 *   taskText: string,          // natural language description
 *   repoHint?: string,         // e.g. "GigsterGarage"
 *   title?: string
 * }
 *
 * Returns:
 * 200 { ok:true, ...draft }
 * 400 { ok:false, error, details }
 */
export async function postDraftIntentStrategy(req: Request, res: Response) {
  try {
    const workItemId = req.params.id;
    const { taskText, repoHint, title } = (req.body || {}) as any;

    if (!taskText || typeof taskText !== "string" || taskText.trim().length < 8) {
      return res.status(400).json({
        ok: false,
        error: "taskText is required (a natural-language description of the task).",
      });
    }

    const input = {
      taskText: taskText.trim(),
      repoHint: (repoHint && String(repoHint).trim()) || "GigsterGarage",
      title: (title && String(title).trim()) || `Work Item ${workItemId}`,
    };

    const raw = await runSkill({
      skillName: "draftIntentStrategy",
      input,
    });

    const parsed = IntentStrategyDraftSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Model output did not match IntentStrategyDraft schema",
        details: parsed.error.flatten(),
        rawModelOutput: raw,
      });
    }

    const draft = parsed.data;

    const validation = validateIntentStrategyDraft({
      intentBlock: draft.intentBlock,
      strategyBlock: draft.strategyBlock,
      evidenceRequest: draft.evidenceRequest,
      fileFetchPaths: draft.fileFetchPaths || [],
    });

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Draft failed validation",
        details: { validationErrors: validation.errors },
        draft,
      });
    }

    return res.json({
      ok: true,
      ...draft,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
