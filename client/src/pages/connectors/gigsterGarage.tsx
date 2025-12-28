import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type FileResult = { path: string; ok: boolean; content?: string; error?: string };

export default function GigsterGarageConnectorPage() {
  const [pathsText, setPathsText] = useState(
    "client/src/hooks/useAuth.ts\nclient/src/lib/queryClient.ts\nserver/routes.ts"
  );

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
          <CardTitle data-testid="text-connector-title">GigsterGarage Read-only Connector</CardTitle>
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
