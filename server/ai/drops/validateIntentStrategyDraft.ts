export type DraftValidationResult = { ok: boolean; errors: string[] };

const TOKEN_PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|PLACEHOLDER)\b|<placeholder>/i;

const ALLOWED_PREFIXES = ["client/", "server/", "shared/", "docs/"] as const;

function isSafeRelativePath(p: string): boolean {
  if (!p || typeof p !== "string") return false;
  if (p.startsWith("/") || p.includes("..") || p.includes("\\") || p.includes("\0")) return false;
  return ALLOWED_PREFIXES.some((pref) => p.startsWith(pref));
}

function hasAllHeadings(block: string, headings: string[]): string[] {
  const missing: string[] = [];
  for (const h of headings) {
    const re = new RegExp(`^\\s*##\\s*${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "mi");
    if (!re.test(block)) missing.push(h);
  }
  return missing;
}

export function validateIntentStrategyDraft(payload: {
  intentBlock: string;
  strategyBlock: string;
  evidenceRequest: string;
  fileFetchPaths: string[];
}): DraftValidationResult {
  const errors: string[] = [];

  const intent = (payload.intentBlock || "").trim();
  const strategy = (payload.strategyBlock || "").trim();
  const evidence = (payload.evidenceRequest || "").trim();

  if (!intent) errors.push("intentBlock is empty");
  if (!strategy) errors.push("strategyBlock is empty");
  if (!evidence) errors.push("evidenceRequest is empty");

  if (TOKEN_PLACEHOLDER_RE.test(intent) || TOKEN_PLACEHOLDER_RE.test(strategy) || TOKEN_PLACEHOLDER_RE.test(evidence)) {
    errors.push("Draft contains placeholder markers (TODO/TBD/FIXME/<placeholder>)");
  }

  const intentMissing = hasAllHeadings(intent, ["Repro Steps", "Expected vs Actual", "Evidence Needed"]);
  if (intentMissing.length) errors.push(`intentBlock missing headings: ${intentMissing.join(", ")}`);

  const strategyMissing = hasAllHeadings(strategy, ["Scope Lock", "Files to Fetch", "Success Criteria"]);
  if (strategyMissing.length) errors.push(`strategyBlock missing headings: ${strategyMissing.join(", ")}`);

  const paths = Array.isArray(payload.fileFetchPaths) ? payload.fileFetchPaths : [];
  const bad = paths.filter((p) => !isSafeRelativePath(p));
  if (bad.length) {
    errors.push(`fileFetchPaths contains unsafe/invalid paths: ${bad.slice(0, 6).join(", ")}${bad.length > 6 ? "…" : ""}`);
  }

  return { ok: errors.length === 0, errors };
}
