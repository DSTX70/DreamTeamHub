import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });

function fmtNum(v: any) {
  if (v === "—" || v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return nf.format(Number(v));
}

interface CopilotPanelProps {
  admin?: boolean;
  customGptUrl?: string;
}

export default function CopilotPanel({ admin = false, customGptUrl }: CopilotPanelProps) {
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  async function run(tool: string, params: any = {}) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/copilot/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool, params }),
      });
      
      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData?.error?.message || `HTTP ${r.status}`);
      }
      
      const data = await r.json();
      setOut(data);
      return data;
    } catch (error: any) {
      setErr(error.message);
      setOut(null);
    } finally {
      setBusy(false);
    }
  }

  const fetchAgents = (nextOffset = offset, nextLimit = limit, extra: any = {}) =>
    run("getAgentSummaries", { limit: nextLimit, offset: nextOffset, ...extra }).then(() => {
      setLimit(nextLimit);
      setOffset(nextOffset);
    });

  const fetchRoles = (nextOffset = offset, nextLimit = limit) =>
    run("listRoles", { limit: nextLimit, offset: nextOffset }).then(() => {
      setLimit(nextLimit);
      setOffset(nextOffset);
    });

  const total = Number(out?.meta?.total ?? 0);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Agent Lab Copilot</CardTitle>
          </div>
          {admin && customGptUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(customGptUrl, "_blank")}
              data-testid="button-open-custom-gpt"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Custom GPT
            </Button>
          )}
        </div>
        <CardDescription className="text-muted-foreground">
          Quick actions to explore roles and agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("smokeTest")}
            disabled={busy}
            data-testid="button-smoke-test"
          >
            Smoke Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, limit)}
            disabled={busy}
            data-testid="button-agents"
          >
            Agents
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, 25)}
            disabled={busy}
            data-testid="button-agents-25"
          >
            Agents (25)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, 50)}
            disabled={busy}
            data-testid="button-agents-50"
          >
            Agents (50)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgents(0, limit, { q: "router" })}
            disabled={busy}
            data-testid="button-search-router"
          >
            Search "router"
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRoles(0, limit)}
            disabled={busy}
            data-testid="button-roles"
          >
            Roles
          </Button>

          {/* Pagination Controls */}
          {out?.type === "table" && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                count: {total || (out.meta?.count ?? 0)} • limit:
              </span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  const next = Number(value);
                  if (out.meta?.isAgentSummary) {
                    fetchAgents(0, next);
                  } else {
                    fetchRoles(0, next);
                  }
                }}
                disabled={busy}
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
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev || busy}
                onClick={() => {
                  const newOffset = Math.max(0, offset - limit);
                  if (out.meta?.isAgentSummary) {
                    fetchAgents(newOffset, limit);
                  } else {
                    fetchRoles(newOffset, limit);
                  }
                }}
                data-testid="button-prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext || busy}
                onClick={() => {
                  const newOffset = offset + limit;
                  if (out.meta?.isAgentSummary) {
                    fetchAgents(newOffset, limit);
                  } else {
                    fetchRoles(newOffset, limit);
                  }
                }}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {busy && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error Message */}
        {err && !busy && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        {/* Smoke Test Results */}
        {out?.type === "text" && !busy && (
          <div className="rounded-lg border bg-card p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-white [&_p]:text-white [&_strong]:text-white [&_em]:text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: out.text.replace(/\n/g, '<br />') }} />
            </div>
          </div>
        )}

        {/* Table Results */}
        {out?.type === "table" && !busy && (
          <div className="space-y-3">
            <div className="overflow-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {out.columns.map((c: string) => (
                      <th
                        key={c}
                        className={`p-2 border-b text-xs font-medium ${
                          ["success_pct", "p95_s", "cost_usd", "next_gate"].includes(c)
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {out.rows.map((row: any[], i: number) => {
                    if (out.meta?.isAgentSummary) {
                      const [name, level, status, next_gate, success_pct, p95_s, cost_usd] = row;
                      return (
                        <tr key={i} className="hover-elevate" data-testid={`row-agent-${i}`}>
                          <td className="p-2 border-b text-xs">{name}</td>
                          <td className="p-2 border-b">
                            <Badge variant="outline" className="text-xs">
                              {level}
                            </Badge>
                          </td>
                          <td className="p-2 border-b">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                status === "live"
                                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                  : status === "pilot"
                                  ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                                  : "bg-muted"
                              }`}
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="p-2 border-b text-right text-xs">{fmtNum(next_gate)}</td>
                          <td className="p-2 border-b text-right text-xs">
                            {typeof success_pct === "number" ? `${Math.round(success_pct)}%` : "—"}
                          </td>
                          <td className="p-2 border-b text-right text-xs">{fmtNum(p95_s)}</td>
                          <td className="p-2 border-b text-right text-xs">
                            {typeof cost_usd === "number" ? `$${nf.format(cost_usd)}` : "—"}
                          </td>
                        </tr>
                      );
                    } else {
                      // Roles table
                      return (
                        <tr key={i} className="hover-elevate" data-testid={`row-role-${i}`}>
                          {row.map((cell: any, j: number) => (
                            <td key={j} className="p-2 border-b text-xs">
                              {cell ?? "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>

            {/* Diagnostics Footer */}
            {out.meta?.diagnostics?.length ? (
              <div className="text-xs text-amber-600 dark:text-amber-500 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-2">
                <strong>Diagnostics:</strong> {out.meta.diagnostics.join("; ")}
              </div>
            ) : null}
          </div>
        )}

        {/* Status Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Read-only
            </Badge>
            <span>Powered by OpenAI</span>
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
      </CardContent>
    </Card>
  );
}
