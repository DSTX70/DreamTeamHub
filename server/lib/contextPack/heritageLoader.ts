import { readFile } from "node:fs/promises";
import path from "node:path";

export type HeritagePod = {
  podKey: string;
  name: string;
  purpose?: string;
  scope?: string[];
  members?: Array<{
    handle: string;
    role?: string;
    tone?: string;
    coreFunctions?: string[];
    definitionOfDone?: string[];
  }>;
  activationRules?: string[];
  guardrails?: string[];
};

export type HeritageAgent = {
  agentKey: string;
  name: string;
  type?: string;
  autonomy?: "L0" | "L1" | "L2" | "L3";
  capabilities?: string[];
  boundaries?: string[];
  preferredInputs?: string[];
  expectedOutputs?: string[];
  qualityBar?: string[];
};

export type HeritageSkill = {
  skillKey: string;
  name: string;
  description?: string;
  levels?: Record<string, string>;
  guardrails?: string[];
  patterns?: { do?: string[]; dont?: string[] };
  evidenceLinks?: Array<{ evidenceId: string; label: string; location: string }>;
};

export type HeritagePack = {
  pods: HeritagePod[];
  agents: HeritageAgent[];
  skills: HeritageSkill[];
  decisionLogText: string;
  heritagePackText: string;
};

export type HeritageContextQuery = {
  podKeys?: string[];
  agentKeys?: string[];
  skillKeys?: string[];
  maxChars?: number;
};

const DEFAULT_MAX_CHARS = 12_000;

async function safeJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function loadHeritagePack(repoRoot = process.cwd()): Promise<HeritagePack> {
  const base = path.join(repoRoot, "canon", "heritage");

  const podsJson = await safeJson<{ pods: HeritagePod[] }>(path.join(base, "pods.json"));
  const agentsJson = await safeJson<{ agents: HeritageAgent[] }>(path.join(base, "agents.json"));
  const skillsJson = await safeJson<{ skills: HeritageSkill[] }>(path.join(base, "skills.json"));

  const decisionLogText = await readFile(path.join(base, "decision-log.md"), "utf-8");
  const heritagePackText = await readFile(path.join(base, "HeritagePack.v1.0.md"), "utf-8");

  return {
    pods: podsJson.pods ?? [],
    agents: agentsJson.agents ?? [],
    skills: skillsJson.skills ?? [],
    decisionLogText,
    heritagePackText,
  };
}

export function buildHeritageContextSnippet(pack: HeritagePack, q: HeritageContextQuery = {}): string {
  const maxChars = q.maxChars ?? DEFAULT_MAX_CHARS;

  const pods =
    q.podKeys?.length
      ? pack.pods.filter((p) => q.podKeys!.includes(p.podKey))
      : pack.pods;
  const agents =
    q.agentKeys?.length
      ? pack.agents.filter((a) => q.agentKeys!.includes(a.agentKey))
      : pack.agents;
  const skills =
    q.skillKeys?.length
      ? pack.skills.filter((s) => q.skillKeys!.includes(s.skillKey))
      : pack.skills;

  const snippet =
    `Confidential and proprietary and copyright Dustin Sparks 2025\n\n` +
    `# Heritage Context\n\n` +
    `## Pods\n` +
    `${pods.map((p) => `- ${p.name} (${p.podKey})`).join("\n")}\n\n` +
    `## Agents\n` +
    `${agents.map((a) => `- ${a.name} (${a.agentKey})`).join("\n")}\n\n` +
    `## Skills\n` +
    `${skills.map((s) => `- ${s.name} (${s.skillKey})`).join("\n")}\n\n` +
    `## Locked Decisions (excerpt)\n` +
    `${pack.decisionLogText}\n`;

  if (snippet.length <= maxChars) return snippet;
  return snippet.slice(0, maxChars) + "\n\n[TRUNCATED: prompt budget cap]\n";
}
