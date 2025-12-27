export type ParsedCastReceipt = {
  targetContext?: string;
  mode?: string;
  autonomy?: string;
};

/**
 * Finds a --- delimited block containing "Cast Receipt" and returns it.
 */
export function extractCastReceiptBlock(description?: string | null): string | null {
  if (!description) return null;

  const re = /---\s*\n([\s\S]*?)\n---/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(description)) !== null) {
    const block = m[1]?.trim();
    if (block && /(^|\n)Cast Receipt(\n|$)/i.test(block)) return block;
  }

  return null;
}

function parseKeyLine(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const m = block.match(re);
  const v = m?.[1]?.trim();
  return v || undefined;
}

/**
 * Lightweight parse for the fields we need in UI surfaces.
 */
export function parseCastReceipt(description?: string | null): ParsedCastReceipt | null {
  const block = extractCastReceiptBlock(description);
  if (!block) return null;

  return {
    targetContext: parseKeyLine(block, "Target Context"),
    mode: parseKeyLine(block, "Mode"),
    autonomy: parseKeyLine(block, "Autonomy"),
  };
}

export function getTargetContext(description?: string | null): string | null {
  return parseCastReceipt(description)?.targetContext ?? null;
}
