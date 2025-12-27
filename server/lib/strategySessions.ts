import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type StrategySessionStatus = "OPEN" | "LOCKED" | "ARCHIVED";

export type PodPresetKey = "default" | "gigsterGarage" | "tenantBilling";

export type StrategySession = {
  id: string;
  title: string;
  status: StrategySessionStatus;
  mode: "STRATEGY / BRAINSTORM (NON-EXECUTING)";
  author: string;
  approval_required_for_execution: boolean;
  repo_hint?: string;
  podPresetKey?: PodPresetKey;
  goal?: string;
  participants?: string[];
  questions?: string[];
  bodyMd: string;
  created_at: string;
  updated_at: string;
  locked_at?: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "strategy-sessions");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function nowISO() {
  return new Date().toISOString();
}

export function defaultStrategySessionBody(): string {
  return `TITLE: Dream Team Hub — Strategy Session v1.0 (Pre-Execution)

STATUS: OPEN
MODE: STRATEGY / BRAINSTORM (NON-EXECUTING)

AUTHOR: Dustin Sparks
APPROVAL_REQUIRED_FOR_EXECUTION: true

---

## PURPOSE

This Strategy Session exists to:
- Clarify intent before solutions
- Explore ideas, tradeoffs, and risks
- Refine *what problem we are actually solving*
- Prevent premature recommendations, code, or drops

This session is explicitly **non-executing**.

---

## SCOPE & RULES

Allowed:
- Brainstorming
- Debate and disagreement
- Option exploration
- Risk identification
- Clarifying questions
- Directional thinking

Not Allowed:
- Code drops
- Repo changes
- Replit handoff
- Shipping, ingest, or apply actions

No outputs from this session may be executed without an explicit **Strategy Lock** and subsequent approval.

---

## CONTEXT

Project / Repo:
- Gigster Garage (pilot candidate)

Goal:
- Define the correct workflow and boundaries for agents + repos doing real work together
- Ensure Dustin Sparks remains the sole approval authority
- Establish the clean separation between:
  Strategy -> Recommendations -> Execution

Constraints:
- Safety over speed
- No silent execution paths
- Human approval must be enforceable, not implied

---

## PARTICIPANTS (INVITED)

- OS (Orchestration)
- Forge (Architecture)
- LexiCode (Implementation realism)
- Lume (UX / flow)
- Sentinel (Risk & safety)
- Aegis (Governance / control points)
- Sparkster (Clarity of intent & language)

---

## QUESTIONS TO ADDRESS

1. What *must* happen before any recommendation or drop is allowed?
2. What is the minimum approval artifact that blocks execution?
3. Which tasks require a Strategy Session vs fast-path execution?
4. Where do Strategy Sessions end and Work Orders begin?
5. What information must survive as a permanent artifact?

---

## EXIT CRITERIA

This session remains OPEN until:
- A clear direction is agreed upon
- Dustin Sparks issues a **Strategy Lock**

Only after a Strategy Lock may recommendations or execution artifacts be created.
`;
}

export async function listStrategySessions(): Promise<StrategySession[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const sessions: StrategySession[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(DATA_DIR, f), "utf-8");
    try {
      sessions.push(JSON.parse(raw));
    } catch {
      // ignore corrupt file
    }
  }
  // newest first
  sessions.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  return sessions;
}

export async function getStrategySession(id: string): Promise<StrategySession | null> {
  await ensureDir();
  const p = path.join(DATA_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createStrategySession(input: Partial<StrategySession>): Promise<StrategySession> {
  await ensureDir();
  const id = input.id || crypto.randomBytes(8).toString("hex");
  const created_at = nowISO();
  const updated_at = created_at;
  const inferredPreset: PodPresetKey =
    input.podPresetKey ||
    ((input.repo_hint || "").toLowerCase().includes("gigster") ? "gigsterGarage" : "default");

  const session: StrategySession = {
    id,
    title: input.title || "Dream Team Hub — Strategy Session (Pre-Execution)",
    status: "OPEN",
    mode: "STRATEGY / BRAINSTORM (NON-EXECUTING)",
    author: input.author || "Dustin Sparks",
    approval_required_for_execution: input.approval_required_for_execution ?? true,
    repo_hint: input.repo_hint,
    podPresetKey: inferredPreset,
    goal: input.goal,
    participants: input.participants || [
      "OS",
      "Forge",
      "LexiCode",
      "Lume",
      "Sentinel",
      "Aegis",
      "Sparkster",
    ],
    questions: input.questions || [
      "What must happen before any recommendation or drop is allowed?",
      "What is the minimum approval artifact that blocks execution?",
      "Which tasks require a Strategy Session vs fast-path execution?",
      "Where do Strategy Sessions end and Work Orders begin?",
      "What information must survive as a permanent artifact?",
    ],
    bodyMd: input.bodyMd || defaultStrategySessionBody(),
    created_at,
    updated_at,
  };
  await fs.writeFile(path.join(DATA_DIR, `${id}.json`), JSON.stringify(session, null, 2), "utf-8");
  return session;
}

export async function updateStrategySession(id: string, patch: Partial<StrategySession>): Promise<StrategySession | null> {
  const existing = await getStrategySession(id);
  if (!existing) return null;

  const next: StrategySession = {
    ...existing,
    ...patch,
    id: existing.id,
    mode: "STRATEGY / BRAINSTORM (NON-EXECUTING)", // non-negotiable
    updated_at: nowISO(),
  };

  // Lock semantics
  if (patch.status === "LOCKED" && !existing.locked_at) {
    next.locked_at = nowISO();
  }

  await fs.writeFile(path.join(DATA_DIR, `${id}.json`), JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export async function deleteStrategySession(id: string): Promise<boolean> {
  await ensureDir();
  const p = path.join(DATA_DIR, `${id}.json`);
  try {
    await fs.unlink(p);
    return true;
  } catch {
    return false;
  }
}
