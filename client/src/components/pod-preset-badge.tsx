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

function inferFromText(text: string): PodPresetKey | null {
  const t = (text || "").toLowerCase();
  const tenantBillingHits = [
    "tenant", "multi-tenant", "multitenant", "billing", "stripe", "subscription",
    "invoice", "proration", "trial", "checkout", "entitlement", "plan", "metering", "webhook",
  ].some((k) => t.includes(k));
  if (tenantBillingHits) return "tenantBilling";
  const gigsterHits = ["gigster", "gigstergarage", "gigster garage"].some((k) => t.includes(k));
  if (gigsterHits) return "gigsterGarage";
  return null;
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

function buildSignalText(source: any): string {
  if (!source) return "";
  const repoHint = typeof source.repo_hint === "string" ? source.repo_hint : "";
  const title = typeof source.title === "string" ? source.title : "";
  const output = typeof source.output === "string" ? source.output : "";
  const playbook = typeof source.playbook === "string" ? source.playbook : "";
  return [repoHint, title, output, playbook].filter(Boolean).join(" ");
}

export function PodPresetBadge({ source, className }: { source: any; className?: string }) {
  const explicitKey = getExplicitKey(source);
  if (explicitKey && explicitKey !== "default") {
    return (
      <Badge variant="secondary" className={className} data-testid={`badge-pod-${explicitKey}`} title="Explicit pod preset">
        {labelFor(explicitKey)}
      </Badge>
    );
  }

  const signal = buildSignalText(source);
  const inferredKey = inferFromText(signal);
  if (inferredKey && inferredKey !== "default") {
    return (
      <Badge variant="secondary" className={className} data-testid={`badge-pod-${inferredKey}`} title="Pod inferred from keywords">
        {labelFor(inferredKey)}
      </Badge>
    );
  }

  return null;
}
