import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, ClipboardList } from "lucide-react";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";
import { EmptyState } from "@/components/empty-state";

type WO = {
  id: string;
  title: string;
  owner: string;
  autonomy: "L0" | "L1" | "L2" | "L3";
  inputs: string;
  output: string;
  caps: { runsPerDay: number; usdPerDay: number };
  kpis: { successMin: number; p95Max: number };
  playbook: string;
  stop: string;
  status: string;
  created_at: string;
};

type RunRow = {
  agent: string;
  wo_id: string;
  status: string;
  ms: number;
  cost: number;
  started_at: string;
  finished_at: string;
  mirror?: string;
};

const templates: Record<string, Partial<WO>> = {
  "Support L1 — Router": {
    autonomy: "L1",
    inputs: "/inbox/support/YY-MM-DD/*.md",
    output: "/drafts/support/replies/YY-MM-DD/",
    caps: { runsPerDay: 100, usdPerDay: 2 },
    kpis: { successMin: 90, p95Max: 3.0 },
    playbook: "classify → draft reply → cite 2 KB links",
    stop: "PII, low context, conflicts"
  },
  "Marketing L1 — 7-Day Calendar": {
    autonomy: "L1",
    inputs: "/briefs/marketing/week-XX.md",
    output: "/drafts/calendar/week-XX.csv",
    caps: { runsPerDay: 50, usdPerDay: 1 },
    kpis: { successMin: 90, p95Max: 3.0 },
    playbook: "per day {hook, caption, CTA, 3 hashtags}",
    stop: "missing brief, brand-lock mismatch"
  }
};

