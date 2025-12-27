import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
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
  playbookHandle?: string;
  stop: string;
  status: string;
  created_at: string;
};

type Playbook = {
  id: string;
  handle: string;
  title: string;
  bodyMd: string;
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    playbookHandle: "",
    stop: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery<WO[]>({
    queryKey: ["/api/work-orders"],
    refetchInterval: 5000,
  });

  const { data: runs = [] } = useQuery<RunRow[]>({
    queryKey: ["/api/work-orders/runs"],
    refetchInterval: 8000,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPlaybooks(true);
        const response = await fetch("/api/playbooks", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch playbooks");
        const data = await response.json();
        if (mounted) setPlaybooks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load playbooks:", error);
      } finally {
        if (mounted) setLoadingPlaybooks(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
      playbookHandle: "",
      stop: t.stop ?? ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body: any = {
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
        stop: form.stop
      };
      
      if (form.playbookHandle && form.playbookHandle !== "none") {
        body.playbookHandle = form.playbookHandle;
      }

      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast({
        title: "Template Created",
        description: "The work order template has been created successfully.",
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
        playbookHandle: "",
        stop: ""
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create template",
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

  const breadcrumbs = buildBreadcrumbs({ page: "Templates" });

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <PageBreadcrumb segments={breadcrumbs} />

      <Card data-testid="templates-intro-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Templates
              </CardTitle>
              <CardDescription>
                Work Orders are <span className="font-medium">templates/runbooks</span>. Active execution lives in{" "}
                <span className="font-medium">Work Items</span>.
              </CardDescription>
            </div>
            <Badge variant="secondary">Work Orders</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            If you want to see what's being worked on right now, go to <span className="font-medium">Work</span>.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/work">
              <Button variant="default" data-testid="button-go-to-work">Go to Work</Button>
            </Link>
            <Link href="/intent">
              <Button variant="outline" data-testid="button-new-work">New Work</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setShowAdvanced((v) => !v)}
              title="Show advanced template details and runs"
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Hide Advanced
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show Advanced
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
          <CardDescription>
            Define a new work order template using presets or custom configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium">Preset:</label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-[280px]" data-testid="select-template">
                  <SelectValue placeholder="— choose a preset —" />
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

            {showAdvanced && (
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
                  placeholder="Success min %"
                  value={form.kpiSuccess}
                  onChange={(e) => setForm({ ...form, kpiSuccess: e.target.value })}
                  required
                  data-testid="input-success-min"
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="p95 max (seconds)"
                  value={form.kpiP95}
                  onChange={(e) => setForm({ ...form, kpiP95: e.target.value })}
                  required
                  data-testid="input-p95-max"
                />
              </div>
            )}

            {showAdvanced && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Playbook {!form.playbookHandle && <span className="text-muted-foreground">(optional)</span>}
                </label>
                <Select
                  value={form.playbookHandle}
                  onValueChange={(value) => setForm({ ...form, playbookHandle: value })}
                >
                  <SelectTrigger data-testid="select-playbook">
                    <SelectValue placeholder={loadingPlaybooks ? "Loading playbooks..." : "— Select a playbook (optional) —"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {playbooks.map((pb) => (
                      <SelectItem key={pb.id} value={pb.handle}>
                        {pb.title} — {pb.handle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Manage playbooks at{" "}
                  <a href="/playbooks" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                    /playbooks
                  </a>
                </p>
              </div>
            )}

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
              Create Template
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>
            Run a template to create a Work Item. Templates define the runbook; Work Items are the execution.
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
              title="No templates yet"
              description="Templates are AI-driven runbooks with budget caps. Create one using the form above to get started with automated workflows."
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
                    <Badge variant="outline" className="text-xs">Template</Badge>
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
                  {showAdvanced && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>Runs/day: <strong>{order.caps.runsPerDay}</strong></div>
                      <div>$/day: <strong>${order.caps.usdPerDay}</strong></div>
                      <div>Success {">="} <strong>{order.kpis.successMin}%</strong></div>
                      <div>P95 {"<="} <strong>{order.kpis.p95Max}s</strong></div>
                    </div>
                  )}
                  {showAdvanced && order.playbookHandle && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Playbook: </span>
                      <Badge variant="outline" className="text-xs">
                        <code>{order.playbookHandle}</code>
                      </Badge>
                      <a
                        href={`/playbooks?handle=${order.playbookHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs underline text-primary hover:text-primary/80"
                      >
                        View
                      </a>
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
                      Run Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs (last 50)</CardTitle>
            <CardDescription>
              Execution history showing work order runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto" role="region" aria-live="polite" aria-label="Work order runs table">
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
                          <span className="sr-only">Status: </span>
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
                        No runs yet. Click "Run Template" on a template to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
