export type DropValidationResult = {
  ok: boolean;
  errors: string[];
};

// Disallow explicit placeholder tokens anywhere.
const TOKEN_PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|PLACEHOLDER)\b|<placeholder>/i;

// Disallow standalone ellipsis lines (these are almost always "omitted content").
const STANDALONE_ELLIPSIS_LINE_RE = /^\s*(\.\.\.|…)\s*$/m;

// Disallow "omitted/snipped" phrases
const OMISSION_PHRASE_RE = /\b(omitted|snip|snipped|elided)\b/i;

function hasFileBlocks(text: string): boolean {
  return /^\s*FILE:\s+/m.test(text) && /^\s*END_FILE\s*$/m.test(text);
}

function hasNoPatchSection(text: string): boolean {
  return /##\s*No Patch Needed/i.test(text) || /\bNo Patch Needed\b/i.test(text);
}

export function validatePatchDropFormat(dropText: string): DropValidationResult {
  const errors: string[] = [];
  const text = (dropText || "").trim();

  if (!text) return { ok: false, errors: ["Drop is empty"] };

  // Required header lines (always)
  if (!/^Repo:\s*\S+/m.test(text)) errors.push(`Missing required header: "Repo: <RepoName>"`);
  if (!/Manual apply only/i.test(text)) errors.push(`Missing required line: "Manual apply only"`);

  // Must include a verification checklist section (always)
  if (!/Post-apply verification checklist/i.test(text)) {
    errors.push(`Missing "Post-apply verification checklist" section`);
  }

  const fileBlocks = hasFileBlocks(text);
  const noPatch = hasNoPatchSection(text);

  // Must be either a real patch drop (FILE blocks) OR a No Patch Needed drop (noPatch section)
  if (!fileBlocks && !noPatch) {
    errors.push(`Drop must include FILE blocks (FILE:/END_FILE) OR include a "No Patch Needed" section`);
  }

  // If it claims to be a patch (has FILE blocks), enforce pairing strictly
  if (fileBlocks) {
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

    // Omission guardrails (only strict for patch drops)
    if (STANDALONE_ELLIPSIS_LINE_RE.test(text) || OMISSION_PHRASE_RE.test(text)) {
      errors.push(`Drop appears to omit content (ellipsis/omitted/snipped). All FILE blocks must contain full file text.`);
    }
  }

  // Placeholder guardrails (always)
  if (TOKEN_PLACEHOLDER_RE.test(text)) {
    errors.push(`Drop contains placeholder markers (TODO/TBD/FIXME/<placeholder>); must be fully concrete`);
  }

  return { ok: errors.length === 0, errors };
}
