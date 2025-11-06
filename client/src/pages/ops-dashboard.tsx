import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, Activity, FileCheck, Upload, Play, AlertCircle } from "lucide-react";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

interface Metrics24h {
  period: string;
  metrics: {
    publishCount: number;
    draftCount: number;
    woRunsCount: number;
    knowledgeErrors: number;
    workOrderErrors: number;
    rateLimitCount: number;
    knowledgeTotal: number;
    workOrderTotal: number;
    knowledgeErrorRate: number;
    workOrderErrorRate: number;
  };
  timestamp: string;
}

interface Alert {
  name: string;
  triggered: boolean;
  severity: "low" | "medium" | "high";
  message: string;
  count?: number;
  threshold?: number;
  errorRate?: string;
  window?: string;
}

interface AlertStatus {
  alerts: Alert[];
  activeCount: number;
  timestamp: string;
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  description?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const severityColors = {
    low: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    medium: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };

  const severityIcons = {
    low: AlertCircle,
    medium: AlertTriangle,
    high: AlertTriangle,
  };

  const Icon = severityIcons[alert.severity];

  return (
    <Card className={`border-2 ${alert.triggered ? severityColors[alert.severity] : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {alert.name}
        </CardTitle>
        {alert.triggered ? (
          <Badge variant="destructive" data-testid={`badge-alert-${alert.name}-triggered`}>
            TRIGGERED
          </Badge>
        ) : (
          <Badge variant="outline" data-testid={`badge-alert-${alert.name}-ok`}>
            OK
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm">{alert.message}</p>
        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
          {alert.window && <span>Window: {alert.window}</span>}
          <span className="uppercase">{alert.severity}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpsDashboardPage() {
  const { data: metrics, refetch: refetchMetrics, isLoading: metricsLoading } = useQuery<Metrics24h>({
    queryKey: ["/api/ops/metrics/24h"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: alertStatus, refetch: refetchAlerts, isLoading: alertsLoading } = useQuery<AlertStatus>({
    queryKey: ["/api/ops/alerts"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchAlerts();
  };

  const breadcrumbSegments = [
    { label: "i³ Collective", href: "/" },
    { label: "Ops Dashboard" },
  ];

  const m = metrics?.metrics;
  const activeAlerts = alertStatus?.alerts.filter(a => a.triggered) || [];

  return (
    <div className="space-y-6">
      <PageBreadcrumb segments={breadcrumbSegments} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time metrics and alerts for platform health
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={metricsLoading || alertsLoading}
          data-testid="button-refresh-dashboard"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(metricsLoading || alertsLoading) ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Alert Summary */}
      <Card className={activeAlerts.length > 0 ? "border-red-500/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeAlerts.length > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Active Alerts ({activeAlerts.length})
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                All Systems Operational
              </>
            )}
          </CardTitle>
          <CardDescription>
            Lightweight alert rules monitoring critical thresholds
          </CardDescription>
        </CardHeader>
        {activeAlerts.length > 0 && (
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {activeAlerts.map(a => a.name).join(", ")} triggered
            </div>
          </CardContent>
        )}
      </Card>

      {/* 24h Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">24-Hour Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="PUBLISH Events"
            value={m?.publishCount ?? 0}
            icon={FileCheck}
            description="Files published in last 24h"
            data-testid="metric-publish-count"
          />
          <MetricCard
            title="Draft Uploads"
            value={m?.draftCount ?? 0}
            icon={Upload}
            description="Drafts uploaded in last 24h"
            data-testid="metric-draft-count"
          />
          <MetricCard
            title="Work Order Runs"
            value={m?.woRunsCount ?? 0}
            icon={Play}
            description="WO executions in last 24h"
            data-testid="metric-wo-runs"
          />
          <MetricCard
            title="429 Rate Limits"
            value={m?.rateLimitCount ?? 0}
            icon={AlertCircle}
            description="Rate limit hits (tune caps)"
            data-testid="metric-rate-limits"
          />
        </div>
      </div>

      {/* Error Rates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Error Rates (24h)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Knowledge API</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-knowledge-error-rate">
                {m?.knowledgeErrorRate?.toFixed(2) ?? 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {m?.knowledgeErrors ?? 0} errors / {m?.knowledgeTotal ?? 0} requests
              </p>
              {(m?.knowledgeErrorRate ?? 0) > 1 && (
                <Badge variant="destructive" className="mt-2">Above 1% threshold</Badge>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Work Orders API</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-work-order-error-rate">
                {m?.workOrderErrorRate?.toFixed(2) ?? 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {m?.workOrderErrors ?? 0} errors / {m?.workOrderTotal ?? 0} requests
              </p>
              {(m?.workOrderErrorRate ?? 0) > 1 && (
                <Badge variant="destructive" className="mt-2">Above 1% threshold</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Alert Rules</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {alertStatus?.alerts.map((alert) => (
            <AlertCard key={alert.name} alert={alert} />
          ))}
        </div>
      </div>

      {/* Timestamp */}
      {metrics && (
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}