export default function WorkOrdersPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    owner: "",
    autonomy: "L1" as "L0" | "L1" | "L2" | "L3",
    inputs: "",
    output: "",
    capsRuns: "100",
    capsUsd: "2",
    kpiSuccess: "90",
    kpiP95: "3.0",
    playbook: "",
    stop: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery<WO[]>({
    queryKey: ["/api/work-orders"],
    refetchInterval: 5000,
  });

  const { data: runs = [] } = useQuery<RunRow[]>({
    queryKey: ["/api/work-orders/runs"],
    refetchInterval: 8000,
  });

  const applyTemplate = (key: string) => {
    const t = templates[key];
    if (!t) return;

    setForm({
      title: key,
      owner: form.owner,
      autonomy: t.autonomy ?? "L1",
      inputs: t.inputs ?? "",
      output: t.output ?? "",
      capsRuns: String(t.caps?.runsPerDay ?? 100),
      capsUsd: String(t.caps?.usdPerDay ?? 2),
      kpiSuccess: String(t.kpis?.successMin ?? 90),
      kpiP95: String(t.kpis?.p95Max ?? 3.0),
      playbook: t.playbook ?? "",
      stop: t.stop ?? ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = {
        title: form.title,
        owner: form.owner,
        autonomy: form.autonomy,
        inputs: form.inputs,
        output: form.output,
        caps: {
          runsPerDay: Number(form.capsRuns),
          usdPerDay: Number(form.capsUsd)
        },
        kpis: {
          successMin: Number(form.kpiSuccess),
          p95Max: Number(form.kpiP95)
        },
        playbook: form.playbook,
        stop: form.stop
      };

      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast({
        title: "Work Order Created",
        description: "The work order has been created successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });

      setForm({
        title: "",
        owner: "",
        autonomy: "L1",
        inputs: "",
        output: "",
        capsRuns: "100",
        capsUsd: "2",
        kpiSuccess: "90",
        kpiP95: "3.0",
        playbook: "",
        stop: ""
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create work order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRun = async (woId: string) => {
    const agent = prompt("Agent name (e.g., Support L1 — Router)")?.trim();
    if (!agent) return;

    try {
      const res = await fetch(`/api/work-orders/${woId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast({
        title: "Run Started",
        description: `Work order execution started for agent: ${agent}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/runs"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start run",
      });
    }
  };

  const breadcrumbs = buildBreadcrumbs({ page: "Work Orders" });

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <PageBreadcrumb segments={breadcrumbs} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
        <p className="text-muted-foreground mt-2">
          Define automated agent tasks with input/output specs, capacity limits, and success criteria
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Work Order</CardTitle>
          <CardDescription>
            Define a new work order using templates or custom configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium">Template:</label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-[280px]" data-testid="select-template">
                  <SelectValue placeholder="— choose a template —" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(templates).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                data-testid="input-title"
              />
              <Input
                placeholder="Owner"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                required
                data-testid="input-owner"
              />
              <Select
                value={form.autonomy}
                onValueChange={(value: any) => setForm({ ...form, autonomy: value })}
              >
                <SelectTrigger data-testid="select-autonomy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L0">L0</SelectItem>
                  <SelectItem value="L1">L1</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="L3">L3</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Output folder"
                value={form.output}
                onChange={(e) => setForm({ ...form, output: e.target.value })}
                required
                data-testid="input-output"
              />
              <Input
                className="md:col-span-2"
                placeholder="Inputs (paths or query)"
                value={form.inputs}
                onChange={(e) => setForm({ ...form, inputs: e.target.value })}
                required
                data-testid="input-inputs"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                type="number"
                step="1"
                placeholder="Runs/day"
                value={form.capsRuns}
                onChange={(e) => setForm({ ...form, capsRuns: e.target.value })}
                required
                data-testid="input-runs-per-day"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="$ per day"
                value={form.capsUsd}
                onChange={(e) => setForm({ ...form, capsUsd: e.target.value })}
                required
                data-testid="input-usd-per-day"
              />
              <Input
                type="number"
                step="1"
                placeholder="Success ≥ %"
                value={form.kpiSuccess}
                onChange={(e) => setForm({ ...form, kpiSuccess: e.target.value })}
                required
                data-testid="input-success-min"
              />
              <Input
                type="number"
                step="0.1"
                placeholder="p95 ≤ s"
                value={form.kpiP95}
                onChange={(e) => setForm({ ...form, kpiP95: e.target.value })}
                required
                data-testid="input-p95-max"
              />
            </div>

            <Textarea
              rows={3}
              placeholder="Playbook (steps for the agent to follow)"
              value={form.playbook}
              onChange={(e) => setForm({ ...form, playbook: e.target.value })}
              required
              data-testid="textarea-playbook"
            />
            <Textarea
              rows={2}
              placeholder="Stop conditions (when to halt execution)"
              value={form.stop}
              onChange={(e) => setForm({ ...form, stop: e.target.value })}
              required
              data-testid="textarea-stop"
            />

            <Button type="submit" disabled={isSubmitting} data-testid="button-create">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Work Order
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Work Orders</CardTitle>
          <CardDescription>
            View and execute work orders sorted by creation date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : workOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No work orders yet"
              description="Work orders are AI-driven tasks with budget caps. Create one using the templates above to get started with automated workflows."
              action={{
                label: "Scroll to Create Form",
                onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
              }}
            />
          ) : (
            <div className="space-y-4">
              {workOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`card-work-order-${order.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold" data-testid={`text-title-${order.id}`}>
                      {order.title}
                    </span>
                    <Badge variant="secondary" data-testid={`badge-autonomy-${order.id}`}>
                      <span className="sr-only">Autonomy level: </span>
                      {order.autonomy}
                    </Badge>
                    <Badge variant="outline" data-testid={`badge-status-${order.id}`}>
                      <span className="sr-only">Status: </span>
                      {order.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      owner: {order.owner}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Inputs: </span>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{order.inputs}</code>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Output: </span>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{order.output}</code>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>Runs/day: <strong>{order.caps.runsPerDay}</strong></div>
                    <div>$/day: <strong>${order.caps.usdPerDay}</strong></div>
                    <div>Success ≥ <strong>{order.kpis.successMin}%</strong></div>
                    <div>P95 ≤ <strong>{order.kpis.p95Max}s</strong></div>
                  </div>
                  {order.playbook && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Playbook: </span>
                      <span className="text-xs">{order.playbook}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startRun(order.id)}
                      data-testid={`button-start-${order.id}`}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Start Run
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Runs (last 50)</CardTitle>
          <CardDescription>
            Execution history showing simulated work order runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Agent</th>
                  <th className="text-left p-2 font-medium">WO ID</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-right p-2 font-medium">ms</th>
                  <th className="text-right p-2 font-medium">Cost ($)</th>
                  <th className="text-left p-2 font-medium">Started</th>
                  <th className="text-left p-2 font-medium">Finished</th>
                  <th className="text-left p-2 font-medium">Mirror</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{r.agent}</td>
                    <td className="p-2">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{r.wo_id}</code>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">{r.ms}</td>
                    <td className="p-2 text-right">{r.cost.toFixed(3)}</td>
                    <td className="p-2 text-xs">{new Date(r.started_at).toLocaleTimeString()}</td>
                    <td className="p-2 text-xs">{new Date(r.finished_at).toLocaleTimeString()}</td>
                    <td className="p-2 text-xs text-muted-foreground">{r.mirror || ""}</td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={8}>
                      No runs yet. Click "Start Run" on a work order to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
