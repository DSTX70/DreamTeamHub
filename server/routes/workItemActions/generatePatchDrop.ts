import type { Request, Response } from "express";
import { runSkill } from "../../ai/runSkill";
import { PatchDropSchema } from "../../ai/schemas/patchDrop";
import { validatePatchDropFormat } from "../../ai/drops/validatePatchDrop";
import {
  extractEvidenceFromWorkItemFiles,
  buildEvidencePromptBlock,
} from "../../services/evidenceExtractor";
import { storage } from "../../storage";

function hasAnyFileBlocks(text: string): boolean {
  return /^\s*FILE:\s+/m.test(text || "");
}

function extractApiHints(text: string): string[] {
  const t = text || "";
  const matches = t.match(/\/api\/[a-zA-Z0-9/_-]+/g) || [];
  return Array.from(new Set(matches)).slice(0, 10);
}

function extractFilePathHints(text: string): string[] {
  const t = text || "";
  const matches =
    t.match(
      /(?:^|\s)(?:client|server|shared|packages|src|apps|lib|routes|components)\/[a-zA-Z0-9/_\-.]+\.(?:ts|tsx|js|jsx|json|md|yml|yaml|css|scss|html)(?:\s|$)/gm
    ) || [];
  const cleaned = matches
    .map((m) => m.trim())
    .map((m) => m.replace(/^[^\w/]+/, "").replace(/[^\w.\-/_]+$/, ""))
    .filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 12);
}

type TaskType = "ui_change" | "bug_fix" | "unknown";

function classifyTaskType(text: string): TaskType {
  const t = (text || "").toLowerCase();

  const bugSignals = [
    "error",
    "exception",
    "stack",
    "trace",
    "console",
    "network",
    "xhr",
    "fetch",
    "request failed",
    "failed to",
    "500",
    "401",
    "403",
    "timeout",
    "blocked",
    "cors",
    "unexpected",
    "cannot",
    "uncaught",
    "rejection",
    "status code",
  ];

  const uiSignals = [
    "banner",
    "copy",
    "text",
    "label",
    "button",
    "cta",
    "headline",
    "subheading",
    "layout",
    "spacing",
    "padding",
    "margin",
    "admin page",
    "header",
    "nav",
    "sidebar",
    "card",
    "link",
    "ui",
    "styling",
    "color",
    "font",
    "tooltip",
  ];

  const bugCount = bugSignals.reduce((n, s) => (t.includes(s) ? n + 1 : n), 0);
  const uiCount = uiSignals.reduce((n, s) => (t.includes(s) ? n + 1 : n), 0);

  if (bugCount >= 2) return "bug_fix";
  if (uiCount >= 2) return "ui_change";
  return "unknown";
}

function hasUiSpec(text: string): boolean {
  const t = (text || "").toLowerCase();
  const specMarkers = [
    "banner goal",
    "location:",
    "placement:",
    "text:",
    "copy:",
    "style:",
    "colors:",
    "behavior:",
    "dismiss",
    "visibility:",
    "ui spec",
    "exact words",
    "where on",
  ];
  return specMarkers.some((m) => t.includes(m));
}

