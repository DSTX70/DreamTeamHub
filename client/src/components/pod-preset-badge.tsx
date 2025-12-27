import { Badge } from "@/components/ui/badge";

type PodPresetKey = "default" | "gigsterGarage" | "tenantBilling";

function safeJsonParse(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

function normalize(k: any): PodPresetKey | null {
  const s = String(k || "").trim();
  if (!s) return null;
  if (s === "default") return "default";
  if (s === "gigsterGarage") return "gigsterGarage";
  if (s === "tenantBilling") return "tenantBilling";
  return null;
}

function labelFor(k: PodPresetKey): string {
  if (k === "gigsterGarage") return "GigsterGarage Pod";
  if (k === "tenantBilling") return "Tenant & Billing Pod";
  return "Default";
}

function getExplicitKey(source: any): PodPresetKey | null {
  if (!source) return null;
  const direct = normalize(source.podPresetKey || source.pod_preset_key);
  if (direct) return direct;

  const ctxRaw = source.targetContext ?? source.target_context ?? source.context ?? null;
  const ctx = typeof ctxRaw === "string" ? (safeJsonParse(ctxRaw) ?? null) : ctxRaw;
  const fromCtx = ctx && typeof ctx === "object" ? normalize(ctx.podPresetKey || ctx.pod_preset_key) : null;
  if (fromCtx) return fromCtx;

  const playbook = String(source.playbook || "");
  if (playbook) {
    const m = playbook.match(/\*\*Pod Preset:\*\*\s*([a-zA-Z0-9_-]+)/i);
    const m2 = playbook.match(/podPresetKey\s*[:=]\s*([a-zA-Z0-9_-]+)/i);
    const k = normalize(m?.[1] || m2?.[1]);
    if (k) return k;
  }
  return null;
}

function inferLegacyKeyFromText(text: string): PodPresetKey | null {
  const t = (text || "").toLowerCase();

  const tenantBillingHits = [
    "tenant",
    "multi-tenant",
    "multitenant",
    "billing",
    "stripe",
    "subscription",
    "invoice",
    "proration",
    "trial",
    "checkout",
    "entitlement",
    "plan",
    "metering",
    "webhook",
  ].some((k) => t.includes(k));
  if (tenantBillingHits) return "tenantBilling";

  const gigsterHits = ["gigster", "gigstergarage", "gigster garage"].some((k) => t.includes(k));
  if (gigsterHits) return "gigsterGarage";

  return null;
}

function buildLegacySignalText(source: any): string {
  if (!source) return "";
  const parts: string[] = [];

  if (typeof source.repo_hint === "string") parts.push(source.repo_hint);

  const ctxRaw = source.targetContext ?? source.target_context ?? source.context ?? null;
  if (typeof ctxRaw === "string") parts.push(ctxRaw);
  else if (ctxRaw && typeof ctxRaw === "object") parts.push(JSON.stringify(ctxRaw));

  if (typeof source.title === "string") parts.push(source.title);
  if (typeof source.output === "string") parts.push(source.output);
  if (typeof source.playbook === "string") parts.push(source.playbook);

  return parts.join(" ");
}

export function PodPresetBadge({ source, className }: { source: any; className?: string }) {
  let key = getExplicitKey(source);

  if (!key) {
    key = inferLegacyKeyFromText(buildLegacySignalText(source));
  }

  if (!key || key === "default") return null;
  return (
    <Badge variant="secondary" className={className} data-testid={`badge-pod-${key}`} title={key === getExplicitKey(source) ? "Explicit pod preset" : "Pod inferred from keywords"}>
      {labelFor(key)}
    </Badge>
  );
}
