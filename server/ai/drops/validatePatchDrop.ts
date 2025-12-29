export type DropValidationResult = {
  ok: boolean;
  errors: string[];
};

// Disallow explicit placeholder tokens anywhere.
const TOKEN_PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|PLACEHOLDER)\b|<placeholder>/i;

// Disallow standalone ellipsis lines (these are almost always "omitted content").
const STANDALONE_ELLIPSIS_LINE_RE = /^\s*(\.\.\.|…)\s*$/m;

// Disallow "... omitted ..." style truncation comments that the model sometimes emits
const OMISSION_PHRASE_RE = /\b(omitted|snip|snipped|elided)\b/i;

export function validatePatchDropFormat(dropText: string): DropValidationResult {
  const errors: string[] = [];
  const text = (dropText || "").trim();

  if (!text) return { ok: false, errors: ["Drop is empty"] };

  // Required header lines
  if (!/^Repo:\s*\S+/m.test(text)) errors.push(`Missing required header: "Repo: <RepoName>"`);
  if (!/Manual apply only/i.test(text)) errors.push(`Missing required line: "Manual apply only"`);

  // Must contain FILE blocks
  if (!/^\s*FILE:\s+/m.test(text)) errors.push(`No FILE blocks found (must include at least one "FILE: <path>" block)`);
  if (!/^\s*END_FILE\s*$/m.test(text)) errors.push(`No END_FILE markers found (each FILE block must end with END_FILE)`);

  // Pair FILE / END_FILE markers in order
  const lines = text.split(/\r?\n/);
  let openCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*FILE:\s+/.test(line)) openCount++;
    if (/^\s*END_FILE\s*$/.test(line)) openCount--;
    if (openCount < 0) {
      errors.push(`END_FILE without a matching FILE at line ${i + 1}`);
      openCount = 0;
    }
  }
  if (openCount !== 0) errors.push(`Unclosed FILE block(s): found FILE without matching END_FILE`);

  // Placeholder guardrails
  if (TOKEN_PLACEHOLDER_RE.test(text)) {
    errors.push(`Drop contains placeholder markers (TODO/TBD/FIXME/<placeholder>); must be fully concrete`);
  }
  if (STANDALONE_ELLIPSIS_LINE_RE.test(text) || OMISSION_PHRASE_RE.test(text)) {
    errors.push(`Drop appears to omit content (ellipsis/omitted/snipped). All FILE blocks must contain full file contents.`);
  }

  return { ok: errors.length === 0, errors };
}
