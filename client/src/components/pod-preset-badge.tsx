import { Badge } from "@/components/ui/badge";

type PodPresetKey = "gigsterGarage" | "tenantBilling";

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function inferFromText(text: string): PodPresetKey | null {
  const t = (text || "").toLowerCase();

  // Tenant/Billing gets priority if it appears
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

function labelFor(key: PodPresetKey): string {
  return key === "gigsterGarage" ? "GigsterGarage Pod" : "Tenant & Billing Pod";
}

function extractRepoHintFromAny(source: any): string {
  if (!source) return "";
  if (typeof source === "string") return source;

  // Strategy Session: repo_hint
  if (typeof source.repo_hint === "string") return source.repo_hint;

  // Work Item: targetContext/target_context/context variants
  const ctxRaw = source.targetContext ?? source.target_context ?? source.context ?? null;
  const ctx = typeof ctxRaw === "string" ? (safeJsonParse(ctxRaw) ?? null) : ctxRaw;
  if (ctx && typeof ctx === "object") {
    const v =
      ctx.repoHint ||
      ctx.repo_hint ||
      ctx.targetRepo ||
      ctx.target_repo ||
      ctx.repoSlug ||
      ctx.repo ||
      "";
    return typeof v === "string" ? v : "";
  }

  return "";
}

function buildSignalText(source: any): string {
  const repoHint = extractRepoHintFromAny(source);

  const title = typeof source?.title === "string" ? source.title : "";
  const output = typeof source?.output === "string" ? source.output : "";
  const playbook = typeof source?.playbook === "string" ? source.playbook : "";

  return [repoHint, title, output, playbook].filter(Boolean).join(" ");
}

export function PodPresetBadge({
  source,
  className,
}: {
  source: any;
  className?: string;
}) {
  const signal = buildSignalText(source);
  const key = inferFromText(signal);
  if (!key) return null;

  return (
    <Badge
      variant="secondary"
      className={className}
      data-testid={`badge-pod-${key}`}
      title="Curated pod selection inferred from repo hint / keywords"
    >
      {labelFor(key)}
    </Badge>
  );
}
