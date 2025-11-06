import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Filter } from "lucide-react";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { formatDistanceToNow } from "date-fns";

interface OpsEvent {
  id: number;
  actor: string;
  kind: string;
  ownerType: string | null;
  ownerId: string | null;
  message: string | null;
  meta: Record<string, any> | null;
  createdAt: string;
}

function toCsv(rows: OpsEvent[]) {
  const headers = ["id", "at", "kind", "ownerType", "ownerId", "actor", "message", "meta"];
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    const needsQuotes = /[",\n]/.test(s);
    const clean = s.replace(/"/g, '""');
    return needsQuotes ? `"${clean}"` : clean;
  };
  const lines = [
    headers.join(","),
    ...rows.map(r => [
      r.id,
      r.createdAt,
      r.kind,
      r.ownerType,
      r.ownerId,
      r.actor,
      r.message,
      r.meta
    ].map(escape).join(","))
  ];
  return lines.join("\n");
}

function downloadCsv(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OpsLogsPage() {
  const [kindFilter, setKindFilter] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("");
  const [ownerIdFilter, setOwnerIdFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const queryParams = new URLSearchParams();
  if (kindFilter) queryParams.set("kind", kindFilter);
  if (ownerTypeFilter) queryParams.set("owner_type", ownerTypeFilter);
  if (ownerIdFilter) queryParams.set("owner_id", ownerIdFilter);
  queryParams.set("limit", "100");

  const { data: events = [], refetch, isLoading } = useQuery<OpsEvent[]>({
    queryKey: ["/api/ops/events", queryParams.toString()],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const handleExport = () => {
    const csv = toCsv(events);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const kindParam = kindFilter || "ALL";
    const ownerParam = (ownerTypeFilter || "ANY") + (ownerIdFilter ? `-${ownerIdFilter}` : "");
    downloadCsv(`ops-logs_${kindParam}_${ownerParam}_${ts}.csv`, csv);
  };

  const kindTypes = Array.from(new Set(events.map(e => e.kind))).filter(Boolean).sort();
  const ownerTypes = Array.from(new Set(events.map(e => e.ownerType))).filter(Boolean).sort();

  return (
    <div className="space-y-6">
      <PageBreadcrumb />
      
      <div>
        <h1 className="text-3xl font-bold">Operations Event Logs</h1>
        <p className="text-muted-foreground mt-2">
          View and filter operational events across the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-auto-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={!events.length}
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Kind</label>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger data-testid="select-kind-filter">
                  <SelectValue placeholder="All kinds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All kinds</SelectItem>
                  {kindTypes.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner Type</label>
              <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
                <SelectTrigger data-testid="select-owner-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {ownerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner ID</label>
              <Input
                placeholder="Filter by owner ID..."
                value={ownerIdFilter}
                onChange={(e) => setOwnerIdFilter(e.target.value)}
                data-testid="input-owner-id-filter"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Events ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading events...
            </div>
          )}
          
          {!isLoading && events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No events found
            </div>
          )}
          
          {!isLoading && events.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Kind</th>
                    <th className="pb-3 pr-4">Owner</th>
                    <th className="pb-3 pr-4">Actor</th>
                    <th className="pb-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event) => (
                    <tr key={event.id} className="text-sm" data-testid={`event-row-${event.id}`}>
                      <td className="py-3 pr-4 font-mono text-xs">{event.id}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{event.kind}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {event.ownerType && (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              {event.ownerType}
                            </Badge>
                            {event.ownerId && (
                              <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                {event.ownerId}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{event.actor}</td>
                      <td className="py-3">
                        {event.message && (
                          <div className="max-w-md truncate">{event.message}</div>
                        )}
                        {event.meta && Object.keys(event.meta).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.meta, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