function buildEvidenceRequest(params: {
  taskType: TaskType;
  lockedRecommendation: string;
}): { evidenceRequest: string; suggestedFileFetchPaths: string[] } {
  const apiHints = extractApiHints(params.lockedRecommendation);
  const filePathHints = extractFilePathHints(params.lockedRecommendation);

  const apiLine = apiHints.length
    ? `Likely endpoints mentioned: ${apiHints.join(", ")}`
    : "Endpoint not yet captured.";

  const baseFileGuidance =
    `### Required repo context (FILE blocks)\n` +
    `The patch generator requires actual repo context in FILE blocks.\n` +
    `Fetch the relevant files via the connector (preferred), then re-run.\n\n` +
    `Minimum:\n` +
    `- client page/component where the change lives\n` +
    `- any shared component(s) used by that page\n` +
    `- any server route touched (if applicable)\n`;

  let evidenceRequest = "";
  let suggestedFileFetchPaths: string[] = [];

  if (params.taskType === "ui_change") {
    const needsSpec = !hasUiSpec(params.lockedRecommendation);

    evidenceRequest =
      `### What's missing (UI task)\n` +
      `This appears to be a UI/copy/layout change. DevTools Network evidence is NOT required.\n\n` +
      (needsSpec
        ? `Please paste a UI spec (any structured description is fine):\n` +
          `- Banner goal\n` +
          `- Location/placement\n` +
          `- Exact text/copy\n` +
          `- Style (colors/size/tone)\n` +
          `- Behavior (dismissible? links?)\n` +
          `- Visibility rules (admin-only? always?)\n\n`
        : `UI spec detected ✅ (no additional UI spec required).\n\n`) +
      baseFileGuidance;

    suggestedFileFetchPaths = filePathHints.length
      ? filePathHints
      : [
          "client/src/pages/admin.tsx",
        ];
  } else if (params.taskType === "bug_fix") {
    evidenceRequest =
      `### What's missing (Bug/runtime task)\n` +
      `This appears to be a runtime/bug fix. Please paste ONE failing request + console evidence.\n\n` +
      `Please paste ONE failing Network request from DevTools → Network (Fetch/XHR):\n` +
      `- URL\n- Method\n- Status\n- Request payload\n- Response body\n\n` +
      `Also paste any Console error stack that appears immediately after clicking the action.\n\n` +
      `${apiLine}\n\n` +
      baseFileGuidance;

    suggestedFileFetchPaths = filePathHints.length
      ? filePathHints
      : [
          "client/src/pages/admin.tsx",
          "server/routes.ts",
        ];
  } else {
    const needsSpec = !hasUiSpec(params.lockedRecommendation);

    evidenceRequest =
      `### What's missing\n` +
      `Task type is unclear. Start by ensuring we have repo FILE blocks (context) for the relevant code.\n\n` +
      (needsSpec
        ? `If this is a UI/copy/layout change, paste a short UI spec:\n` +
          `- Location\n- Exact text/copy\n- Style\n- Behavior\n\n`
        : "") +
      `If this is a bug/runtime issue, include ONE failing request + console stack.\n\n` +
      baseFileGuidance;

    suggestedFileFetchPaths = filePathHints.length ? filePathHints : [];
  }

  suggestedFileFetchPaths = Array.from(new Set(suggestedFileFetchPaths)).slice(0, 12);

  return { evidenceRequest, suggestedFileFetchPaths };
}

function blockedDrop(params: { repo: string; lockedRecommendation: string }) {
  const taskType = classifyTaskType(params.lockedRecommendation);
  const { evidenceRequest, suggestedFileFetchPaths } = buildEvidenceRequest({
    taskType,
    lockedRecommendation: params.lockedRecommendation,
  });

  const dropText =
    `Repo: ${params.repo}\n` +
    `Manual apply only\n\n` +
    `## BLOCKED — Missing Repo Context\n` +
    `The system cannot generate a safe patch drop yet because the approved recommendation does not include repo FILE blocks for the relevant code.\n\n` +
    `${evidenceRequest}\n\n` +
    `## Post-apply verification checklist\n` +
    `- N/A until unblocked (provide the requested context/evidence above)\n`;

  return {
    ok: true,
    repo: params.repo,
    blocked: true as const,
    noPatchRequired: false as const,
    evidenceRequest,
    suggestedFileFetchPaths,
    dropText,
  };
}

export async function postGeneratePatchDrop(req: Request, res: Response) {
  try {
    const workItemId = req.params.id;
    const { title, repoHint, lockedRecommendation, notes, evidenceNotes } =
      (req.body || {}) as any;

    if (
      !lockedRecommendation ||
      typeof lockedRecommendation !== "string" ||
      lockedRecommendation.trim().length < 20
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "lockedRecommendation is required (include the saved Recommendation text, ideally with FILE blocks).",
      });
    }

    const repo = repoHint || "GigsterGarage";

    let extractedFileText = "";
    try {
      const numericWorkItemId = parseInt(workItemId, 10);
      if (!isNaN(numericWorkItemId)) {
        extractedFileText = await extractEvidenceFromWorkItemFiles(numericWorkItemId);
      }
    } catch (err: any) {
      console.warn("[generatePatchDrop] Evidence extraction warning:", err?.message);
    }

    let storedEvidenceNotes = "";
    try {
      const numericWorkItemId = parseInt(workItemId, 10);
      if (!isNaN(numericWorkItemId)) {
        const wi = await storage.getWorkItem(numericWorkItemId);
        storedEvidenceNotes = String(wi?.evidenceNotes || "");
      }
    } catch (err: any) {
      console.warn("[generatePatchDrop] Could not load stored evidenceNotes:", err?.message);
    }

    const mergedEvidenceNotes = [storedEvidenceNotes, evidenceNotes || ""]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join("\n\n");

    const evidenceBlock = buildEvidencePromptBlock({
      evidenceNotes: mergedEvidenceNotes,
      extractedFileText,
    });

    const augmentedRecommendation = evidenceBlock
      ? `${lockedRecommendation}\n\n${evidenceBlock}`
      : lockedRecommendation;

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
        ? {
            evidenceRequest: data.evidenceRequest,
            suggestedFileFetchPaths: data.suggestedFileFetchPaths,
          }
        : {}),
      ...(data.noPatchRequired === true
        ? { rationale: data.rationale, evidence: data.evidence }
        : {}),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
