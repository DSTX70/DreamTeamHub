import { promises as fs } from "node:fs";
import path from "node:path";
import { fetchGigsterGarageFiles, formatGigsterFilesForPrompt } from "../services/connectors/gigsterGarageReadonly";

export type WorkItemStageName =
  | "NONE"
  | "RECOMMENDATION_DRAFT"
  | "RECOMMENDATION_APPROVED"
  | "DROP_READY";

export type WorkItemStageRecord = {
  workItemId: string;
  stage: WorkItemStageName;
  created_at: string;
  updated_at: string;
  recommendation?: {
    text: string;
    created_at: string;
  };
  approval?: {
    approved_by: string;
    approved_at: string;
  };
  drop?: {
    targetRepo: string;
    text: string;
    created_at: string;
  };
};

const DATA_DIR = path.join(process.cwd(), "data", "work-item-stages");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function nowISO() {
  return new Date().toISOString();
}

export async function getStage(workItemId: string): Promise<WorkItemStageRecord> {
  await ensureDir();
  const p = path.join(DATA_DIR, `${workItemId}.json`);
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as WorkItemStageRecord;
  } catch {
    const base: WorkItemStageRecord = {
      workItemId,
      stage: "NONE",
      created_at: nowISO(),
      updated_at: nowISO(),
    };
    await fs.writeFile(p, JSON.stringify(base, null, 2), "utf-8");
    return base;
  }
}

export async function saveStage(rec: WorkItemStageRecord): Promise<WorkItemStageRecord> {
  await ensureDir();
  const next: WorkItemStageRecord = {
    ...rec,
    updated_at: nowISO(),
  };
  const p = path.join(DATA_DIR, `${rec.workItemId}.json`);
  await fs.writeFile(p, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export function buildRecommendation(params: {
  title?: string;
  inputs?: string;
  repoHint?: string;
  strategySessionId?: string | null;
}): string {
  const title = params.title || "Untitled Work Item";
  const repo = params.repoHint || "GigsterGarage";
  const strategy = params.strategySessionId ? `Strategy Session: ${params.strategySessionId}` : "Strategy Session: (none)";

  return `# Recommendation (Non-executing)\n\n` +
    `**Target Repo:** ${repo}\n\n` +
    `**${strategy}**\n\n` +
    `## What we're doing\n` +
    `Convert the locked strategy into an implementation plan for **${repo}**.\n\n` +
    `## Proposed approach\n` +
    `1) Confirm the exact files/route(s) in ${repo} impacted by this change.\n` +
    `2) Implement the smallest additive patch (no refactors) behind safe guards.\n` +
    `3) Provide post-apply verification steps.\n\n` +
    `## Inputs (from Work Item)\n` +
    `\n---\n` +
    `${(params.inputs || "").trim()}\n` +
    `\n---\n\n` +
    `## Approval required\n` +
    `No drop should be generated or applied until Dustin approves this recommendation.\n`;
}

const PILOT_C_PATHS = [
  "client/src/hooks/useAuth.ts",
  "client/src/lib/queryClient.ts",
  "client/src/components/timer-widget.tsx",
  "client/src/pages/productivity.tsx",
  "client/src/pages/mobile-time-tracking.tsx",
  "client/src/components/app-header.tsx",
  "client/src/components/QuickActionButton.tsx",
];

function ggContextEnabled(): boolean {
  const v = (process.env.RECOMMENDATION_GG_CONTEXT_ENABLED ?? "true").toLowerCase().trim();
  return v !== "0" && v !== "false" && v !== "off";
}

function looksLikePilotC(text: string): boolean {
  const t = (text || "").toLowerCase();
  const keywords = [
    "pilot c",
    "401",
    "unauthorized",
    "auth",
    "authready",
    "isauthed",
    "useauth",
    "queryclient",
    "react-query",
    "tanstack",
    "retry",
    "refetch",
    "poll",
    "polling",
    "interval",
    "spam",
    "query noise",
    "refetchonwindowfocus",
    "refetchonmount",
    "refetchinterval",
    "staletime",
    "logout",
    "expired",
    "token",
  ];
  return keywords.some((k) => t.includes(k));
}

function repoIsGigsterGarage(repoHint?: string): boolean {
  return (repoHint || "").toLowerCase().includes("gigstergarage");
}

export async function buildRecommendationWithRepoContext(params: {
  title?: string;
  inputs?: string;
  repoHint?: string;
  strategySessionId?: string | null;
}): Promise<string> {
  const base = buildRecommendation(params);

  const hintText = `${params.title || ""}\n${params.inputs || ""}`;
  if (!ggContextEnabled()) return base;
  if (!repoIsGigsterGarage(params.repoHint)) return base;
  if (!looksLikePilotC(hintText)) return base;

  if (!process.env.GIGSTER_GARAGE_BASE_URL || !process.env.GIGSTER_GARAGE_READONLY_TOKEN) return base;

  const fetched = await fetchGigsterGarageFiles(PILOT_C_PATHS, {
    perFileMaxChars: 18_000,
    totalMaxChars: 75_000,
  });

  const metaLine =
    `requested=${fetched.meta.requestedCount} returned=${fetched.meta.returnedCount} ` +
    `nonEmpty=${fetched.meta.nonEmptyCount} errors=${fetched.meta.errorCount} ` +
    `truncatedChars=${fetched.meta.truncatedTotalChars}`;

  const ctx =
    `\n\n---\n` +
    `## Read-only repo context (GigsterGarage)\n` +
    `**Source:** DreamTeamHub → GigsterGarage read-only connector\n` +
    `**Meta:** ${metaLine}\n\n` +
    `Use the file blocks below to propose *specific diffs* that stop 401 spam + query noise.\n\n` +
    `${formatGigsterFilesForPrompt(fetched.files)}\n`;

  return base + ctx;
}

export function buildDrop(params: {
  targetRepo: string;
  workItemId: string;
  recommendationText: string;
}): string {
  return `# Replit Drop (Non-executing)\n` +
    `# Target Repo: ${params.targetRepo}\n` +
    `# Source Work Item: ${params.workItemId}\n\n` +
    `# NOTE: Paste this into the ${params.targetRepo} repo manually.\n\n` +
    `FILE: README_DTH_DROP_${params.workItemId}.md\n` +
    `This drop was generated from DTH Work Item ${params.workItemId}.\n\n` +
    `Recommendation summary:\n` +
    `${params.recommendationText.slice(0, 1200)}\n\n` +
    `Next steps:\n- Identify the exact file(s) to patch in ${params.targetRepo}.\n- Replace this placeholder file with real FILE blocks once scope is confirmed.\n` +
    `END_FILE\n`;
}
