import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { PodPresetBadge } from "@/components/pod-preset-badge";
import { FilesPanel } from "@/components/FilesPanel";
import { WorkItemActionsPanel } from "@/components/workItems/WorkItemActionsPanel";
import { WorkItemPacksPanel } from "@/components/workItems/WorkItemPacksPanel";
import { LifestyleHeroPreview } from "@/components/workItems/LifestyleHeroPreview";
import NextActionsPanel from "@/components/workItems/NextActionsPanel";
import { getTargetContext } from "@/lib/castReceipt";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, User, Target, Route, Compass, Users, Lightbulb, Wand2, Check, FileText, Copy } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { WorkItem } from "@shared/schema";

type CastLine = { name: string; slug: string };

function extractCastReceiptBlock(description?: string | null): string | null {
  if (!description) return null;
  const re = /---\s*\n([\s\S]*?)\n---/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(description)) !== null) {
    const block = m[1]?.trim();
    if (block && /(^|\n)Cast Receipt(\n|$)/i.test(block)) return block;
  }
  return null;
}

function parseKeyLine(block: string, key: string): string | null {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const m = block.match(re);
  return m?.[1]?.trim() ?? null;
}

function parseSectionLines(block: string, section: "Pods" | "Personas"): CastLine[] {
  const lines = block.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) => l.toLowerCase() === `${section.toLowerCase()}:`);
  if (idx === -1) return [];

  const out: CastLine[] = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (/^(pods|personas)\s*:\s*$/i.test(l)) break;
    if (l === "-" || l.startsWith("---")) continue;
    if (/^-?\s*auto$/i.test(l.replace(/^-\s*/, ""))) return [];

    const nameMatch = l.match(/name\s*:\s*([^|]+)\|/i);
    const slugMatch = l.match(/slug\s*:\s*([A-Za-z0-9._-]+)/i);
    const name = nameMatch?.[1]?.trim() ?? "";
    const slug = slugMatch?.[1]?.trim() ?? "";
    if (name || slug) out.push({ name: name || slug, slug: slug || name });
  }
  return out;
}

function parseCastReceipt(description?: string | null) {
  const block = extractCastReceiptBlock(description);
  if (!block) return null;

  const targetContext = parseKeyLine(block, "Target Context");
  const mode = parseKeyLine(block, "Mode");
  const autonomy = parseKeyLine(block, "Autonomy");
  const pods = parseSectionLines(block, "Pods");
  const personas = parseSectionLines(block, "Personas");

  return {
    raw: block,
    targetContext: targetContext ?? "—",
    mode: mode ?? "—",
    autonomy: autonomy ?? "—",
    pods,
    personas,
    podsAuto: /(^|\n)Pods:\s*\n\s*-\s*AUTO(\n|$)/i.test(block) || /(^|\n)Pods:\s*\n\s*AUTO(\n|$)/i.test(block),
    personasAuto: /(^|\n)Personas:\s*\n\s*-\s*AUTO(\n|$)/i.test(block) || /(^|\n)Personas:\s*\n\s*AUTO(\n|$)/i.test(block),
  };
}

