export type DropValidationResult = {
  ok: boolean;
  errors: string[];
};

const TOKEN_PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|PLACEHOLDER)\b|<placeholder>/i;
const STANDALONE_ELLIPSIS_LINE_RE = /^\s*(\.\.\.|…)\s*$/m;
const OMISSION_PHRASE_RE = /\b(omitted|snip|snipped|elided)\b/i;

function hasFileBlocks(text: string): boolean {
  return /^\s*FILE:\s+/m.test(text) && /^\s*END_FILE\s*$/m.test(text);
}
function hasNoPatchSection(text: string): boolean {
  return /##\s*No Patch Needed/i.test(text);
}
function hasBlockedSection(text: string): boolean {
  return /##\s*BLOCKED\s*—\s*Missing Evidence/i.test(text) || /##\s*BLOCKED\b/i.test(text);
}

export function validatePatchDropFormat(dropText: string): DropValidationResult {
  const errors: string[] = [];
  const text = (dropText || "").trim();

  if (!text) return { ok: false, errors: ["Drop is empty"] };

  // Always require these headers
  if (!/^Repo:\s*\S+/m.test(text)) errors.push(`Missing required header: "Repo: <RepoName>"`);
  if (!/Manual apply only/i.test(text)) errors.push(`Missing required line: "Manual apply only"`);
  if (!/Post-apply verification checklist/i.test(text)) errors.push(`Missing "Post-apply verification checklist" section`);

  const fileBlocks = hasFileBlocks(text);
  const noPatch = hasNoPatchSection(text);
  const blocked = hasBlockedSection(text);

  // Must be one of the valid modes
  if (!fileBlocks && !noPatch && !blocked) {
    errors.push(`Drop must include FILE blocks OR "No Patch Needed" section OR "BLOCKED — Missing Evidence" section`);
  }

  // Pairing rules only if FILE blocks exist
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

    if (STANDALONE_ELLIPSIS_LINE_RE.test(text) || OMISSION_PHRASE_RE.test(text)) {
      errors.push(`Drop appears to omit content (ellipsis/omitted/snipped). FILE blocks must contain full file text.`);
    }
  }

  // Placeholders forbidden always
  if (TOKEN_PLACEHOLDER_RE.test(text)) {
    errors.push(`Drop contains placeholder markers (TODO/TBD/FIXME/<placeholder>); must be fully concrete`);
  }

  return { ok: errors.length === 0, errors };
}
