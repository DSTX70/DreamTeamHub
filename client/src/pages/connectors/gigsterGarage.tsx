import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Activity, CheckCircle2, XCircle } from "lucide-react";

type FileResult = { path: string; ok: boolean; content?: string; error?: string };

type GGMeta = {
  ok: boolean;
  baseUrl?: string;
  adminUrl?: string;
  githubRepoUrl?: string;
  auditWorkflowUrl?: string;
  rule?: string;
  error?: string;
};

type GGHealth = {
  ok: boolean;
  urlTried?: string;
  status?: number;
  ms?: number;
  totalMs?: number;
  note?: string;
  error?: string;
};

export default function GigsterGarageConnectorPage() {
  const [pathsText, setPathsText] = useState(
    "client/src/hooks/useAuth.ts\nclient/src/lib/queryClient.ts\nserver/routes.ts"
  );

  const [meta, setMeta] = useState<GGMeta | null>(null);
  const [health, setHealth] = useState<GGHealth | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/connectors/gigsterGarage/meta");
        const j = (await r.json()) as GGMeta;
        setMeta(j);
      } catch (e: any) {
        setMeta({ ok: false, error: e?.message || "Failed to load meta" });
      }
    })();
  }, []);

  async function runHealthCheck() {
    setHealthChecking(true);
    setHealth(null);
    try {
      const r = await fetch("/api/connectors/gigsterGarage/health");
      const j = (await r.json()) as GGHealth;
      setHealth(j);
    } catch (e: any) {
      setHealth({ ok: false, error: e?.message || "Health check failed" });
    } finally {
      setHealthChecking(false);
    }
  }

  async function copyToClipboard(text?: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  const paths = useMemo(
    () =>
      pathsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [pathsText]
  );

  const m = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/connectors/gigsterGarage/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths, pathsText }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `fetch failed (${res.status})`);
      return (json.files || []) as FileResult[];
    },
  });

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-connector-title">GigsterGarage Connector — Quick Links</CardTitle>
          <CardDescription>
            {meta?.rule ?? "Rule: use published *.replit.app URL only (no IDE/preview)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(meta?.baseUrl)}
              disabled={!meta?.baseUrl}
              data-testid="button-copy-base-url"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy Base URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthCheck}
              disabled={healthChecking}
              data-testid="button-health-check"
            >
              <Activity className="mr-1 h-3 w-3" />
              {healthChecking ? "Checking…" : "Health Check"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild disabled={!meta?.baseUrl}>
              <a href={meta?.baseUrl || "#"} target="_blank" rel="noreferrer" data-testid="link-open-site">
                <ExternalLink className="mr-1 h-3 w-3" />
                Open Site
              </a>
            </Button>
            <Button variant="secondary" size="sm" asChild disabled={!meta?.adminUrl}>
              <a href={meta?.adminUrl || "#"} target="_blank" rel="noreferrer" data-testid="link-open-admin">
                <ExternalLink className="mr-1 h-3 w-3" />
                Open Admin
              </a>
            </Button>
            <Button variant="secondary" size="sm" asChild disabled={!meta?.githubRepoUrl}>
              <a href={meta?.githubRepoUrl || "#"} target="_blank" rel="noreferrer" data-testid="link-github-repo">
                <ExternalLink className="mr-1 h-3 w-3" />
                GitHub Repo
              </a>
            </Button>
            <Button variant="secondary" size="sm" asChild disabled={!meta?.auditWorkflowUrl}>
              <a href={meta?.auditWorkflowUrl || "#"} target="_blank" rel="noreferrer" data-testid="link-audit-workflow">
                <ExternalLink className="mr-1 h-3 w-3" />
                Audit Workflow
              </a>
            </Button>
          </div>

          {meta?.error && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              <span className="font-semibold">Meta error:</span> {meta.error}
            </div>
          )}

          {health && (
            <div className="rounded border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {health.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-semibold">Status:</span>
                <Badge variant={health.ok ? "secondary" : "destructive"}>
                  {health.ok ? "OK" : "Not OK"}
                </Badge>
                {typeof health.status === "number" && (
                  <Badge variant="outline">HTTP {health.status}</Badge>
                )}
                {typeof health.ms === "number" && (
                  <span className="text-muted-foreground">{health.ms}ms</span>
                )}
                {typeof health.totalMs === "number" && (
                  <span className="text-muted-foreground">(total {health.totalMs}ms)</span>
                )}
              </div>
              {health.urlTried && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Tried: <code className="rounded bg-muted px-1">{health.urlTried}</code>
                </div>
              )}
              {health.note && <div className="mt-1 text-xs">{health.note}</div>}
              {health.error && (
                <div className="mt-1 text-xs text-destructive">Error: {health.error}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Read-only File Fetch</CardTitle>
          <CardDescription>
            Server-side proxy fetch (read-only). No writes, no apply. Token never reaches the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={pathsText}
            onChange={(e) => setPathsText(e.target.value)}
            className="min-h-[120px]"
            data-testid="input-file-paths"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => m.mutate()} disabled={m.isPending || paths.length === 0} data-testid="button-fetch-files">
              Fetch files
            </Button>
            {m.isPending ? <Badge variant="secondary">Loading…</Badge> : null}
            {m.error ? <Badge variant="destructive" data-testid="badge-error">{(m.error as Error).message}</Badge> : null}
            {Array.isArray(m.data) ? <Badge variant="secondary" data-testid="badge-file-count">Files: {m.data.length}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {Array.isArray(m.data) ? (
        <div className="space-y-3">
          {m.data.map((f) => (
            <Card key={f.path}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base" data-testid={`text-file-path-${f.path.replace(/[^a-zA-Z0-9]/g, "-")}`}>{f.path}</CardTitle>
                  <Badge variant={f.ok ? "secondary" : "destructive"}>{f.ok ? "OK" : "FAIL"}</Badge>
                </div>
                {!f.ok && f.error ? <CardDescription>{f.error}</CardDescription> : null}
              </CardHeader>
              {f.ok ? (
                <CardContent>
                  <Textarea value={f.content || ""} readOnly className="min-h-[220px]" />
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
