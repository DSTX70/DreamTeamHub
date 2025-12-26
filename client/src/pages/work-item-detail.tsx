import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { FilesPanel } from "@/components/FilesPanel";
import { WorkItemActionsPanel } from "@/components/workItems/WorkItemActionsPanel";
import { WorkItemPacksPanel } from "@/components/workItems/WorkItemPacksPanel";
import { LifestyleHeroPreview } from "@/components/workItems/LifestyleHeroPreview";
import { ArrowLeft, Calendar, User, Target, Route, Compass, Users } from "lucide-react";
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

export default function WorkItemDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const workItemId = parseInt(id || "0", 10);

  const { data: workItem, isLoading, error } = useQuery<WorkItem>({
    queryKey: ['/api/work-items', workItemId],
    enabled: workItemId > 0,
  });

  const cast = useMemo(() => parseCastReceipt(workItem?.description ?? null), [workItem?.description]);

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
          {workItem.workOrderId && (
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FilesPanel
                  workItemId={workItem.id}
                  workOrderId={workItem.workOrderId}
                />
              </CardContent>
            </Card>
          )}
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
