import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditRecord {
  id: number;
  setting_key: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: string;
}

interface AuditDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

interface AuditSummary {
  totalChanges: number;
  changesByUser: Array<{ changed_by: string; change_count: number }>;
  changesBySetting: Array<{ setting_key: string; change_count: number }>;
  recentChanges: Array<{ setting_key: string; changed_by: string; changed_at: string }>;
}

function computeDiff(oldValue: any, newValue: any): AuditDiff[] {
  const diffs: AuditDiff[] = [];
  
  if (!oldValue && newValue) {
    return Object.keys(newValue).map((key) => ({
      field: key,
      oldValue: null,
      newValue: newValue[key],
    }));
  }

  if (!newValue) return [];

  const allKeys = new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = oldValue?.[key];
    const newVal = newValue?.[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return diffs;
}

function AuditRecordCard({ record }: { record: AuditRecord }) {
  const diffs = computeDiff(record.old_value, record.new_value);
  const timestamp = new Date(record.changed_at).toLocaleString();

  return (
    <Card className="shadow-sm" data-testid={`audit-record-${record.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{record.setting_key}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {timestamp}
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {record.changed_by}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {diffs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes detected</p>
        ) : (
          <div className="space-y-2">
            {diffs.map((diff, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 text-sm" data-testid={`diff-${record.id}-${diff.field}`}>
                <div className="font-medium text-muted-foreground">{diff.field}</div>
                <div className="text-destructive">
                  {diff.oldValue === null ? (
                    <span className="text-muted-foreground italic">null</span>
                  ) : (
                    JSON.stringify(diff.oldValue)
                  )}
                </div>
                <div className="text-primary font-medium">
                  → {JSON.stringify(diff.newValue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AuditTrail() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Verify trigger
      const verifyRes = await fetch("/api/ops/audit/verify");
      const verifyData = await verifyRes.json();
      setVerification(verifyData);

      if (!verifyData.ok) {
        toast({
          title: "Audit Trigger Issue",
          description: verifyData.error,
          variant: "destructive",
        });
        return;
      }

      // Get summary
      const summaryRes = await fetch("/api/ops/audit/summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // Get records
      const trailUrl = filter === "all" 
        ? `/api/ops/audit/trail?limit=${limit}`
        : `/api/ops/audit/trail/${filter}?limit=${limit}`;
      
      const recordsRes = await fetch(trailUrl);
      const recordsData = await recordsRes.json();
      setRecords(recordsData);

    } catch (error: any) {
      toast({
        title: "Failed to load audit trail",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, limit]);

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading audit trail...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="audit-trail-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Monitor configuration changes and verify audit trigger behavior
          </p>
        </div>
        <Button onClick={fetchData} size="sm" variant="outline" data-testid="button-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Verification Status */}
      {verification && (
        <Alert className={verification.ok ? "border-primary" : "border-destructive"} data-testid="alert-verification">
          <div className="flex items-center gap-2">
            {verification.ok ? (
              <CheckCircle2 className="w-5 h-5 text-primary" data-testid="icon-verification-success" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" data-testid="icon-verification-error" />
            )}
            <AlertDescription data-testid="text-verification-status">
              {verification.ok ? (
                <span>
                  ✅ Audit trigger is active • {verification.details?.auditRecordCount || 0} total records
                </span>
              ) : (
                <span>❌ {verification.error}</span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="summary-stats">
          <Card data-testid="card-total-changes">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-changes">{summary.totalChanges}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-most-active-user">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.changesByUser.length > 0 ? (
                <div>
                  <div className="text-lg font-semibold truncate" data-testid="text-most-active-user">
                    {summary.changesByUser[0].changed_by}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-user-change-count">
                    {summary.changesByUser[0].change_count} changes
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-most-changed-setting">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Most Changed Setting</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.changesBySetting.length > 0 ? (
                <div>
                  <div className="text-lg font-semibold truncate" data-testid="text-most-changed-setting">
                    {summary.changesBySetting[0].setting_key}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-setting-change-count">
                    {summary.changesBySetting[0].change_count} changes
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card data-testid="card-filters">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Setting</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger data-testid="select-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="filter-all">All Settings</SelectItem>
                <SelectItem value="uploads" data-testid="filter-uploads">Uploads</SelectItem>
                <SelectItem value="uploader" data-testid="filter-uploader">Uploader</SelectItem>
                {summary?.changesBySetting.slice(0, 5).map((s) => (
                  <SelectItem key={s.setting_key} value={s.setting_key} data-testid={`filter-${s.setting_key}`}>
                    {s.setting_key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <label className="text-sm font-medium mb-2 block">Limit</label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v, 10))}>
              <SelectTrigger data-testid="select-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" data-testid="limit-10">10</SelectItem>
                <SelectItem value="25" data-testid="limit-25">25</SelectItem>
                <SelectItem value="50" data-testid="limit-50">50</SelectItem>
                <SelectItem value="100" data-testid="limit-100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Records */}
      <div className="space-y-3" data-testid="audit-records-section">
        <h2 className="text-xl font-semibold" data-testid="text-recent-changes-heading">
          Recent Changes ({records.length})
        </h2>
        {records.length === 0 ? (
          <Card data-testid="card-no-records">
            <CardContent className="p-6 text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              No audit records found for the selected filter
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <AuditRecordCard key={record.id} record={record} />
          ))
        )}
      </div>
    </div>
  );
}
