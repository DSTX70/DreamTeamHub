import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { PodPresetBadge } from "@/components/pod-preset-badge";

type StrategySession = {
  id: string;
  title: string;
  status: "OPEN" | "LOCKED" | "ARCHIVED";
  mode: string;
  author: string;
  approval_required_for_execution: boolean;
  participants?: string[];
  repo_hint?: string;
  created_at: string;
  updated_at: string;
  locked_at?: string;
};

export default function StrategyListPage() {
  const [, setLocation] = useLocation();

  const { data: sessions = [], isLoading, error } = useQuery<StrategySession[]>({
    queryKey: ["/api/strategy-sessions"],
    refetchInterval: 8000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/strategy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Dream Team Hub — Strategy Session v1.0 (Pre-Execution)",
          author: "Dustin Sparks",
          approval_required_for_execution: true,
          repo_hint: "Gigster Garage (pilot candidate)",
        }),
      });
      if (!res.ok) throw new Error(`Failed to create (${res.status})`);
      return (await res.json()) as StrategySession;
    },
    onSuccess: async (s) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      setLocation(`/strategy/${s.id}`);
    },
  });

  const counts = useMemo(() => {
    const open = sessions.filter((s) => s.status === "OPEN").length;
    const locked = sessions.filter((s) => s.status === "LOCKED").length;
    return { open, locked, total: sessions.length };
  }, [sessions]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle data-testid="text-strategy-title">Strategy Sessions</CardTitle>
              <CardDescription>
                Think in DTH. This space is <span className="font-medium">NON-EXECUTING</span> — no drops, no repo changes.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" data-testid="badge-open-count">Open: {counts.open}</Badge>
              <Badge variant="secondary" data-testid="badge-locked-count">Locked: {counts.locked}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Total sessions: <span className="font-medium" data-testid="text-total-count">{counts.total}</span>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-testid="button-new-session"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Strategy Session
          </Button>
        </CardContent>
      </Card>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
      {error ? <div className="rounded-md border p-3 text-sm">Failed to load strategy sessions.</div> : null}

      <div className="space-y-2">
        {sessions.map((s) => (
          <Link key={s.id} href={`/strategy/${s.id}`}>
            <Card className="p-4 hover-elevate" data-testid={`card-session-${s.id}`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-medium" data-testid={`text-title-${s.id}`}>{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.id} • {s.author}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={s.status === "OPEN" ? "default" : "secondary"} data-testid={`badge-status-${s.id}`}>{s.status}</Badge>
                  <Badge variant="outline">NON-EXECUTING</Badge>
                  <PodPresetBadge source={s} />
                  <Badge variant="secondary" data-testid={`badge-cast-${s.id}`}>
                    Cast: {s.participants?.length ?? 0}
                  </Badge>
                </div>
              </div>

              {s.participants?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.participants.slice(0, 3).map((p) => (
                    <Badge key={p} variant="outline">{p}</Badge>
                  ))}
                  {s.participants.length > 3 && (
                    <Badge variant="outline">+{s.participants.length - 3}</Badge>
                  )}
                </div>
              ) : null}
            </Card>
          </Link>
        ))}
        {sessions.length === 0 && !isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground" data-testid="card-empty-state">
            No Strategy Sessions yet. Create one to start a non-executing brainstorm.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
