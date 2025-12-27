import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function extractStrategySessionId(workItem: any): string | null {
  if (!workItem) return null;

  // 1) Prefer structured context if present
  const ctxRaw =
    workItem.targetContext ??
    workItem.target_context ??
    workItem.context ??
    null;

  const ctx =
    typeof ctxRaw === "string" ? (safeJsonParse(ctxRaw) ?? ctxRaw) : ctxRaw;

  const fromCtx =
    ctx && typeof ctx === "object"
      ? (ctx.strategySessionId || ctx.strategy_session_id || null)
      : null;

  if (fromCtx && typeof fromCtx === "string") return fromCtx;

  // 2) Fall back to playbook/provenance string parsing
  const playbook = String(workItem.playbook || "");
  if (!playbook) return null;

  // Matches: **Source:** Strategy Session abc123
  const sourceMatch = playbook.match(/\*\*Source:\*\*\s*Strategy Session\s+([a-zA-Z0-9]+)/i);
  if (sourceMatch?.[1]) return sourceMatch[1];

  // Matches: strategySessionId: abc123 or "strategySessionId"="abc123"
  const m = playbook.match(/strategySessionId["']?\s*[:=]\s*["']?([a-z0-9]{6,})/i);
  if (m?.[1]) return m[1];

  // Matches embedded route "/strategy/<id>"
  const m2 = playbook.match(/\/strategy\/([a-z0-9]{6,})/i);
  if (m2?.[1]) return m2[1];

  return null;
}

export function StrategySeedBadge({ workItem }: { workItem: any }) {
  const strategyId = extractStrategySessionId(workItem);
  if (!strategyId) return null;

  return (
    <Link href={`/strategy/${strategyId}`}>
      <Badge 
        variant="outline" 
        className="cursor-pointer gap-1.5" 
        data-testid="badge-strategy-provenance"
      >
        <Lightbulb className="h-3 w-3" />
        Seeded from Strategy: {strategyId.slice(0, 8)}
      </Badge>
    </Link>
  );
}
