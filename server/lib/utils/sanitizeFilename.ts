// Replace unsafe characters, trim, collapse spaces/dots, enforce length, keep extension.
export function sanitizeFilename(input: string, maxLen = 100): string {
  if (!input) return "untitled.txt";
  const trimmed = input.trim();
  const parts = trimmed.split(".");
  const ext = parts.length > 1 ? parts.pop()! : "";
  const base = parts.join(".") || "untitled";
  // Remove characters not allowed on common filesystems
  let safeBase = base.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").replace(/^\.+|\.+$/g, "");
  // Collapse multiple dashes
  safeBase = safeBase.replace(/-{2,}/g, "-").trim();
  // Enforce length (reserve for dot + ext)
  const room = ext ? maxLen - (ext.length + 1) : maxLen;
  if (safeBase.length > room) safeBase = safeBase.slice(0, room).trim();
  const out = ext ? `${safeBase}.${ext}` : safeBase || "untitled";
  return out || "untitled";
}
