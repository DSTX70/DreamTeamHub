import { useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import CoveragePage from "@/pages/coverage";
import {
  readWorkItemContext,
  hasWorkItemContext as checkHasContext,
  contextToSearch,
  getSearchParamsFromLocation,
} from "@/lib/workItemContext";

export default function VerificationPage() {
  const [location, setLocation] = useLocation();
  const params = useMemo(() => getSearchParamsFromLocation(location), [location]);
  const workCtx = useMemo(() => readWorkItemContext(params), [params]);
  const showCtx = checkHasContext(workCtx);
  const ctxSearch = contextToSearch(workCtx);

  function handleClearContext() {
    setLocation("/verification");
  }

  return (
    <div className="space-y-4">
      {showCtx && (
        <div className="rounded-xl border p-3 mx-6 mt-4" data-testid="verification-context-banner">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold">Work item context detected</div>
              <div className="flex flex-wrap gap-2">
                {workCtx.workItemId && (
                  <Badge variant="outline" className="text-xs">
                    WorkItemId: {workCtx.workItemId}
                  </Badge>
                )}
                {workCtx.context && (
                  <Badge variant="outline" className="text-xs">
                    Context: {workCtx.context}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/ops/logs${ctxSearch}`}>
                <Button size="sm" variant="outline" data-testid="button-context-logs">
                  Logs
                </Button>
              </Link>
              <Link href={`/verification${ctxSearch}`}>
                <Button size="sm" variant="default" data-testid="button-context-verification">
                  Verification
                </Button>
              </Link>
              <Link href={`/artifacts${ctxSearch}`}>
                <Button size="sm" variant="outline" data-testid="button-context-artifacts">
                  Artifacts
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearContext}
                data-testid="button-context-clear"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      <CoveragePage />
    </div>
  );
}
