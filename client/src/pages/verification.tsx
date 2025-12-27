import { useMemo } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import CoveragePage from "@/pages/coverage";

function getSearchParams(location: string) {
  const idx = location.indexOf("?");
  return new URLSearchParams(idx >= 0 ? location.slice(idx + 1) : "");
}

function enc(v: string) {
  return encodeURIComponent(v);
}

export default function VerificationPage() {
  const [location, setLocation] = useLocation();
  const params = useMemo(() => getSearchParams(location), [location]);

  const workItemId = params.get("workItemId")?.trim() || "";
  const context = params.get("context")?.trim() || "";
  const q = params.get("q")?.trim() || "";

  const hasWorkItemContext = Boolean(workItemId || context || q);

  const logsHref = `/ops/logs?workItemId=${enc(workItemId)}&context=${enc(context)}&q=${enc(q)}`;
  const artifactsHref = `/artifacts?q=${enc(q)}&context=${enc(context)}&workItemId=${enc(workItemId)}`;

  return (
    <div className="space-y-4">
      {hasWorkItemContext && (
        <Alert data-testid="verification-context-banner">
          <AlertTitle className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Work-item context detected
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="text-sm">
              Verification currently focuses on role coverage (not work-item verification). Use these quick jumps instead:
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setLocation(logsHref)} data-testid="button-context-logs">
                Open Logs
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLocation(artifactsHref)} data-testid="button-context-artifacts">
                Related Artifacts
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <CoveragePage />
    </div>
  );
}
