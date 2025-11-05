import { Badge } from "@/components/ui/badge";

export default function FindingsAtAGlance({ meta }: {
  meta?: {
    diagnostics?: string[];
    summary?: {
      overall?: string;
      buckets?: { low?: number; medium?: number; high?: number };
      top_risks?: { name: string; why: string }[];
      next_actions?: string[];
    }
  }
}) {
  const s = meta?.summary;
  if (!s) return null;

  const low = s.buckets?.low ?? 0;
  const med = s.buckets?.medium ?? 0;
  const high = s.buckets?.high ?? 0;

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">Findings at a glance</strong>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low {low}</Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Medium {med}</Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High {high}</Badge>
        </div>
      </div>

      {s.overall && <p className="text-sm text-muted-foreground mt-2">{s.overall}</p>}

      {!!(s.top_risks?.length) && (
        <div className="text-sm mt-3">
          <strong>Top risks</strong>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            {s.top_risks.slice(0, 5).map((r, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="font-medium text-foreground">{r.name}</span> — {r.why || "needs review"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!(s.next_actions?.length) && (
        <div className="text-sm mt-3">
          <strong>Next actions</strong>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            {s.next_actions.map((a, i) => (
              <li key={i} className="text-muted-foreground">{a}</li>
            ))}
          </ul>
        </div>
      )}

      {!!(meta?.diagnostics?.length) && (
        <p className="text-xs text-amber-600 mt-3">
          Diagnostics: {meta.diagnostics.join("; ")}
        </p>
      )}
    </div>
  );
}
