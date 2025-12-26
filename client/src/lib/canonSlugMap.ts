/**
 * Canonical slug map for known aliases.
 * Ensures deterministic routing + de-duped casting.
 */
export const CANON_SLUG_MAP: Record<string, string> = {
  // App Dev Guru
  agent_app_dev_guru: "agent_app_development_guru",

  // Izumi
  agent_izumi: "agent_izumi_takahashi",

  // Kaoru
  agent_kaoru: "agent_kaoru_arai",
};

export function toCanonSlug(slug: string): string {
  const s = (slug || "").trim();
  if (!s) return s;
  return CANON_SLUG_MAP[s] ?? s;
}

export function dedupeCanonSlugs(slugs: string[]): string[] {
  const canon = slugs
    .map(toCanonSlug)
    .map((x) => x.trim())
    .filter(Boolean);

  return Array.from(new Set(canon)).sort((a, b) => a.localeCompare(b));
}
