import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Lock, Save, Trash2, Users, Check, X } from "lucide-react";
import { Link } from "wouter";
import { CAST_PRESETS, inferPresetFromRepoHint, uniqSorted, type CastPresetKey } from "@/lib/castPresets";

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
  const [localParticipants, setLocalParticipants] = useState<string[]>([]);
  const [castSearch, setCastSearch] = useState("");
  const [showCastPicker, setShowCastPicker] = useState(false);
  const [presetKey, setPresetKey] = useState<CastPresetKey>("default");

  useEffect(() => {
    if (!data) return;
    setLocalTitle(data.title);
    setLocalBody(data.bodyMd);
    const inferred = inferPresetFromRepoHint(data.repo_hint);
    setPresetKey(inferred);
    const defaultCastForPreset = CAST_PRESETS[inferred].recommended;
    setLocalParticipants(uniqSorted(data.participants?.length ? data.participants : defaultCastForPreset));
  }, [data?.id]);

  const currentPreset = CAST_PRESETS[presetKey];

  const filteredCastOptions = useMemo(() => {
    const needle = castSearch.trim().toLowerCase();
    const options = uniqSorted(currentPreset.options);
    if (!needle) return options;
    return options.filter((n) => n.toLowerCase().includes(needle));
  }, [castSearch, currentPreset.options]);

  function toggleParticipant(name: string) {
    setLocalParticipants((prev) => {
      const set = new Set(prev);
      if (set.has(name)) set.delete(name);
      else set.add(name);
      return uniqSorted(Array.from(set));
    });
  }

  function applyPreset(key: CastPresetKey) {
    setPresetKey(key);
    setLocalParticipants(uniqSorted(CAST_PRESETS[key].recommended));
    toast({ title: `${CAST_PRESETS[key].label} Cast applied`, description: `Preset cast set for this Strategy Session.` });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/strategy-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: localTitle,
          bodyMd: localBody,
          participants: uniqSorted(localParticipants),
        }),
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

      {/* Cast controls */}
      <Card data-testid="card-cast-controls">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cast (Participants)
          </CardTitle>
          <CardDescription>
            Select a pod preset or curate who participates in the Strategy Session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preset buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={presetKey === "default" ? "default" : "outline"}
              onClick={() => applyPreset("default")}
              data-testid="button-preset-default"
            >
              Default
            </Button>
            <Button
              variant={presetKey === "gigsterGarage" ? "default" : "outline"}
              onClick={() => applyPreset("gigsterGarage")}
              data-testid="button-preset-gigsterGarage"
            >
              GigsterGarage
            </Button>
            <Button
              variant={presetKey === "tenantBilling" ? "default" : "outline"}
              onClick={() => applyPreset("tenantBilling")}
              data-testid="button-preset-tenantBilling"
            >
              Tenant & Billing
            </Button>
            <Button variant="outline" onClick={() => setShowCastPicker((v) => !v)} data-testid="button-curate-cast">
              {showCastPicker ? "Hide Curated Cast" : "Curate Cast"}
            </Button>
            <Badge variant="secondary" data-testid="badge-cast-count">Selected: {localParticipants.length}</Badge>
            <Badge variant="outline" data-testid="badge-preset-label">{currentPreset.label}</Badge>
          </div>

          {/* Selected chips */}
          <div className="flex flex-wrap gap-2">
            {localParticipants.map((p) => (
              <Badge key={p} variant="outline" className="gap-2" data-testid={`badge-participant-${p}`}>
                {p}
                <button
                  type="button"
                  className="opacity-70 hover:opacity-100"
                  onClick={() => toggleParticipant(p)}
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {localParticipants.length === 0 && (
              <div className="text-sm text-muted-foreground">No participants selected.</div>
            )}
          </div>

          {/* Curated picker */}
          {showCastPicker && (
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-medium">Curated Cast</div>
                <div className="w-full md:w-[360px]">
                  <Input
                    value={castSearch}
                    onChange={(e) => setCastSearch(e.target.value)}
                    placeholder="Search cast..."
                    data-testid="input-cast-search"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {filteredCastOptions.map((name) => {
                  const selected = localParticipants.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleParticipant(name)}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/40 ${
                        selected ? "bg-muted" : ""
                      }`}
                      data-testid={`button-cast-option-${name}`}
                    >
                      <span className="truncate">{name}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-muted-foreground">
                Tip: hit <span className="font-medium">Save</span> to persist cast changes.
              </div>
            </div>
          )}
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
