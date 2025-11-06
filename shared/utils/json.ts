/**
 * Attempts to extract a JSON object from a text block.
 * 1) Looks for the first balanced {...}
 * 2) Falls back to fenced ```json blocks
 * 3) Validates with JSON.parse
 */
export function extractJson<T = any>(text: string): { ok: true; data: T } | { ok: false; error: string } {
  const fence = /```json\s*([\s\S]*?)```/i;
  const f = text.match(fence);
  let candidate = f ? f[1] : "";

  if (!candidate) {
    // naive curlies scan
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) candidate = text.slice(start, end + 1);
  }

  if (!candidate.trim()) return { ok: false, error: "No JSON block found" };

  try {
    const parsed = JSON.parse(candidate);
    return { ok: true, data: parsed };
  } catch (e: any) {
    return { ok: false, error: `Invalid JSON: ${e.message}` };
  }
}
