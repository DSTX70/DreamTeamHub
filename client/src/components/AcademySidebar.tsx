import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, TrendingUp } from "lucide-react";

type AgentLite = {
  id: string;
  name: string;
  autonomy: "L0" | "L1" | "L2" | "L3";
  status: "pilot" | "live" | "watch" | "rollback";
  nextGate?: number | null;
};

export default function AcademySidebar({
  agent,
  onTrainClick,
  onPromote,
}: {
  agent: AgentLite;
  onTrainClick?: (agentId: string) => void;
  onPromote?: (agentId: string) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const nextGate = typeof agent.nextGate === "number" ? agent.nextGate : undefined;

  const promote = async () => {
    if (!onPromote || busy) return;
    setBusy(true);
    try {
      await onPromote(agent.id);
    } finally {
      setBusy(false);
    }
  };

  const statusColor = {
    pilot: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    live: "bg-green-500/10 text-green-700 dark:text-green-400",
    watch: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    rollback: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>Academy</CardTitle>
          </div>
        </div>
        <CardDescription>Training & Promotion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Agent</span>
            <span className="font-medium text-sm">{agent.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Level</span>
            <Badge variant="outline">{agent.autonomy}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={statusColor[agent.status]}>{agent.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next Gate</span>
            <Badge variant="secondary">{nextGate ?? "—"}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTrainClick?.(agent.id)}
            data-testid="button-open-training"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Open Training
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={!onPromote || busy}
            onClick={promote}
            data-testid="button-promote-agent"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {busy ? "Promoting…" : "Promote (advance gate)"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Promotion will advance the agent's <strong>gate</strong> after review. Use this for agents with stable KPIs (success ≥ 90%, p95 ≤ 3s).
        </p>
      </CardContent>
    </Card>
  );
}
