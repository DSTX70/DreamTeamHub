import { Link } from "wouter";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function OverviewHeader() {
  // Fetch recent logs summary
  const { data: logsData } = useSWR<{ events: any[] }>(
    "/api/ops/logs/rest?since=15m",
    { refreshInterval: 30000 }
  );
  
  // Fetch last deployment
  const { data: deployData } = useSWR<{ lastDeploy: { ts: string; sha?: string; tag?: string; actor?: string } | null }>(
    "/api/admin/deploy/last",
    { refreshInterval: 60000 }
  );
  
  const totalLogs = logsData?.events?.length || 0;
  const errorLogs = logsData?.events?.filter(e => e.level === "error").length || 0;
  const lastDeploy = deployData?.lastDeploy;
  
  return (
    <div 
      className="flex flex-wrap items-center gap-3 px-4 py-2 border-b bg-card/50"
      data-testid="overview-header"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Logs (15m):</span>
        <Link href="/ops/logs-stream-plus">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            data-testid="button-logs-count"
          >
            <Badge variant="secondary" className="mr-1">
              {totalLogs}
            </Badge>
            total
          </Button>
        </Link>
      </div>
      
      {errorLogs > 0 && (
        <Link href="/ops/logs-stream-plus?level=error">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            data-testid="button-errors-link"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            <Badge variant="destructive" className="mr-1">
              {errorLogs}
            </Badge>
            errors
          </Button>
        </Link>
      )}
      
      {lastDeploy && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Last Deploy:</span>
          <Badge variant="outline" className="text-xs" data-testid="badge-last-deploy">
            {lastDeploy.tag || lastDeploy.sha?.substring(0, 7) || "unknown"}
          </Badge>
          {lastDeploy.actor && (
            <span className="text-xs text-muted-foreground">
              by {lastDeploy.actor}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(lastDeploy.ts).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
