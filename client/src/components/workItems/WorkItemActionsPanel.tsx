import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ChevronDown, ChevronUp, PuzzleIcon, MegaphoneIcon, SearchIcon } from "lucide-react";

type ActionKey = "lifestyle" | "patent" | "launch" | "audit";

type ActionStateStatus = "idle" | "running" | "ok" | "error";

interface ActionState {
  status: ActionStateStatus;
  lastRunAt?: string;
}

interface WorkItemActionsPanelProps {
  workItemId: number;
}

const ACTION_CONFIG: Record<
  ActionKey,
  {
    label: string;
    Icon: typeof Sparkles;
    endpointSuffix: string;
  }
> = {
  lifestyle: {
    label: "Generate Lifestyle Pack",
    Icon: Sparkles,
    endpointSuffix: "generate-lifestyle-pack",
  },
  patent: {
    label: "Generate Patent Claims Pack",
    Icon: PuzzleIcon,
    endpointSuffix: "generate-patent-claims-pack",
  },
  launch: {
    label: "Generate Launch Plan Pack",
    Icon: MegaphoneIcon,
    endpointSuffix: "generate-launch-plan-pack",
  },
  audit: {
    label: "Generate Website Audit Pack",
    Icon: SearchIcon,
    endpointSuffix: "generate-website-audit-pack",
  },
};

export function WorkItemActionsPanel({ workItemId }: WorkItemActionsPanelProps) {
  const [open, setOpen] = useState(false);
  const [actionState, setActionState] = useState<Record<ActionKey, ActionState>>({
    lifestyle: { status: "idle" },
    patent: { status: "idle" },
    launch: { status: "idle" },
    audit: { status: "idle" },
  });
  const { toast } = useToast();

  async function runAction(key: ActionKey) {
    const cfg = ACTION_CONFIG[key];
    const now = new Date().toISOString();

    setActionState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: "running" },
    }));

    try {
      const res = await fetch(
        `/api/work-items/${workItemId}/actions/${cfg.endpointSuffix}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.message || error.error || `Status ${res.status}`);
      }

      setActionState((prev) => ({
        ...prev,
        [key]: { status: "ok", lastRunAt: now },
      }));

      toast({
        title: "Action completed",
        description: `${cfg.label} completed successfully`,
      });
    } catch (err: any) {
      console.error("Failed to run WI action", key, err);
      setActionState((prev) => ({
        ...prev,
        [key]: { status: "error", lastRunAt: now },
      }));

      toast({
        title: "Action failed",
        description: err.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  }

  function formatLastRun(lastRunAt?: string): string {
    if (!lastRunAt) return "Never run";
    const d = new Date(lastRunAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusBadgeVariant(status: ActionStateStatus) {
    switch (status) {
      case "ok":
        return "default";
      case "error":
        return "destructive";
      case "running":
        return "secondary";
      default:
        return "outline";
    }
  }

  function getStatusLabel(status: ActionStateStatus): string {
    const labelMap: Record<ActionStateStatus, string> = {
      idle: "Idle",
      running: "Running…",
      ok: "Last run OK",
      error: "Last run failed",
    };
    return labelMap[status];
  }

  return (
    <div className="wi-actions-panel" data-testid="work-item-actions-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Actions
        </span>
        <Button
          type="button"
          onClick={() => setOpen((v) => !v)}
          variant="outline"
          size="sm"
          data-testid="button-toggle-actions"
        >
          <span>Run</span>
          {open ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      </div>

      {open && (
        <div className="mt-2 rounded-md border bg-card p-2 text-sm">
          {(Object.keys(ACTION_CONFIG) as ActionKey[]).map((key) => {
            const cfg = ACTION_CONFIG[key];
            const state = actionState[key];
            const isRunning = state.status === "running";
            const Icon = cfg.Icon;

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0"
                data-testid={`action-row-${key}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{cfg.label}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(state.status)} className="text-xs">
                      {getStatusLabel(state.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatLastRun(state.lastRunAt)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => runAction(key)}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                  data-testid={`button-run-${key}`}
                >
                  {isRunning ? "Running…" : "Run"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
