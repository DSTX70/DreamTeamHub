import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Search, X } from "lucide-react";

import { toWorkItemRowModel, type WorkItemLike } from "@/lib/workItemView";

type Tab = "active" | "recent";

export default function WorkTower() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");

  const workItemsQuery = useQuery({
    queryKey: ["work-items"],
    queryFn: async () => {
      const res = await fetch("/api/work-items", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load work items (${res.status})`);
      const data = (await res.json()) as WorkItemLike[];
      return Array.isArray(data) ? data : [];
    },
  });

  const rows = useMemo(() => {
    const items = workItemsQuery.data ?? [];
    return items.map((w) => toWorkItemRowModel(w));
  }, [workItemsQuery.data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byTab = rows.filter((r) => (tab === "recent" ? r.isDone : !r.isDone));
    if (!needle) return byTab;

    return byTab.filter((r) => {
      const hay = [
        r.title,
        r.statusLabel,
        r.id,
        r.targetChips.join(" "),
        r.castInitials.join(" "),
      ]
        .join(" | ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, tab, q]);

  return (
    <div className="space-y-4 p-4" data-testid="work-tower-page">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Work</h1>
          <div className="text-sm text-muted-foreground">
            Active execution (Work Items). Templates live under Work Orders.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setLocation("/intent")} data-testid="button-new-work">
            <Plus className="mr-2 h-4 w-4" />
            New Work
          </Button>
        </div>
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

        <div className="flex w-full items-center gap-2 md:w-[440px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, status, context, id…"
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          {q.trim() ? (
            <Button variant="outline" size="sm" onClick={() => setQ("")} title="Clear search" data-testid="button-clear-search">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {workItemsQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : null}
      {workItemsQuery.error ? (
        <Card className="p-3 text-sm text-destructive">
          {(workItemsQuery.error as Error)?.message || "Failed to load work items"}
        </Card>
      ) : null}

      <div className="space-y-2">
        {filtered.length === 0 && !workItemsQuery.isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground" data-testid="empty-state">
            No work items found.
          </Card>
        ) : null}

        {filtered.map((vm) => (
          <Link key={vm.id} href={`/work-items/${vm.id}`}>
            <Card className="p-4 hover:bg-muted/40" data-testid={`work-item-row-${vm.id}`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-medium">{vm.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{vm.id}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Badge variant="outline">{vm.statusLabel}</Badge>

                  {vm.targetChips.length ? (
                    <>
                      {vm.targetChips.slice(0, 3).map((c, idx) => (
                        <Badge key={idx} variant="secondary" className="max-w-[260px] truncate">
                          {c}
                        </Badge>
                      ))}
                      {vm.targetChips.length > 3 ? (
                        <Badge variant="secondary">+{vm.targetChips.length - 3}</Badge>
                      ) : null}
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      No target set
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    {vm.castInitials.length ? (
                      vm.castInitials.slice(0, 3).map((c, idx) => (
                        <span
                          key={idx}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs"
                          title={c}
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
