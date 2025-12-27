import type { WorkItem } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldCheck, FolderKanban, ScrollText } from "lucide-react";
import { useLocation } from "wouter";

function isFailureStatus(status?: string | null) {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes("fail") || s.includes("error") || s.includes("blocked");
}

function enc(v: string) {
  return encodeURIComponent(v);
}

/**
 * "Next Actions" micro-panel
 * - Logs: shows when status indicates failure (best-effort link)
 * - Verification: always available
 * - Artifacts: link to /artifacts with query to help find related projects/files
 */
export default function NextActionsPanel(props: { workItem: WorkItem; targetContext?: string | null }) {
  const { workItem, targetContext } = props;
  const [, setLocation] = useLocation();

  const failure = isFailureStatus(workItem.status);
  const ctx = targetContext?.trim() ? targetContext!.trim() : "—";

  const logsHref = `/ops/logs?workItemId=${workItem.id}&context=${enc(ctx)}&q=${enc(workItem.title ?? "")}`;
  const verifyHref = `/verification?workItemId=${workItem.id}&context=${enc(ctx)}`;
  const artifactsHref = `/artifacts?q=${enc(workItem.title ?? "")}&context=${enc(ctx)}&workItemId=${workItem.id}`;

  return (
    <Card data-testid="next-actions-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Next Actions
        </CardTitle>
        <CardDescription>
          Quick jumps based on this work item's context & status. (Target: {ctx})
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2">
        {failure && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setLocation(logsHref)}
            data-testid="next-action-logs"
            title="Open orchestration logs (best effort filter)"
          >
            <ScrollText className="h-4 w-4" />
            Open Logs
          </Button>
        )}

        <Button
          variant="default"
          className="gap-2"
          onClick={() => setLocation(verifyHref)}
          data-testid="next-action-verify"
          title="Open Verification lens"
        >
          <ShieldCheck className="h-4 w-4" />
          Verification
        </Button>

        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setLocation(artifactsHref)}
          data-testid="next-action-artifacts"
          title="Open Artifacts lens (best effort search)"
        >
          <FolderKanban className="h-4 w-4" />
          Related Artifacts
        </Button>
      </CardContent>
    </Card>
  );
}
