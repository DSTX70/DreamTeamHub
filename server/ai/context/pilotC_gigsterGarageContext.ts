import { fetchGigsterGarageFiles, formatGigsterFilesForPrompt } from "../../services/connectors/gigsterGarageReadonly";

const PILOT_C_PATHS = [
  "client/src/hooks/useAuth.ts",
  "client/src/lib/queryClient.ts",
  "client/src/components/timer-widget.tsx",
  "client/src/pages/productivity.tsx",
  "client/src/pages/mobile-time-tracking.tsx",
  "client/src/components/app-header.tsx",
  "client/src/components/QuickActionButton.tsx",
];

function envEnabled(): boolean {
  const v = (process.env.PILOTC_GG_CONTEXT_ENABLED ?? "true").toLowerCase().trim();
  return v !== "0" && v !== "false" && v !== "off";
}

export function shouldAttachPilotCContext(hintText: string): boolean {
  const t = (hintText || "").toLowerCase();

  const keywords = [
    "pilot c",
    "401",
    "unauthorized",
    "authready",
    "isauthed",
    "useauth",
    "queryclient",
    "react-query",
    "tanstack",
    "retry",
    "refetch",
    "poll",
    "polling",
    "interval",
    "spam",
    "query noise",
    "staletime",
    "refetchonwindowfocus",
    "refetchonmount",
    "refetchinterval",
    "onerror",
    "logout",
    "expired",
    "token",
    "gigstergarage",
  ];

  const pathHints = PILOT_C_PATHS.map((p) => p.toLowerCase());

  return keywords.some((k) => t.includes(k)) || pathHints.some((p) => t.includes(p));
}

export async function buildPilotCGigsterGarageContextBlock(): Promise<string> {
  if (!envEnabled()) return "";

  if (!process.env.GIGSTER_GARAGE_BASE_URL || !process.env.GIGSTER_GARAGE_READONLY_TOKEN) {
    return "";
  }

  const fetched = await fetchGigsterGarageFiles(PILOT_C_PATHS, {
    perFileMaxChars: 18_000,
    totalMaxChars: 75_000,
  });

  const header =
    `\n\n` +
    `====================\n` +
    `READ-ONLY CONTEXT — GigsterGarage (Pilot C)\n` +
    `Source: connector fetch (token-protected)\n` +
    `Notes: Large files may be blocked by upstream limits; errors are included as ERROR blocks.\n` +
    `====================\n\n`;

  const body = formatGigsterFilesForPrompt(fetched.files);

  const footer =
    `\n\n` +
    `====================\n` +
    `END READ-ONLY CONTEXT — GigsterGarage (Pilot C)\n` +
    `Meta: requested=${fetched.meta.requestedCount} returned=${fetched.meta.returnedCount} nonEmpty=${fetched.meta.nonEmptyCount} errors=${fetched.meta.errorCount} truncatedChars=${fetched.meta.truncatedTotalChars}\n` +
    `====================\n\n`;

  return header + body + footer;
}

export function buildPilotCHintText(args: any): string {
  try {
    const parts: string[] = [];
    if (args?.skillName) parts.push(String(args.skillName));
    if (args?.skillId) parts.push(String(args.skillId));
    if (args?.packTitle) parts.push(String(args.packTitle));
    if (args?.workItemTitle) parts.push(String(args.workItemTitle));
    if (args?.intent) parts.push(String(args.intent));
    if (args?.input) parts.push(typeof args.input === "string" ? args.input : JSON.stringify(args.input));
    if (args?.prompt) parts.push(String(args.prompt));
    return parts.join("\n");
  } catch {
    return "";
  }
}

export async function maybeAugmentUserPromptWithPilotCContext(
  userPrompt: string,
  metaForHints: any
): Promise<string> {
  const hintText = buildPilotCHintText({ ...metaForHints, input: userPrompt });
  if (!shouldAttachPilotCContext(hintText)) return userPrompt;

  const ctx = await buildPilotCGigsterGarageContextBlock();
  if (!ctx) return userPrompt;

  return userPrompt + "\n\n" + ctx;
}
