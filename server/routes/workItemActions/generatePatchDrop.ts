import type { Request, Response } from "express";
import { runSkill } from "../../ai/runSkill";
import { PatchDropSchema } from "../../ai/schemas/patchDrop";
import { validatePatchDropFormat } from "../../ai/drops/validatePatchDrop";
import { extractEvidenceFromWorkItemFiles, buildEvidencePromptBlock } from "../../services/evidenceExtractor";

function hasAnyFileBlocks(text: string): boolean {
  return /^\s*FILE:\s+/m.test(text || "");
}

function extractApiHints(text: string): string[] {
  const t = text || "";
  const matches = t.match(/\/api\/[a-zA-Z0-9/_-]+/g) || [];
  // unique, small list
  return Array.from(new Set(matches)).slice(0, 10);
}

function blockedDrop(params: { repo: string; lockedRecommendation: string }) {
  const apiHints = extractApiHints(params.lockedRecommendation);
  const apiLine = apiHints.length ? `Likely endpoints mentioned: ${apiHints.join(", ")}` : "Endpoint not yet captured.";

  const evidenceRequest =
    `Please paste ONE failing Network request from DevTools → Network (Fetch/XHR):\n` +
    `- URL\n- Method\n- Status\n- Request payload\n- Response body\n\n` +
    `Also paste any Console error stack that appears immediately after clicking the action.\n\n` +
    `${apiLine}`;

  const dropText =
    `Repo: ${params.repo}\n` +
    `Manual apply only\n\n` +
    `## BLOCKED — Missing Evidence\n` +
    `The system cannot generate a safe patch drop yet because the approved recommendation does not include repo FILE blocks for the relevant client/server code.\n\n` +
    `### What to paste next\n` +
    `${evidenceRequest}\n\n` +
    `### Then fetch these files via the connector\n` +
    `- client page/component that triggers the action\n` +
    `- server route that handles the failing endpoint\n` +
    `- any related shared schema used by that route\n\n` +
    `## Post-apply verification checklist\n` +
    `- N/A until unblocked (provide the evidence + files above)\n`;

  return {
    ok: true,
    repo: params.repo,
    blocked: true as const,
    noPatchRequired: false as const,
    evidenceRequest,
    suggestedFileFetchPaths: [] as string[],
    dropText,
  };
}

/**
 * Pilot F — Patch Drop Generator
 * Now supports BLOCKED: Missing Evidence when no FILE context is present.
 * Automatically extracts text from uploaded evidence files and includes user-pasted notes.
 */
export async function postGeneratePatchDrop(req: Request, res: Response) {
  try {
    const workItemId = req.params.id;
    const { title, repoHint, lockedRecommendation, notes, evidenceNotes } = (req.body || {}) as any;

    if (!lockedRecommendation || typeof lockedRecommendation !== "string" || lockedRecommendation.trim().length < 20) {
      return res.status(400).json({
        ok: false,
        error: "lockedRecommendation is required (include the saved Recommendation text, ideally with FILE blocks).",
      });
    }

    const repo = repoHint || "GigsterGarage";

    // Extract text from uploaded evidence files (HAR, JSON, TXT, LOG, etc.)
    let extractedFileText = "";
    try {
      const numericWorkItemId = parseInt(workItemId, 10);
      if (!isNaN(numericWorkItemId)) {
        extractedFileText = await extractEvidenceFromWorkItemFiles(numericWorkItemId);
      }
    } catch (err: any) {
      console.warn("[generatePatchDrop] Evidence extraction warning:", err?.message);
    }

    // Build combined evidence block
    const evidenceBlock = buildEvidencePromptBlock({
      evidenceNotes: evidenceNotes || "",
      extractedFileText,
    });

    // Augment recommendation with evidence
    const augmentedRecommendation = evidenceBlock
      ? `${lockedRecommendation}\n\n${evidenceBlock}`
      : lockedRecommendation;

    // ✅ PRE-FLIGHT GATE: If no FILE blocks, do NOT call the model. Return BLOCKED.
    if (!hasAnyFileBlocks(augmentedRecommendation)) {
      return res.json(blockedDrop({ repo, lockedRecommendation: augmentedRecommendation }));
    }

    const input = {
      title: title || `Work Item ${workItemId}`,
      repoHint: repo,
      lockedRecommendation: augmentedRecommendation,
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

    const data: any = parsed.data;

    const validation = validatePatchDropFormat(data.dropText);
    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: "Generated drop failed format validation",
        details: { validationErrors: validation.errors },
        repo: data.repo,
        dropText: data.dropText,
        blocked: data.blocked === true,
        noPatchRequired: data.noPatchRequired === true,
        rationale: data.rationale,
        evidence: data.evidence,
        evidenceRequest: data.evidenceRequest,
      });
    }

    return res.json({
      ok: true,
      repo: data.repo,
      dropText: data.dropText,
      blocked: data.blocked === true,
      noPatchRequired: data.noPatchRequired === true,
      ...(data.blocked === true
        ? { evidenceRequest: data.evidenceRequest, suggestedFileFetchPaths: data.suggestedFileFetchPaths }
        : {}),
      ...(data.noPatchRequired === true ? { rationale: data.rationale, evidence: data.evidence } : {}),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