function safeJsonParse(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

function extractStrategyProvenance(workItem: any): string | null {
  if (!workItem) return null;

  // 1) Prefer structured provenance if present
  const ctxRaw = workItem.targetContext ?? workItem.target_context ?? workItem.context ?? null;
  const ctx = typeof ctxRaw === "string" ? (safeJsonParse(ctxRaw) ?? null) : ctxRaw;
  const fromCtx =
    ctx && typeof ctx === "object"
      ? (ctx.strategySessionId || ctx.strategy_session_id || null)
      : null;
  if (fromCtx && typeof fromCtx === "string") return fromCtx;

  // 2) Fallback to playbook parsing (tolerant)
  const playbook = String(workItem.playbook || "");
  if (!playbook) return null;

  // Matches a few common shapes:
  // **Source:** Strategy Session abc123
  // Source: Strategy Session abc123
  // strategySessionId: abc123
  const patterns = [
    /\*\*Source:\*\*\s*Strategy Session\s+([a-z0-9]+)/i,
    /Source:\s*Strategy Session\s+([a-z0-9]+)/i,
    /strategySessionId\s*[:=]\s*([a-z0-9]+)/i,
  ];
  for (const p of patterns) {
    const m = playbook.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

type WorkItemStageRecord = {
  workItemId: string;
  stage: "NONE" | "RECOMMENDATION_DRAFT" | "RECOMMENDATION_APPROVED" | "DROP_READY";
  recommendation?: { text: string; created_at: string };
  approval?: { approved_by: string; approved_at: string };
  drop?: { targetRepo: string; text: string; created_at: string };
};

export default function WorkItemDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const workItemId = parseInt(id || "0", 10);

  const { data: workItem, isLoading, error } = useQuery<WorkItem>({
    queryKey: ['/api/work-items', workItemId],
    enabled: workItemId > 0,
  });

  const { data: stage } = useQuery<WorkItemStageRecord>({
    queryKey: ['/api/work-items', workItemId, 'stage'],
    enabled: workItemId > 0,
  });

  const cast = useMemo(() => parseCastReceipt(workItem?.description ?? null), [workItem?.description]);
  const strategySessionId = useMemo(() => extractStrategyProvenance(workItem), [workItem]);

  const genRec = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/work-items/${workItemId}/stage/recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: workItem?.title,
          inputs: workItem?.description ?? "",
          repoHint: "GigsterGarage",
          strategySessionId: strategySessionId,
        }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/work-items', workItemId, 'stage'] });
      toast({ title: "Recommendation generated", description: "Draft created (non-executing)." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const approveRec = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/work-items/${workItemId}/stage/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "Dustin Sparks" }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/work-items', workItemId, 'stage'] });
      toast({ title: "Approved", description: "Recommendation approved. Drop generation enabled." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  type GeneratePatchDropResponse =
    | {
        ok: true;
        repo: string;
        dropText: string;
        blocked?: boolean;
        evidenceRequest?: string;
        suggestedFileFetchPaths?: string[];
        noPatchRequired?: boolean;
        rationale?: string;
        evidence?: string;
      }
    | {
        ok: false;
        error: string;
        details?: { validationErrors?: string[] };
        repo?: string;
        dropText?: string;
        blocked?: boolean;
        evidenceRequest?: string;
        suggestedFileFetchPaths?: string[];
        noPatchRequired?: boolean;
        rationale?: string;
        evidence?: string;
      };

  const [dropValidationErrors, setDropValidationErrors] = useState<string[] | null>(null);
  const [lastDropResult, setLastDropResult] = useState<{
    blocked: boolean;
    evidenceRequest?: string;
    suggestedFileFetchPaths?: string[];
    noPatchRequired: boolean;
    rationale?: string;
    evidence?: string;
  } | null>(null);

  const genDrop = useMutation({
    mutationFn: async () => {
      const lockedRecommendation = stage?.recommendation?.text || "";
      if (!lockedRecommendation || lockedRecommendation.length < 20) {
        throw new Error("Recommendation text is required before generating a drop.");
      }

      const res = await fetch(`/api/work-items/${workItemId}/actions/generatePatchDrop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          repoHint: "GigsterGarage",
          title: workItem?.title || `Work Item ${workItemId}`,
          lockedRecommendation,
        }),
      });

      const data = (await res.json()) as GeneratePatchDropResponse;

      if (!res.ok || data.ok === false) {
        const msg = (data as any)?.error || `HTTP ${res.status}`;
        const err: any = new Error(msg);
        err.payload = data;
        throw err;
      }

      return data as Extract<GeneratePatchDropResponse, { ok: true }>;
    },
    onSuccess: async (data) => {
      setDropValidationErrors(null);

      const blocked = Boolean(data.blocked);
      const noPatch = Boolean(data.noPatchRequired);

      setLastDropResult({
        blocked,
        evidenceRequest: data.evidenceRequest,
        suggestedFileFetchPaths: data.suggestedFileFetchPaths,
        noPatchRequired: noPatch,
        rationale: data.rationale,
        evidence: data.evidence,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/work-items", workItemId, "stage"] });

      if (blocked) {
        toast({
          title: "Blocked: Missing Evidence",
          description: "Paste the requested Network/Console evidence, then re-run Generate Recommendation → Generate Drop.",
          variant: "destructive",
        });
        return;
      }

      if (noPatch) {
        toast({ title: "No Patch Needed", description: data.rationale || "Fix already exists in repo." });
      } else {
        toast({ title: "Patch Generated", description: `Repo: ${data.repo}. FILE/END_FILE drop is ready.` });
      }
    },
    onError: (err: any) => {
      const payload = err?.payload as any;
      const validationErrors = payload?.details?.validationErrors as string[] | undefined;

      if (Array.isArray(validationErrors) && validationErrors.length) {
        setDropValidationErrors(validationErrors);
        toast({
          title: "Drop validation failed",
          description: validationErrors.slice(0, 2).join(" | "),
          variant: "destructive",
        });
        return;
      }

      setDropValidationErrors(null);
      toast({ title: "Drop generation failed", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const currentDropText = genDrop.data?.dropText || stage?.drop?.text;
  const currentDropRepo = genDrop.data?.repo || stage?.drop?.targetRepo || "GigsterGarage";

  const handleCopyDrop = () => {
    if (currentDropText) {
      navigator.clipboard.writeText(currentDropText);
      toast({ title: "Copied!", description: "Drop text copied to clipboard." });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !workItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/intake')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Work Item Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This work item does not exist or you don't have permission to view it.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="work-item-detail-page">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/intake')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold mb-2" data-testid="text-title">
                {workItem.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={workItem.status} />
                {workItem.priority && <StatusBadge status={workItem.priority} />}
                <PodPresetBadge source={workItem} />
                {strategySessionId && (
                  <Link href={`/strategy/${strategySessionId}`}>
                    <Badge variant="outline" className="cursor-pointer gap-1" data-testid="badge-strategy-provenance">
                      <Lightbulb className="h-3 w-3" />
                      Seeded from Strategy: {strategySessionId.slice(0, 8)}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routing & Cast Panel */}
      {cast && (
        <Card data-testid="routing-cast-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Routing & Cast
            </CardTitle>
            <CardDescription>
              Target context and cast receipt (Auto or Curated). This keeps routing deterministic and outputs non-generic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Target Context</div>
                <div className="mt-1 font-medium">{cast.targetContext}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Mode</div>
                <div className="mt-1 font-medium">{cast.mode}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Autonomy</div>
                <div className="mt-1 font-medium">{cast.autonomy}</div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="h-4 w-4" />
                  <div className="font-medium">Pods</div>
                </div>
                {cast.podsAuto && <div className="text-sm text-muted-foreground">AUTO</div>}
                {!cast.podsAuto && cast.pods.length === 0 && (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {cast.pods.map((p) => (
                    <Badge key={`${p.slug}-${p.name}`} variant="secondary" title={p.slug}>
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  <div className="font-medium">Personas</div>
                </div>
                {cast.personasAuto && <div className="text-sm text-muted-foreground">AUTO</div>}
                {!cast.personasAuto && cast.personas.length === 0 && (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {cast.personas.map((p) => (
                    <Badge key={`${p.slug}-${p.name}`} variant="outline" title={p.slug}>
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">View raw Cast Receipt</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
                {cast.raw}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Execution Pipeline */}
      <Card data-testid="execution-pipeline-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Execution Pipeline
          </CardTitle>
          <CardDescription>
            Recommendation → Approval → Drop (non-executing). Target repo: <span className="font-medium">GigsterGarage</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" data-testid="badge-stage">Stage: {stage?.stage || "NONE"}</Badge>
            <Badge variant="secondary">No auto-apply</Badge>
            <Badge variant="secondary">No VSuiteHQ push</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => genRec.mutate()}
              disabled={!workItem?.id || genRec.isPending}
              variant="outline"
              data-testid="button-gen-recommendation"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {genRec.isPending ? "Generating..." : "Generate Recommendation"}
            </Button>

            <Button
              onClick={() => approveRec.mutate()}
              disabled={approveRec.isPending || !stage?.recommendation?.text}
              data-testid="button-approve-recommendation"
            >
              <Check className="mr-2 h-4 w-4" />
              {approveRec.isPending ? "Approving..." : "Approve Recommendation"}
            </Button>

            <Button
              onClick={() => genDrop.mutate()}
              disabled={genDrop.isPending || stage?.stage !== "RECOMMENDATION_APPROVED"}
              variant="default"
              data-testid="button-gen-drop"
            >
              <FileText className="mr-2 h-4 w-4" />
              {genDrop.isPending ? "Generating..." : "Generate GigsterGarage Drop"}
            </Button>
          </div>

          {dropValidationErrors && dropValidationErrors.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3" data-testid="drop-validation-errors">
              <div className="text-sm font-medium text-destructive mb-2">Drop validation errors:</div>
              <ul className="list-disc ml-5 text-sm text-destructive/80">
                {dropValidationErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {stage?.recommendation?.text && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Recommendation (Draft)</div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(stage.recommendation?.text || "");
                    toast({ title: "Copied!", description: "Recommendation copied to clipboard." });
                  }}
                  data-testid="button-copy-recommendation"
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Copy
                </Button>
              </div>
              <Textarea 
                value={stage.recommendation.text} 
                readOnly 
                className="min-h-[200px] font-mono text-xs" 
                data-testid="textarea-recommendation"
              />
            </div>
          )}

          {stage?.approval && (
            <div className="rounded-md border bg-green-500/10 border-green-500/30 p-3">
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                Approved by {stage.approval.approved_by} on {format(new Date(stage.approval.approved_at), "PPp")}
              </div>
            </div>
          )}

          {/* BLOCKED Banner */}
          {lastDropResult?.blocked && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3" data-testid="blocked-evidence-banner">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-amber-600 dark:text-amber-200">BLOCKED — Missing Evidence</div>
                  <div className="text-sm text-amber-700 dark:text-amber-100/90">
                    The system can't generate a safe patch drop yet. Paste the requested evidence, fetch the suggested files, then rerun.
                  </div>
                </div>

                {lastDropResult.evidenceRequest && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400/40 text-amber-700 dark:text-amber-100 hover:bg-amber-400/10"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(lastDropResult.evidenceRequest || "");
                        toast({ title: "Copied", description: "Evidence request copied to clipboard." });
                      } catch {
                        toast({ title: "Copy failed", description: "Clipboard not available.", variant: "destructive" });
                      }
                    }}
                    data-testid="button-copy-evidence-request"
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy evidence request
                  </Button>
                )}
              </div>

              {lastDropResult.evidenceRequest && (
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-black/30 p-2 text-xs text-amber-700 dark:text-amber-100/90">
                  {lastDropResult.evidenceRequest}
                </pre>
              )}

              {Array.isArray(lastDropResult.suggestedFileFetchPaths) && lastDropResult.suggestedFileFetchPaths.length > 0 && (
                <div className="mt-3 text-xs text-amber-700 dark:text-amber-100/90">
                  <div className="font-medium mb-1">Suggested files to fetch:</div>
                  <ul className="list-disc ml-5">
                    {lastDropResult.suggestedFileFetchPaths.slice(0, 12).map((p, i) => (
                      <li key={`${p}-${i}`}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {currentDropText && (
            <div className="space-y-2">
              {lastDropResult && !lastDropResult.blocked && (
                <div 
                  className={`rounded-md border p-3 ${
                    lastDropResult.noPatchRequired 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-blue-500/10 border-blue-500/30"
                  }`}
                  data-testid="drop-status-indicator"
                >
                  <div className={`text-sm font-medium ${
                    lastDropResult.noPatchRequired 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-blue-600 dark:text-blue-400"
                  }`}>
                    {lastDropResult.noPatchRequired ? (
                      <>
                        <Check className="inline-block mr-2 h-4 w-4" />
                        No Patch Needed
                      </>
                    ) : (
                      <>
                        <FileText className="inline-block mr-2 h-4 w-4" />
                        Patch Generated
                      </>
                    )}
                  </div>
                  {lastDropResult.noPatchRequired && lastDropResult.rationale && (
                    <div className="text-xs text-muted-foreground mt-1">{lastDropResult.rationale}</div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Drop (Ready for {currentDropRepo})</div>
                <Button size="sm" variant="outline" onClick={handleCopyDrop} data-testid="button-copy-drop">
                  <Copy className="mr-2 h-3 w-3" />
                  Copy Drop
                </Button>
              </div>
              <Textarea 
                value={currentDropText} 
                readOnly 
                className="min-h-[200px] font-mono text-xs" 
                data-testid="textarea-drop"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Actions Panel */}
      <NextActionsPanel
        workItem={workItem}
        targetContext={getTargetContext(workItem.description) || cast?.targetContext || "DreamTeamHub"}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {workItem.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                  data-testid="text-description"
                >
                  {workItem.description}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>AI Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkItemActionsPanel workItemId={workItem.id} />
            </CardContent>
          </Card>

          {/* Work Item Packs Viewer */}
          <WorkItemPacksPanel workItemId={workItem.id} />

          {/* Lifestyle Hero Preview */}
          <LifestyleHeroPreview workItemId={workItem.id} />

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <CardContent>
              <FilesPanel workItemId={workItem.id} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workItem.ownerId && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Owner</div>
                    <div className="text-sm font-medium" data-testid="text-owner">
                      Owner ID: {workItem.ownerId}
                    </div>
                  </div>
                </div>
              )}

              {workItem.podId && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Pod</div>
                    <div className="text-sm font-medium" data-testid="text-pod">
                      {workItem.podId}
                    </div>
                  </div>
                </div>
              )}

              {workItem.dueDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Due Date</div>
                    <div className="text-sm font-medium" data-testid="text-due-date">
                      {format(new Date(workItem.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {workItem.milestone && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Milestone</div>
                    <div className="text-sm font-medium" data-testid="text-milestone">
                      {workItem.milestone}
                    </div>
                  </div>
                </div>
              )}

              {workItem.workOrderId && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Work Order</div>
                    <div className="text-sm font-medium" data-testid="text-work-order">
                      {workItem.workOrderId}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
