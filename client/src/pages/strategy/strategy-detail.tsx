import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Lock, Save, Trash2 } from "lucide-react";
import { Link } from "wouter";

type StrategySession = {
  id: string;
  title: string;
  status: "OPEN" | "LOCKED" | "ARCHIVED";
  mode: "STRATEGY / BRAINSTORM (NON-EXECUTING)";
  author: string;
  approval_required_for_execution: boolean;
  repo_hint?: string;
  goal?: string;
  participants?: string[];
  questions?: string[];
  bodyMd: string;
  created_at: string;
  updated_at: string;
  locked_at?: string;
};

export default function StrategyDetailPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/strategy/:id");
  const id = params?.id as string;

  const { data, isLoading, error } = useQuery<StrategySession>({
    queryKey: ["/api/strategy-sessions", id],
  });

  const [localTitle, setLocalTitle] = useState("");
  const [localBody, setLocalBody] = useState("");

  useEffect(() => {
    if (!data) return;
    setLocalTitle(data.title);
    setLocalBody(data.bodyMd);
  }, [data?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/strategy-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: localTitle, bodyMd: localBody }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      return (await res.json()) as StrategySession;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions", id] });
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      toast({ title: "Saved", description: "Strategy Session updated." });
    },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/strategy-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "LOCKED" }),
      });
      if (!res.ok) throw new Error(`Lock failed (${res.status})`);
      return (await res.json()) as StrategySession;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions", id] });
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      toast({ title: "Locked", description: "Direction locked. Execution still requires explicit approval." });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!data || data.status !== "LOCKED") {
        throw new Error("Strategy must be LOCKED before converting to a Work Item.");
      }

      const payload = {
        title: data.title.replace(/Strategy Session/i, "Work Item").trim() || data.title,
        owner: data.author || "agent",
        inputs: data.bodyMd || "Strategy session content",
        output: `Execute the locked strategy: ${data.goal || data.title}`,
        autonomy: "L1",
        playbook: `## Strategy Provenance\n\n**Source:** Strategy Session ${data.id}\n**Locked at:** ${data.locked_at || "N/A"}\n**Repo Hint:** ${data.repo_hint || "Gigster Garage (pilot candidate)"}\n\n---\n\n${data.bodyMd}`,
      };

      const res = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Convert failed (${res.status}) ${text}`.trim());
      }
      return (await res.json()) as { id: number };
    },
    onSuccess: async (wi) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/work-items"] });
      toast({ title: "Converted", description: "Strategy locked → Work Item created." });
      if (wi?.id) setLocation(`/work-items/${wi.id}`);
      else setLocation("/work");
    },
    onError: (err: Error) => {
      toast({ title: "Conversion failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/strategy-sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      toast({ title: "Deleted", description: "Strategy Session removed." });
      setLocation("/strategy");
    },
  });

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  if (error || !data) return <div className="p-4 text-sm">Not found.</div>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Link href="/strategy">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle data-testid="text-session-title">{data.title}</CardTitle>
              <CardDescription>
                <span className="font-medium">NON-EXECUTING</span> brainstorm space. No code drops or repo changes.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={data.status === "OPEN" ? "default" : "secondary"} data-testid="badge-status">{data.status}</Badge>
              <Badge variant="outline">Strategy</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save"
          >
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button
            variant="outline"
            onClick={() => lockMutation.mutate()}
            disabled={lockMutation.isPending || data.status === "LOCKED"}
            title="Locks direction; execution still requires approval in Work Items."
            data-testid="button-lock"
          >
            <Lock className="mr-2 h-4 w-4" /> Lock Direction
          </Button>
          <Button
            variant="default"
            onClick={() => convertMutation.mutate()}
            disabled={convertMutation.isPending || data.status !== "LOCKED"}
            title={data.status === "LOCKED" ? "Create a Work Item seeded with this Strategy Session" : "Lock direction first"}
            data-testid="button-convert"
          >
            <ArrowRight className="mr-2 h-4 w-4" /> Convert to Work Item
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            title="Delete session"
            data-testid="button-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Session</CardTitle>
          <CardDescription>Update the title and the session body. Lock when ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Title</div>
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              data-testid="input-title"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Body (Markdown)</div>
            <Textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              className="min-h-[420px] font-mono text-sm"
              data-testid="textarea-body"
            />
          </div>
        </CardContent>
      </Card>

      {data.locked_at && (
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">
              <strong>Locked at:</strong> {new Date(data.locked_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
