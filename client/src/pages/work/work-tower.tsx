import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Search, X } from "lucide-react";

type WorkItem = {
  id: string;
  title?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  targetContext?: any;
  target_context?: any;
  context?: any;
  cast?: any;
  assigned?: any;
};

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function toTitleCase(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isCompletedStatus(status?: string) {
  const s = (status || "").toLowerCase();
  if (!s) return false;
  return (
    s.includes("done") ||
    s.includes("complete") ||
    s.includes("completed") ||
    s.includes("closed") ||
    s.includes("cancel") ||
    s.includes("archiv")
  );
}

function normalizeTargetContext(w: WorkItem): any {
  const raw = w.targetContext ?? w.target_context ?? w.context ?? null;
  if (!raw) return null;
  if (typeof raw === "string") {
    const parsed = safeJsonParse(raw);
    return parsed ?? raw;
  }
  return raw;
}

function deriveContextChips(ctx: any): string[] {
  if (!ctx) return [];
  if (typeof ctx === "string") return [ctx];
  if (Array.isArray(ctx)) {
    return ctx
      .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
      .filter(Boolean)
      .slice(0, 8);
  }
  if (typeof ctx === "object") {
    const preferKeys = [
      "projectKey",
      "repo",
      "repoSlug",
      "repoName",
      "path",
      "pathPrefix",
      "env",
      "mode",
      "branch",
    ];
    const chips: string[] = [];
    for (const k of preferKeys) {
      if (k in ctx && ctx[k] != null && String(ctx[k]).trim() !== "") {
        const label =
          k === "repoSlug" || k === "repoName" || k === "repo"
            ? `Repo: ${ctx[k]}`
            : k === "projectKey"
              ? `Project: ${ctx[k]}`
              : k === "path" || k === "pathPrefix"
                ? `Path: ${ctx[k]}`
                : k === "env"
                  ? `Env: ${ctx[k]}`
                  : k === "mode"
                    ? `Mode: ${ctx[k]}`
                    : `${toTitleCase(k)}: ${ctx[k]}`;
        chips.push(label);
      }
      if (chips.length >= 4) break;
    }
    if (chips.length === 0) {
      const keys = Object.keys(ctx).slice(0, 4);
      for (const k of keys) {
        const v = ctx[k];
        if (v == null) continue;
        chips.push(`${toTitleCase(k)}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
      }
    }
    return chips;
  }
  return [];
}

function deriveCastInitials(w: WorkItem): string[] {
  const raw = w.cast ?? w.assigned ?? null;
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.members)
      ? raw.members
      : Array.isArray(raw?.cast)
        ? raw.cast
        : [];
  const names = list
    .map((x: any) => {
      if (!x) return "";
      if (typeof x === "string") return x;
      return x.handle || x.name || x.agent || x.pod || "";
    })
    .filter((s: string) => Boolean(s && s.trim()));
  return names.slice(0, 6).map((n: string) => {
    const parts = n.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (a + b).toUpperCase();
  });
}

export default function WorkTower() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialTab = (params.get("tab") || "active").toLowerCase();

  const [tab, setTab] = useState<"active" | "recent">(initialTab === "recent" ? "recent" : "active");
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("tab", tab);
    if (q.trim()) next.set("q", q.trim());
    const newUrl = `/work?${next.toString()}`;
    if (location !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [tab, q, location]);

  const { data: items = [], isLoading, error } = useQuery<WorkItem[]>({
    queryKey: ["/api/work-items"],
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byTab = items.filter((w) =>
      tab === "recent" ? isCompletedStatus(w.status) : !isCompletedStatus(w.status)
    );
    if (!needle) return byTab;
    return byTab.filter((w) => {
      const title = (w.title || "").toLowerCase();
      const status = (w.status || "").toLowerCase();
      const ctx = normalizeTargetContext(w);
      const ctxStr = typeof ctx === "string" ? ctx.toLowerCase() : JSON.stringify(ctx || "").toLowerCase();
      return (
        title.includes(needle) ||
        status.includes(needle) ||
        ctxStr.includes(needle) ||
        w.id.toLowerCase().includes(needle)
      );
    });
  }, [items, tab, q]);

  return (
    <div className="space-y-4 p-4" data-testid="work-tower-page">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Work</h1>
          <p className="text-sm text-muted-foreground">
            Active execution (Work Items). Target Context + Cast at-a-glance.
          </p>
        </div>
        <Link href="/intent">
          <Button size="sm" data-testid="button-new-work">
            <Plus className="mr-1 h-4 w-4" />
            New Work
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Button
            variant={tab === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("active")}
            data-testid="tab-active"
          >
            Active
          </Button>
          <Button
            variant={tab === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("recent")}
            data-testid="tab-recent"
          >
            Recent
          </Button>
        </div>

        <div className="flex w-full gap-2 md:w-[420px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, status, context, id…"
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          {q.trim() && (
            <Button variant="outline" size="sm" onClick={() => setQ("")} data-testid="button-clear-search">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <Card className="p-3">
          <p className="text-sm text-destructive">Failed to load work items</p>
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-12 gap-2 border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
          <div className="col-span-6">Work Item</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Target Context</div>
          <div className="col-span-1 text-right">Cast</div>
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="px-3 py-6 text-sm text-muted-foreground" data-testid="empty-state">
            No work items found.
          </div>
        )}

        {filtered.map((w) => {
          const ctx = normalizeTargetContext(w);
          const chips = deriveContextChips(ctx);
          const cast = deriveCastInitials(w);

          return (
            <Link key={w.id} href={`/work-items/${w.id}`}>
              <div
                className="grid cursor-pointer grid-cols-12 gap-2 px-3 py-3 text-sm hover:bg-muted/50"
                data-testid={`work-item-row-${w.id}`}
              >
                <div className="col-span-6">
                  <div className="font-medium">{w.title || "Untitled work item"}</div>
                  <div className="text-xs text-muted-foreground">{w.id}</div>
                </div>

                <div className="col-span-2">
                  <Badge variant="outline">{w.status ? toTitleCase(w.status) : "Unknown"}</Badge>
                </div>

                <div className="col-span-3 flex flex-wrap gap-1">
                  {chips.length ? (
                    <>
                      {chips.slice(0, 3).map((c, idx) => (
                        <Badge key={idx} variant="secondary" className="max-w-[200px] truncate">
                          {c}
                        </Badge>
                      ))}
                      {chips.length > 3 && <Badge variant="secondary">+{chips.length - 3}</Badge>}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No target set</span>
                  )}
                </div>

                <div className="col-span-1 flex justify-end gap-1">
                  {cast.length ? (
                    cast.slice(0, 3).map((c, idx) => (
                      <div
                        key={idx}
                        className="flex h-7 w-7 items-center justify-center rounded-full border text-xs"
                        title={c}
                      >
                        {c}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
