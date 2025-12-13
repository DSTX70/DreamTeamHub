import { useCanonStatus } from "@/hooks/useCanonStatus";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function CanonStatusChip({ canonKey }: { canonKey: string }) {
  const { data, loading } = useCanonStatus(canonKey);

  if (loading) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground" data-testid="canon-status-loading">
        <HelpCircle className="h-3 w-3 mr-1" />
        Canon: loading...
      </Badge>
    );
  }

  if (!data) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground" data-testid="canon-status-unknown">
        <HelpCircle className="h-3 w-3 mr-1" />
        Canon: unknown
      </Badge>
    );
  }

  const icon =
    data.status === "synced" ? (
      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
    ) : data.status === "stale" ? (
      <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
    ) : (
      <HelpCircle className="h-3 w-3 mr-1" />
    );

  const badgeClass =
    data.status === "synced"
      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
      : data.status === "stale"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
      : "";

  const label =
    data.status === "synced"
      ? `${data.canonVersion} · ${relativeTime(data.lastSyncedAt)}`
      : data.status === "stale"
      ? `Stale: ${data.canonVersion} · ${relativeTime(data.lastSyncedAt)}`
      : "Unknown";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-xs ${badgeClass}`} data-testid="canon-status-chip">
          {icon}
          Canon: {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <div><strong>Source:</strong> {data.source}</div>
          <div><strong>Version:</strong> {data.canonVersion}</div>
          <div><strong>Last Synced:</strong> {data.lastSyncedAt ? new Date(data.lastSyncedAt).toLocaleString() : "Never"}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
