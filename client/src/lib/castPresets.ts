export type CastPresetKey = "default" | "gigsterGarage" | "tenantBilling";

export const DEFAULT_CAST: string[] = [
  "OS",
  "Forge",
  "LexiCode",
  "Lume",
  "Sentinel",
  "Aegis",
  "Sparkster",
];

// GigsterGarage Pilot Pod (expanded with SMEs)
export const GIGSTER_GARAGE_CAST: string[] = [
  "OS",
  "Lume",
  "Forge",
  "LexiCode",
  "CodeBlock",
  "Verifier",
  "Pulse",
  "Sentinel",
  "Praetor",
  "Aegis",
  "Archivist",
  "Conductor",
  "Scout",
  "Ledger",
  "Navi",
  "Amani",
  "ChieSan",
];

export const GIGSTER_GARAGE_CAST_OPTIONS: string[] = Array.from(
  new Set([
    ...GIGSTER_GARAGE_CAST,
    "Bridge",
    "Beacon",
    "Prism",
    "Echo",
    "Nova",
    "Storybloom",
  ])
).sort((a, b) => a.localeCompare(b));

// Tenant & Billing Pod (Revenue Systems)
export const TENANT_BILLING_CAST: string[] = [
  "OS",
  "Forge",
  "LexiCode",
  "Bridge",
  "Verifier",
  "Pulse",
  "Sentinel",
  "Praetor",
  "Aegis",
  "Archivist",
  "Ledger",
  "Navi",
];

export const TENANT_BILLING_CAST_OPTIONS: string[] = Array.from(
  new Set([
    ...TENANT_BILLING_CAST,
    "Conductor",
    "Scout",
    "Amani",
  ])
).sort((a, b) => a.localeCompare(b));

export const CAST_PRESETS: Record<
  CastPresetKey,
  { label: string; recommended: string[]; options: string[] }
> = {
  default: {
    label: "Default",
    recommended: DEFAULT_CAST,
    options: Array.from(new Set([...DEFAULT_CAST, "Storybloom", "Muse", "Scout", "Nova", "Prism", "Echo"])).sort(
      (a, b) => a.localeCompare(b)
    ),
  },
  gigsterGarage: {
    label: "GigsterGarage",
    recommended: GIGSTER_GARAGE_CAST,
    options: GIGSTER_GARAGE_CAST_OPTIONS,
  },
  tenantBilling: {
    label: "Tenant & Billing",
    recommended: TENANT_BILLING_CAST,
    options: TENANT_BILLING_CAST_OPTIONS,
  },
};

export function inferPresetFromRepoHint(repoHint?: string | null): CastPresetKey {
  const s = (repoHint || "").toLowerCase();
  if (s.includes("gigster")) return "gigsterGarage";
  if (s.includes("tenant") || s.includes("billing")) return "tenantBilling";
  return "default";
}

export function uniqSorted(list: string[]) {
  return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}
