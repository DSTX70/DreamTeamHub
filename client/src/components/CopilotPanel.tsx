import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * CopilotPanel
 * - Real pagination (limit/offset) + quick page-size buttons
 * - Readable numeric formatting + status/level badges
 * - Summary of Findings card under the table (uses meta.summary from /copilot/ask)
 * - Works with tools: smokeTest, getAgentSummaries, listRoles, getRoleByHandle
 */

type TableOut = {
  type: "table";
  columns: string[];
  rows: any[][];
  meta?: {
    count?: number;
    total?: number;
    limit?: number;
    offset?: number;
    isAgentSummary?: boolean;
    diagnostics?: string[];
    summary?: {
      overall?: string;
      stats?: { avg_success_pct?: number | string; avg_p95_s?: number | string; median_cost_usd?: number | string };
      buckets?: { low?: number; medium?: number; high?: number };
      top_risks?: { name: string; why: string }[];
      next_actions?: string[];
    };
  };
};

type SmokeOut = {
  result: string;
  diagnostics: Record<string, any>;
  summary?: string;
};

type JsonOut = { type: "json"; item: unknown };

type AnyOut = TableOut | SmokeOut | JsonOut | null;

async function postAsk(tool: string, params: any = {}) {
  const r = await fetch("/copilot/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool, params }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
function fmtNum(v: any) {
  if (v === "—" || v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return nf.format(Number(v));
}
function isNumberLike(v: any) {
  return v !== "—" && v !== null && v !== undefined && Number.isFinite(Number(v));
}

function SummaryCard({ meta }: { meta?: TableOut["meta"] }) {
  if (!meta?.summary) return null;
  const s = meta.summary;
  const low = s.buckets?.low ?? 0;
  const med = s.buckets?.medium ?? 0;
  const high = s.buckets?.high ?? 0;

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">Summary of Findings</strong>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low {low}</Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Medium {med}</Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High {high}</Badge>
            </div>
          </div>

          {s.overall && <p className="text-sm text-muted-foreground">{s.overall}</p>}

          {s.stats && (
            <p className="text-sm text-muted-foreground">
              <strong>Key stats:</strong>{" "}
              avg success {isNumberLike(s.stats.avg_success_pct) ? `${s.stats.avg_success_pct}%` : "—"} · p95{" "}
              {isNumberLike(s.stats.avg_p95_s) ? `${s.stats.avg_p95_s}s` : "—"} · median cost $
              {isNumberLike(s.stats.median_cost_usd) ? s.stats.median_cost_usd : "—"}
            </p>
          )}

          {!!(s.top_risks && s.top_risks.length) && (
            <div className="text-sm">
              <strong>Top risks:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {s.top_risks.slice(0, 5).map((r, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{r.name}</span> — {r.why || "needs review"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!(s.next_actions && s.next_actions.length) && (
            <div className="text-sm">
              <strong>Next actions:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {s.next_actions.map((a, i) => (
                  <li key={i} className="text-muted-foreground">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {!!(meta.diagnostics && meta.diagnostics.length) && (
            <p className="text-xs text-amber-600">
              Diagnostics: {meta.diagnostics.join("; ")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CopilotPanel({ admin = false, customGptUrl }: { admin?: boolean; customGptUrl?: string }) {
  const [out, setOut] = useState<AnyOut>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  const run = async (tool: string, params: Record<string, any> = {}) => {
    setErr(null);
    setLoading(true);
    try {
      const data = await postAsk(tool, params);
      setOut(data);
      return data;
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async (nextOffset = offset, nextLimit = limit, extra: any = {}) => {
    await run("getAgentSummaries", { limit: nextLimit, offset: nextOffset, ...extra });
    setLimit(nextLimit);
    setOffset(nextOffset);
  };

  const fetchRoles = async (nextOffset = offset, nextLimit = limit) => {
    await run("listRoles", { limit: nextLimit, offset: nextOffset });
    setLimit(nextLimit);
    setOffset(nextOffset);
  };

  const meta = (out as TableOut)?.meta;
  const total = Number(meta?.total ?? 0);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const renderTable = (payload: TableOut) => {
    const isAgentTable = payload.meta?.isAgentSummary;
    const numericCols = new Set(["success_pct", "p95_s", "cost_usd", "next_gate"]);

    return (
      <div className="space-y-3">
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {payload.columns.map((c) => (
                  <th
                    key={c}
                    className={`px-3 py-2 font-medium ${numericCols.has(c) ? "text-right" : "text-left"}`}
                  >
                    {c.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row, i) => {
                if (isAgentTable) {
                  const [name, level, status, next_gate, success_pct, p95_s, cost_usd] = row;
                  return (
                    <tr key={i} className="border-b hover-elevate" data-testid={`row-agent-${i}`}>
                      <td className="px-3 py-2">{String(name)}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {String(level)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={
                            status === "live"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : status === "pilot"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : ""
                          }
                        >
                          {String(status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">{fmtNum(next_gate)}</td>
                      <td className="px-3 py-2 text-right">
                        {isNumberLike(success_pct) ? `${Math.round(Number(success_pct))}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{fmtNum(p95_s)}</td>
                      <td className="px-3 py-2 text-right">
                        {isNumberLike(cost_usd) ? `$${fmtNum(cost_usd)}` : "—"}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={i} className="border-b hover-elevate" data-testid={`row-role-${i}`}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-3 py-2 ${numericCols.has(payload.columns[j]) ? "text-right" : ""}`}
                      >
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Showing {meta?.count ?? 0} of {meta?.total ?? 0}</span>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span>Limit:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                const next = Number(val);
                if (isAgentTable) {
                  fetchAgents(0, next);
                } else {
                  fetchRoles(0, next);
                }
              }}
            >
              <SelectTrigger className="w-20 h-8" data-testid="select-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => {
                const nextOffset = Math.max(0, offset - limit);
                if (isAgentTable) {
                  fetchAgents(nextOffset, limit);
                } else {
                  fetchRoles(nextOffset, limit);
                }
              }}
              data-testid="button-prev"
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => {
                if (isAgentTable) {
                  fetchAgents(offset + limit, limit);
                } else {
                  fetchRoles(offset + limit, limit);
                }
              }}
              data-testid="button-next"
            >
              Next →
            </Button>
          </div>
        </div>

        <SummaryCard meta={payload.meta} />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Agent Lab Copilot</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Query roles and agents using quick actions
            </p>
          </div>
          {customGptUrl && !admin && (
            <button
              onClick={() => window.open(customGptUrl, "_blank")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              data-testid="link-open-chatgpt"
            >
              <ExternalLink className="h-3 w-3" />
              Open in ChatGPT
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("smokeTest")}
            disabled={loading}
            data-testid="button-smoke-test"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Smoke Test"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, limit)}
            disabled={loading}
            data-testid="button-agents"
          >
            Agents
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, 25)}
            disabled={loading}
            data-testid="button-agents-25"
          >
            Agents (25)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, 50)}
            disabled={loading}
            data-testid="button-agents-50"
          >
            Agents (50)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, limit, { q: "router" })}
            disabled={loading}
            data-testid="button-search-router"
          >
            Search "router"
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRoles(0, limit)}
            disabled={loading}
            data-testid="button-roles"
          >
            Roles
          </Button>
        </div>

        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && (out as TableOut)?.type === "table" && renderTable(out as TableOut)}

        {!loading && out && "result" in (out as SmokeOut) && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <strong className="text-sm">Smoke Test:</strong>
                <Badge
                  variant="outline"
                  className={
                    (out as SmokeOut).result === "Green"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  {(out as SmokeOut).result}
                </Badge>
              </div>
              {(out as SmokeOut).summary && (
                <p className="text-sm text-muted-foreground">{(out as SmokeOut).summary}</p>
              )}
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                {JSON.stringify((out as SmokeOut).diagnostics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {!loading && (out as JsonOut)?.type === "json" && (
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
            {JSON.stringify((out as JsonOut).item, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
