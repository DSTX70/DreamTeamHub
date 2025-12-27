/**
 * Work Item view normalizer (UI only).
 * Goal: consistent, future-proof rendering for:
 *  - status (Active vs Recent)
 *  - Target Context chips
 *  - Cast badges/initials
 *
 * This file intentionally tolerates multiple backend shapes without schema changes.
 */

export type WorkItemLike = {
  id: string;
  title?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;

  // common variants seen over time
  targetContext?: any;
  target_context?: any;
  context?: any;

  cast?: any;
  assigned?: any;
};

export type WorkItemRowModel = {
  id: string;
  title: string;
  statusLabel: string;
  isDone: boolean;
  targetChips: string[];
  castInitials: string[];
};

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function toTitleCase(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isDoneStatus(status?: string) {
  const s = (status || "").toLowerCase();
  if (!s) return false;
  return (
    s.includes("done") ||
    s.includes("complete") ||
    s.includes("completed") ||
    s.includes("closed") ||
    s.includes("cancel") ||
    s.includes("archiv")
  );
}

export function normalizeTargetContext(w: WorkItemLike): any {
  const raw = w.targetContext ?? w.target_context ?? w.context ?? null;
  if (!raw) return null;
  if (typeof raw === "string") return safeJsonParse(raw) ?? raw;
  return raw;
}

export function getTargetContextChips(ctx: any): string[] {
  if (!ctx) return [];
  if (typeof ctx === "string") return [ctx];

  if (Array.isArray(ctx)) {
    return ctx
      .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof ctx === "object") {
    const preferKeys = [
      "projectKey",
      "repo",
      "repoSlug",
      "repoName",
      "path",
      "pathPrefix",
      "env",
      "mode",
      "branch",
    ];

    const chips: string[] = [];
    for (const k of preferKeys) {
      if (!(k in ctx)) continue;
      const v = ctx[k];
      if (v == null || String(v).trim() === "") continue;

      const label =
        k === "repoSlug" || k === "repoName" || k === "repo"
          ? `Repo: ${v}`
          : k === "projectKey"
            ? `Project: ${v}`
            : k === "path" || k === "pathPrefix"
              ? `Path: ${v}`
              : k === "env"
                ? `Env: ${v}`
                : k === "mode"
                  ? `Mode: ${v}`
                  : `${toTitleCase(k)}: ${typeof v === "string" ? v : JSON.stringify(v)}`;

      chips.push(label);
      if (chips.length >= 4) break;
    }

    if (chips.length === 0) {
      for (const k of Object.keys(ctx).slice(0, 4)) {
        const v = ctx[k];
        if (v == null) continue;
        chips.push(`${toTitleCase(k)}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
      }
    }

    return chips;
  }

  return [];
}

export function getCastInitials(w: WorkItemLike): string[] {
  const raw = w.cast ?? w.assigned ?? null;
  if (!raw) return [];

  const list =
    Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.members)
        ? raw.members
        : Array.isArray(raw?.cast)
          ? raw.cast
          : [];

  const names = list
    .map((x: any) => {
      if (!x) return "";
      if (typeof x === "string") return x;
      return x.handle || x.name || x.agent || x.pod || "";
    })
    .filter((s: string) => Boolean(s && s.trim()));

  return names.slice(0, 6).map((n: string) => {
    const parts = n.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (a + b).toUpperCase();
  });
}

export function toWorkItemRowModel(w: WorkItemLike): WorkItemRowModel {
  const ctx = normalizeTargetContext(w);
  const chips = getTargetContextChips(ctx);
  const cast = getCastInitials(w);
  const done = isDoneStatus(w.status);

  return {
    id: w.id,
    title: w.title || "Untitled work item",
    statusLabel: w.status ? toTitleCase(w.status) : "Unknown",
    isDone: done,
    targetChips: chips,
    castInitials: cast,
  };
}
