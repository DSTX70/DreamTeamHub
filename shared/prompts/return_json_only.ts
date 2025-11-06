/**
 * Helper to encourage JSON-only responses from LLMs.
 * - Adds compact schema summary & anti-chatter constraints.
 */
export function buildJsonOnlyInstruction(schemaSummary: string) {
  return [
    "Return ONLY minified JSON that validates against this schema (no commentary, no code fences).",
    "If a field is optional, omit it when unknown; do not invent values.",
    "No trailing commas. No explanations. No markdown.",
    "Schema summary:",
    schemaSummary.trim(),
  ].join("\n");
}
