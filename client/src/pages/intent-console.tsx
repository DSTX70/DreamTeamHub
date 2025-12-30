import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Target, Users, Wand2, X, Search, ClipboardCopy, Sparkles, ArrowRight, FileCode, Download, Upload } from "lucide-react";
import { useCastingPrefs } from "@/hooks/useCastingPrefs";
import { useCastOptions, CastOption } from "@/hooks/useCastOptions";
import { dedupeCanonSlugs, toCanonSlug } from "@/lib/canonSlugMap";
import { useTargetContext } from "@/hooks/useTargetContext";

type Autonomy = "guided" | "standard" | "autonomous";

type IntentStrategyDraft = {
  repo: string;
  intentBlock: string;
  strategyBlock: string;
  evidenceRequest: string;
  fileFetchPaths: string[];
  meta?: {
    confidence?: number;
    assumptions?: string[];
    blockers?: string[];
  };
};

type StrategySession = {
  id: string;
};

function buildTitle(intent: string): string {
  const clean = intent.trim().replace(/\s+/g, " ");
  if (!clean) return "New work item";
  return clean.length <= 80 ? clean : `${clean.slice(0, 77)}...`;
}

function normalizeManualSlugs(raw: string): string[] {
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function optionLabelBySlug(options: CastOption[], slug: string): string {
  const canon = toCanonSlug(slug);
  const hit = options.find((o) => o.slug === canon) || options.find((o) => o.slug === slug);
  return hit?.label ?? canon ?? slug;
}

function formatCastReceipt(params: {
  mode: "auto" | "curated";
  targetContext: string;
  podSlugs: string[];
  personaSlugs: string[];
  podOptions: CastOption[];
  personaOptions: CastOption[];
  autonomy: string;
}) {
  const { mode, targetContext, podSlugs, personaSlugs, podOptions, personaOptions, autonomy } = params;

  const lines: string[] = [];
  lines.push("Cast Receipt");
  lines.push(`Mode: ${mode.toUpperCase()}`);
  lines.push(`Autonomy: ${autonomy.toUpperCase()}`);
  lines.push(`Target Context: ${targetContext}`);

  lines.push("Pods:");
  if (mode === "auto" || podSlugs.length === 0) {
    lines.push("  - AUTO");
  } else {
    for (const s of podSlugs) {
      const canon = toCanonSlug(s);
      lines.push(`  - name: ${optionLabelBySlug(podOptions, canon)} | slug: ${canon}`);
    }
  }

  lines.push("Personas:");
  if (mode === "auto" || personaSlugs.length === 0) {
    lines.push("  - AUTO");
  } else {
    for (const s of personaSlugs) {
      const canon = toCanonSlug(s);
      lines.push(`  - name: ${optionLabelBySlug(personaOptions, canon)} | slug: ${canon}`);
    }
  }

  return lines.join("\n");
}

function toggleInListCanon(list: string[], value: string): string[] {
  const canon = toCanonSlug(value.trim());
  if (!canon) return list;
  return list.includes(canon) ? list.filter((x) => x !== canon) : [...list, canon];
}

function formatDraftIntoStrategyBody(draft: IntentStrategyDraft) {
  const files = (draft.fileFetchPaths || []).map((p) => `- ${p}`).join("\n");
  const confidence = typeof draft.meta?.confidence === "number" ? draft.meta?.confidence : undefined;

  const metaLines: string[] = [];
  if (confidence != null) metaLines.push(`- confidence: ${confidence}`);
  if (draft.meta?.assumptions?.length) metaLines.push(`- assumptions: ${draft.meta.assumptions.join("; ")}`);
  if (draft.meta?.blockers?.length) metaLines.push(`- blockers: ${draft.meta.blockers.join("; ")}`);

  return [
    `# Pilot G — Draft Intent + Strategy`,
    ``,
    `> Repo: ${draft.repo}`,
    metaLines.length ? `> Meta:\n> ${metaLines.join("\n> ")}` : ``,
    ``,
    `---`,
    ``,
    draft.intentBlock.trim(),
    ``,
    `---`,
    ``,
    draft.strategyBlock.trim(),
    ``,
    `---`,
    ``,
    `## Evidence Request (paste into Intent Evidence Needed)`,
    draft.evidenceRequest.trim(),
    ``,
    `## Suggested Files to Fetch (via connector)`,
    files || "- (none suggested)",
    ``,
  ]
    .filter(Boolean)
    .join("\n");
}

type FetchedFile = { path: string; ok: boolean; content?: string; error?: string };

function normalizeFilesResponse(j: any): FetchedFile[] {
  const files = Array.isArray(j) ? j : j?.files ?? j?.data ?? [];
  if (!Array.isArray(files)) return [];
  return files.map((f: any) => ({
    path: String(f?.path ?? f?.name ?? "").trim(),
    ok: Boolean(f?.ok ?? (typeof f?.content === "string" && f.content.length >= 0)),
    content: typeof f?.content === "string" ? f.content : f?.text,
    error: f?.error ? String(f.error) : undefined,
  }));
}

function buildEvidenceBlock(baseUrl: string | undefined, files: FetchedFile[]): string {
  const header = [
    "## GigsterGarage Evidence Pack (Fetched via DTH Connector)",
    baseUrl ? `Base URL: ${baseUrl}` : "",
    `Fetched at: ${new Date().toISOString()}`,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const body = files
    .map((f) => {
      if (!f.ok) {
        return `### ${f.path}\n> Fetch failed: ${f.error ?? "unknown error"}\n`;
      }
      const content = f.content ?? "";
      return `### ${f.path}\n\`\`\`\n${content}\n\`\`\`\n`;
    })
    .join("\n");

  return `${header}\n${body}`.trim() + "\n";
}

export default function IntentConsolePage() {
  const [intent, setIntent] = useState("");
  const [autonomy, setAutonomy] = useState<Autonomy>("standard");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { targetContext, setTargetContext, contextOptions } = useTargetContext();
  const { mode, setMode, pods, setPods, personas, setPersonas } = useCastingPrefs();
  const { pods: podOptions, podsOk, podsLoading, personas: personaOptions, personasOk, personasLoading } = useCastOptions();

  const [podFilter, setPodFilter] = useState("");
  const [personaFilter, setPersonaFilter] = useState("");
  const [manualPods, setManualPods] = useState("");
  const [manualPersonas, setManualPersonas] = useState("");

  // Pilot G draft state
  const [draft, setDraft] = useState<IntentStrategyDraft | null>(null);

  // Suggested files fetch state (GG Connector integration)
  const [fetchedFiles, setFetchedFiles] = useState<FetchedFile[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [fetchFilesError, setFetchFilesError] = useState<string | null>(null);
  const [ggMetaBaseUrl, setGgMetaBaseUrl] = useState<string | undefined>(undefined);

  // Active Work Item ID (auto-targeted after all-in-one creation)
  const [activeWorkItemId, setActiveWorkItemId] = useState<number | null>(null);

  // Refs to access latest evidence in async mutation context
  const evidenceBlockRef = useRef<string>("");
  const hasFetchedFilesRef = useRef<boolean>(false);
  const ggBaseUrlRef = useRef<string | undefined>(undefined);

  // Keep refs up-to-date so mutationFn can reliably access latest evidence
  useEffect(() => {
    evidenceBlockRef.current = buildEvidenceBlock(ggMetaBaseUrl, fetchedFiles);
    hasFetchedFilesRef.current = Array.isArray(fetchedFiles) && fetchedFiles.length > 0;
    ggBaseUrlRef.current = ggMetaBaseUrl;
  }, [ggMetaBaseUrl, fetchedFiles]);

  // Fetch GG connector meta on mount (for baseUrl display)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/connectors/gigsterGarage/meta");
        const j = await r.json();
        if (j?.ok && j?.baseUrl) setGgMetaBaseUrl(String(j.baseUrl));
      } catch {
        // ignore
      }
    })();
  }, []);

  // Fetch files from GG connector
  async function fetchSuggestedFiles(paths: string[]) {
    if (!paths?.length) return;
    setFetchingFiles(true);
    setFetchFilesError(null);
    setFetchedFiles([]);

    try {
      const r = await fetch("/api/connectors/gigsterGarage/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paths, pathsText: paths.join("\n") }),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Fetch failed (${r.status}): ${t}`);
      }

      const j = await r.json();
      const normalized = normalizeFilesResponse(j);
      setFetchedFiles(normalized);
    } catch (e: any) {
      setFetchFilesError(e?.message ?? "Failed to fetch suggested files.");
    } finally {
      setFetchingFiles(false);
    }
  }

  // Evidence block computed from fetched files
  const evidenceBlock = useMemo(() => buildEvidenceBlock(ggMetaBaseUrl, fetchedFiles), [ggMetaBaseUrl, fetchedFiles]);

  // Attach evidence to Work Item (server-side append)
  // Uses activeWorkItemId if set (after all-in-one creation), otherwise prompts
  async function attachEvidenceToWorkItem() {
    let id = activeWorkItemId;

    if (!id) {
      const raw = window.prompt("Attach evidence to which Work Item ID?", "");
      if (!raw) return;

      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast({ title: "Invalid", description: "Invalid Work Item ID.", variant: "destructive" });
        return;
      }
      id = parsed;
    }

    try {
      const r = await fetch(`/api/work-items/${id}/actions/appendEvidenceNotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ evidenceNotes: evidenceBlock }),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Attach failed (${r.status}): ${t}`);
      }

      const j = await r.json();
      setActiveWorkItemId(id);
      toast({
        title: "Attached",
        description: `Evidence appended to Work Item #${id}. ${j.appendedChars ?? 0} chars added.`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to attach evidence.", variant: "destructive" });
    }
  }

  // Dynamic label for attach button
  const attachLabel = activeWorkItemId ? `Attach to WI #${activeWorkItemId}` : "Attach to Work Item…";

  // Helper to append evidence to a specific work item id (no prompt, for auto-attach)
  async function appendEvidenceToWorkItemId(workItemId: number): Promise<{ ok: boolean; skipped: boolean; reason?: string }> {
    const block = String(evidenceBlockRef.current || "").trim();
    if (!block) return { ok: false, skipped: true, reason: "empty_evidence" };

    const r = await fetch(`/api/work-items/${workItemId}/actions/appendEvidenceNotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ evidenceNotes: block }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Auto-attach failed (${r.status}): ${t}`);
    }

    return { ok: true, skipped: false };
  }

  // Helper to fetch files via connector (returns normalized files) — for one-button flow
  async function fetchFilesViaConnector(paths: string[]): Promise<FetchedFile[]> {
    const r = await fetch("/api/connectors/gigsterGarage/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ paths, pathsText: paths.join("\n") }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Connector fetch failed (${r.status}): ${t}`);
    }

    const j = await r.json();
    return normalizeFilesResponse(j);
  }

  // Helper to append evidenceNotes to a specific work item (takes text explicitly)
  async function appendEvidenceNotesToWorkItem(workItemId: number, evidenceNotesText: string) {
    const block = String(evidenceNotesText || "").trim();
    if (!block) return { ok: false, skipped: true as const, reason: "empty_evidence" };

    const r = await fetch(`/api/work-items/${workItemId}/actions/appendEvidenceNotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ evidenceNotes: block }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Auto-attach failed (${r.status}): ${t}`);
    }

    return { ok: true, skipped: false as const };
  }

  // Coerce suggested paths from draft (handles various field names)
  function coerceSuggestedPaths(d: IntentStrategyDraft): string[] {
    const raw = d?.fileFetchPaths ?? (d as any)?.suggestedPaths ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => String(p || "").trim()).filter(Boolean);
  }

  const title = useMemo(() => buildTitle(intent), [intent]);

  const effectivePodSlugs = useMemo(() => {
    if (mode !== "curated") return [];
    const raw = podsOk ? pods : normalizeManualSlugs(manualPods);
    return dedupeCanonSlugs(raw);
  }, [mode, podsOk, pods, manualPods, pods]);

  const effectivePersonaSlugs = useMemo(() => {
    if (mode !== "curated") return [];
    const raw = personasOk ? personas : normalizeManualSlugs(manualPersonas);
    return dedupeCanonSlugs(raw);
  }, [mode, personasOk, personas, manualPersonas, personas]);

  const filteredPodOptions = useMemo(() => {
    const q = podFilter.trim().toLowerCase();
    if (!q) return podOptions;
    return podOptions.filter((p) => p.label.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [podOptions, podFilter]);

  const filteredPersonaOptions = useMemo(() => {
    const q = personaFilter.trim().toLowerCase();
    if (!q) return personaOptions;
    return personaOptions.filter((p) => p.label.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [personaOptions, personaFilter]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const castReceipt = formatCastReceipt({
        mode,
        targetContext,
        podSlugs: effectivePodSlugs,
        personaSlugs: effectivePersonaSlugs,
        podOptions,
        personaOptions,
        autonomy,
      });

      const payload = {
        title,
        description:
          (intent ? `Intent: ${intent.trim()}\n\n` : "") +
          `Autonomy: ${autonomy.toUpperCase()}\n\n---\n${castReceipt}\n---\n`,
        status: "todo",
        priority: "medium",
      };

      return apiRequest("POST", "/api/work-items", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/work-items"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/control/dashboard"] });
      toast({
        title: "Queued",
        description:
          mode === "curated"
            ? "Your intent + curated cast + target context were converted into a governed work item."
            : "Your intent + target context were converted into a governed work item.",
      });
      setIntent("");
      setDraft(null);
      setLocation("/work-orders");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not create a work item from that intent.",
        variant: "destructive",
      });
    },
  });

  // Pilot G: Draft Intent + Strategy (server endpoint exists)
  const draftMutation = useMutation({
    mutationFn: async () => {
      if (!intent.trim()) throw new Error("Intent is empty");
      const res = await fetch(`/api/work-items/0/actions/draftIntentStrategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taskText: intent.trim(),
          repoHint: targetContext || "GigsterGarage",
          title,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const msg = json?.error || `Draft failed (${res.status})`;
        const err: any = new Error(msg);
        err.payload = json;
        throw err;
      }
      return json as { ok: true } & IntentStrategyDraft;
    },
    onSuccess: (d) => {
      setDraft(d);
      toast({
        title: "Draft ready",
        description: "Pilot G produced a formal Intent + Strategy draft. Apply it with one click.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Draft failed",
        description: err?.message || "Could not draft Intent + Strategy.",
        variant: "destructive",
      });
    },
  });

  // Create a Strategy Session from the draft and navigate to it
  const createStrategyFromDraft = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("No draft available");
      const bodyMd = formatDraftIntoStrategyBody(draft);

      const res = await fetch("/api/strategy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Strategy Session — ${title}`,
          author: "Dustin Sparks",
          approval_required_for_execution: true,
          repo_hint: draft.repo || targetContext || "GigsterGarage",
          bodyMd,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.error || `Failed to create strategy session (${res.status})`;
        throw new Error(msg);
      }
      return json as StrategySession;
    },
    onSuccess: async (s) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      toast({ title: "Strategy created", description: "Draft applied to a new Strategy Session." });
      setLocation(`/strategy/${s.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Create strategy failed", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  // Pilot G: Draft → Create Work Item + Strategy → Open Work Item (all-in-one)
  const draftCreateAllMutation = useMutation({
    mutationFn: async () => {
      if (!intent.trim()) throw new Error("Intent is empty");

      // Step 1: Draft Intent + Strategy
      const draftRes = await fetch(`/api/work-items/0/actions/draftIntentStrategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taskText: intent.trim(),
          repoHint: targetContext || "GigsterGarage",
          title,
        }),
      });
      const draftJson = await draftRes.json().catch(() => null);
      if (!draftRes.ok || !draftJson?.ok) {
        throw new Error(draftJson?.error || `Draft failed (${draftRes.status})`);
      }
      const draftData = draftJson as IntentStrategyDraft;

      // Step 2: Create Strategy Session from draft
      const strategyBody = formatDraftIntoStrategyBody(draftData);
      const strategyRes = await fetch("/api/strategy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Strategy Session — ${title}`,
          author: "Dustin Sparks",
          approval_required_for_execution: true,
          repo_hint: draftData.repo || targetContext || "GigsterGarage",
          bodyMd: strategyBody,
        }),
      });
      const strategyJson = await strategyRes.json().catch(() => null);
      if (!strategyRes.ok) {
        throw new Error(strategyJson?.error || `Strategy creation failed (${strategyRes.status})`);
      }
      const strategyData = strategyJson as StrategySession;

      // Step 3: Create Work Item with reference to strategy
      const castReceipt = formatCastReceipt({
        mode,
        targetContext,
        podSlugs: effectivePodSlugs,
        personaSlugs: effectivePersonaSlugs,
        podOptions,
        personaOptions,
        autonomy,
      });

      const workItemPayload = {
        title,
        description:
          `Intent: ${draftData.intentBlock.trim()}\n\n` +
          `Strategy Session: /strategy/${strategyData.id}\n\n` +
          `Autonomy: ${autonomy.toUpperCase()}\n\n---\n${castReceipt}\n---\n`,
        status: "todo",
        priority: "medium",
      };

      const workItemRes = await apiRequest("POST", "/api/work-items", workItemPayload);
      const workItemData = await workItemRes.json();

      // Step 4: Auto-attach evidence if files were already fetched
      let evidenceAutoAttached = false;
      if (hasFetchedFilesRef.current && String(evidenceBlockRef.current || "").trim().length > 0) {
        await appendEvidenceToWorkItemId(workItemData.id);
        evidenceAutoAttached = true;
      }

      return { draft: draftData, strategy: strategyData, workItem: workItemData, evidenceAutoAttached };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/work-items"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/control/dashboard"] });
      setIntent("");
      setDraft(null);
      setActiveWorkItemId(result.workItem.id);
      toast({
        title: "All created",
        description: result.evidenceAutoAttached
          ? "Draft → Strategy → Work Item created. Evidence auto-attached. Opening…"
          : "Draft → Strategy → Work Item created. Opening…",
      });
      setLocation(`/work-items/${result.workItem.id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Failed",
        description: err?.message || "Could not complete the draft → create flow.",
        variant: "destructive",
      });
    },
  });

  // One-button flow: Draft → Fetch Files → Create Strategy + Work Item → Attach Evidence → Open
  const draftFetchCreateAllMutation = useMutation({
    mutationFn: async () => {
      if (!intent.trim()) throw new Error("Intent is empty");

      // Step 1: Draft Intent + Strategy (Pilot G)
      const draftRes = await fetch(`/api/work-items/0/actions/draftIntentStrategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taskText: intent.trim(),
          repoHint: targetContext || "GigsterGarage",
          title,
        }),
      });

      const draftJson = await draftRes.json().catch(() => null);
      if (!draftRes.ok || !draftJson?.ok) {
        throw new Error(draftJson?.error || `Draft failed (${draftRes.status})`);
      }
      const draftData = draftJson as IntentStrategyDraft;

      // Step 1.5: Parse suggested paths + fetch files (via DTH→GG connector)
      const paths = coerceSuggestedPaths(draftData);
      let fetched: FetchedFile[] = [];
      let fetchOk = false;
      let fetchError: string | null = null;

      if (paths.length > 0) {
        try {
          fetched = await fetchFilesViaConnector(paths);
          fetchOk = true;
        } catch (e: any) {
          fetchError = e?.message || "File fetch failed";
        }
      }

      // Build evidence block NOW (even if partial fetch; it will include failures)
      const evidenceText =
        fetched.length > 0
          ? buildEvidenceBlock(ggBaseUrlRef.current, fetched)
          : paths.length > 0 && fetchError
            ? [
                "## GigsterGarage Evidence Pack (Fetch Failed)",
                ggBaseUrlRef.current ? `Base URL: ${ggBaseUrlRef.current}` : "",
                `Fetched at: ${new Date().toISOString()}`,
                "",
                `Paths requested:`,
                ...paths.map((p) => `- ${p}`),
                "",
                `Fetch error: ${fetchError}`,
                "",
              ].filter(Boolean).join("\n")
            : "";

      // Step 2: Create Strategy Session from draft
      const strategyBody = formatDraftIntoStrategyBody(draftData);
      const strategyRes = await fetch("/api/strategy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Strategy Session — ${title}`,
          author: "Dustin Sparks",
          approval_required_for_execution: true,
          repo_hint: draftData.repo || targetContext || "GigsterGarage",
          bodyMd: strategyBody,
        }),
      });

      const strategyJson = await strategyRes.json().catch(() => null);
      if (!strategyRes.ok) {
        throw new Error(strategyJson?.error || `Strategy creation failed (${strategyRes.status})`);
      }
      const strategyData = strategyJson as StrategySession;

      // Step 3: Create Work Item with reference to strategy
      const castReceipt = formatCastReceipt({
        mode,
        targetContext,
        podSlugs: effectivePodSlugs,
        personaSlugs: effectivePersonaSlugs,
        podOptions,
        personaOptions,
        autonomy,
      });

      const workItemPayload = {
        title,
        description:
          `Intent: ${draftData.intentBlock.trim()}\n\n` +
          `Strategy Session: /strategy/${strategyData.id}\n\n` +
          `Autonomy: ${autonomy.toUpperCase()}\n\n---\n${castReceipt}\n---\n`,
        status: "todo",
        priority: "medium",
      };

      const workItemRes = await apiRequest("POST", "/api/work-items", workItemPayload);
      const workItemData = await workItemRes.json();

      // Step 4: Auto-attach evidenceNotes (only if we have an evidenceText)
      let evidenceAutoAttached = false;
      if (String(evidenceText || "").trim().length > 0) {
        await appendEvidenceNotesToWorkItem(workItemData.id, evidenceText);
        evidenceAutoAttached = true;
      }

      return {
        draft: draftData,
        strategy: strategyData,
        workItem: workItemData,
        suggestedPaths: paths,
        fetchedFiles: fetched,
        fetchOk,
        fetchError,
        evidenceAutoAttached,
      };
    },

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/work-items"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/strategy-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/control/dashboard"] });

      setIntent("");
      setDraft(null);
      setFetchedFiles(result.fetchedFiles || []);
      setActiveWorkItemId(result.workItem.id);

      toast({
        title: "All created",
        description: result.evidenceAutoAttached
          ? "Draft → Fetch Files → Strategy → Work Item. Evidence auto-attached. Opening…"
          : (result.suggestedPaths?.length
              ? "Draft → Fetch Files → Strategy → Work Item. (Evidence not attached—see fetch status.) Opening…"
              : "Draft → Strategy → Work Item. (No suggested files.) Opening…"),
      });

      setLocation(`/work-items/${result.workItem.id}`);
    },

    onError: (err: any) => {
      toast({
        title: "All-in-one failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  async function copyToClipboard(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: label });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">
          Intent
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a Target Context (repo/app), then Auto-Cast or Curated-Cast. Pilot G can draft formal Intent + Strategy from your natural language.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            What are you trying to accomplish?
          </CardTitle>
          <CardDescription>Outcome-first. Add context + cast when you want unique, non-generic results.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Context</label>
              <Select value={targetContext} onValueChange={setTargetContext}>
                <SelectTrigger data-testid="intent-target-context">
                  <SelectValue placeholder="Select target…" />
                </SelectTrigger>
                <SelectContent>
                  {contextOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This tells downstream shipping/verification where the work should land.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Autonomy</label>
              <Select value={autonomy} onValueChange={(v) => setAutonomy(v as Autonomy)}>
                <SelectTrigger data-testid="intent-autonomy">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guided">Guided</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="autonomous">Autonomous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Intent</label>
            <Textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Agency Hub Save shows 'An error occurred' when saving marketing concept and images."
              className="min-h-32"
              data-testid="intent-textarea"
            />
          </div>

          {/* Pilot G: Draft + Apply */}
          <div className="rounded-lg border p-4 space-y-3" data-testid="pilotg-panel">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Pilot G — Draft Intent + Strategy
                </div>
                <div className="text-xs text-muted-foreground">
                  One click drafts formal blocks + evidence request. Then you can apply them into a Strategy Session automatically.
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => draftMutation.mutate()}
                  disabled={!intent.trim() || draftMutation.isPending}
                  data-testid="pilotg-draft"
                >
                  Draft Intent + Strategy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!draft) return;
                    setIntent(draft.intentBlock);
                    toast({ title: "Applied", description: "Draft Intent applied into the Intent field." });
                  }}
                  disabled={!draft}
                  data-testid="pilotg-apply-intent"
                >
                  Apply Draft to Intent
                </Button>
                <Button
                  type="button"
                  onClick={() => createStrategyFromDraft.mutate()}
                  disabled={!draft || createStrategyFromDraft.isPending}
                  className="gap-2"
                  data-testid="pilotg-create-strategy"
                >
                  Create Strategy Session <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => draftFetchCreateAllMutation.mutate()}
                  disabled={!intent.trim() || draftFetchCreateAllMutation.isPending}
                  className="gap-2"
                  data-testid="pilotg-draft-fetch-create-all"
                >
                  {draftFetchCreateAllMutation.isPending ? "Working…" : "Draft → Fetch → Create + Attach → Open"}
                </Button>
              </div>
            </div>

            {draft ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">Repo: {draft.repo}</Badge>
                  {typeof draft.meta?.confidence === "number" ? (
                    <Badge variant="outline">Confidence: {Math.round(draft.meta.confidence * 100)}%</Badge>
                  ) : null}
                  {draft.fileFetchPaths?.length ? (
                    <Badge variant="outline">Files suggested: {draft.fileFetchPaths.length}</Badge>
                  ) : (
                    <Badge variant="outline">Files suggested: 0</Badge>
                  )}
                </div>

                <div className="rounded-md bg-muted/40 p-3 text-sm space-y-2" data-testid="pilotg-evidence-request">
                  <div className="font-medium">Evidence request (paste this next):</div>
                  <div className="whitespace-pre-wrap">{draft.evidenceRequest}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => copyToClipboard("Evidence request copied", draft.evidenceRequest)}
                      data-testid="pilotg-copy-evidence"
                    >
                      <ClipboardCopy className="h-4 w-4" /> Copy evidence request
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => copyToClipboard("Suggested file paths copied", (draft.fileFetchPaths || []).join("\n"))}
                      data-testid="pilotg-copy-files"
                    >
                      <ClipboardCopy className="h-4 w-4" /> Copy file fetch list
                    </Button>
                  </div>
                </div>

                {/* Suggested Files Fetch (GG Connector) */}
                {draft.fileFetchPaths && draft.fileFetchPaths.length > 0 && (
                  <div className="rounded-md border p-3 space-y-3" data-testid="pilotg-suggested-files">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <FileCode className="h-4 w-4" /> Suggested Files (from Pilot G)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fetch these files from GigsterGarage via the DTH connector, then copy the evidence block.
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-2"
                          onClick={() => fetchSuggestedFiles(draft.fileFetchPaths)}
                          disabled={fetchingFiles}
                          data-testid="pilotg-fetch-files"
                        >
                          <Download className="h-4 w-4" />
                          {fetchingFiles ? "Fetching…" : "Fetch Suggested Files"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => copyToClipboard("Evidence block copied", evidenceBlock)}
                          disabled={!fetchedFiles.length}
                          data-testid="pilotg-copy-evidence-block"
                        >
                          <ClipboardCopy className="h-4 w-4" /> Copy Evidence Block
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="gap-2"
                          onClick={attachEvidenceToWorkItem}
                          disabled={!fetchedFiles.length}
                          data-testid="pilotg-attach-evidence"
                        >
                          <Upload className="h-4 w-4" /> {attachLabel}
                        </Button>
                      </div>
                    </div>

                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {draft.fileFetchPaths.map((p) => (
                        <li key={p}>
                          <code className="bg-muted px-1 rounded">{p}</code>
                        </li>
                      ))}
                    </ul>

                    {fetchFilesError && (
                      <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                        <span className="font-semibold">Fetch error:</span> {fetchFilesError}
                      </div>
                    )}

                    {fetchedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Fetched Files ({fetchedFiles.filter(f => f.ok).length}/{fetchedFiles.length} OK)</div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {fetchedFiles.map((f) => (
                            <div key={f.path} className="rounded border p-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <code className="font-medium">{f.path}</code>
                                <Badge variant={f.ok ? "secondary" : "destructive"} className="text-xs">
                                  {f.ok ? "OK" : "FAIL"}
                                </Badge>
                              </div>
                              {!f.ok && f.error && (
                                <div className="mt-1 text-muted-foreground">{f.error}</div>
                              )}
                              {f.ok && f.content && (
                                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
                                  {f.content.slice(0, 2000)}{f.content.length > 2000 ? "\n…(truncated)" : ""}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Draft output will appear here after you click <span className="font-medium">Draft Intent + Strategy</span>.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Casting</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "auto" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setMode("auto")}
                data-testid="cast-auto"
              >
                <Wand2 className="h-4 w-4" />
                Auto-Cast
              </Button>
              <Button
                type="button"
                variant={mode === "curated" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setMode("curated")}
                data-testid="cast-curated"
              >
                <Users className="h-4 w-4" />
                Curated-Cast
              </Button>
            </div>
          </div>

          {mode === "curated" && (
            <div className="rounded-lg border p-4 space-y-4" data-testid="curated-panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">Curated Cast (canonical slugs)</div>
                  <div className="text-xs text-muted-foreground">Your selections + Target Context are written into the work item receipt.</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPods([]);
                    setPersonas([]);
                    setManualPods("");
                    setManualPersonas("");
                  }}
                  className="gap-2"
                  data-testid="cast-clear"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {/* Pods */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Pods</label>
                  <span className="text-xs text-muted-foreground">Selected: {effectivePodSlugs.length}</span>
                </div>

                {podsOk ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={podFilter}
                        onChange={(e) => setPodFilter(e.target.value)}
                        placeholder={podsLoading ? "Loading…" : "Filter by label or slug…"}
                        data-testid="pods-filter"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {filteredPodOptions.slice(0, 80).map((o) => {
                        const canon = toCanonSlug(o.slug);
                        const selected = effectivePodSlugs.includes(canon);
                        return (
                          <Badge
                            key={o.slug}
                            variant={selected ? "default" : "secondary"}
                            className="cursor-pointer select-none"
                            onClick={() => setPods(toggleInListCanon(pods, o.slug))}
                            title={`slug: ${o.slug}${canon !== o.slug ? ` → canon: ${canon}` : ""}`}
                            data-testid={`pod-${o.slug}`}
                          >
                            {o.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <Input value={manualPods} onChange={(e) => setManualPods(e.target.value)} placeholder="Comma-separated pod slugs…" data-testid="pods-manual" />
                )}
              </div>

              {/* Personas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Personas</label>
                  <span className="text-xs text-muted-foreground">Selected: {effectivePersonaSlugs.length}</span>
                </div>

                {personasOk ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={personaFilter}
                        onChange={(e) => setPersonaFilter(e.target.value)}
                        placeholder={personasLoading ? "Loading…" : "Filter by label or slug…"}
                        data-testid="personas-filter"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {filteredPersonaOptions.slice(0, 120).map((o) => {
                        const canon = toCanonSlug(o.slug);
                        const selected = effectivePersonaSlugs.includes(canon);
                        return (
                          <Badge
                            key={o.slug}
                            variant={selected ? "default" : "secondary"}
                            className="cursor-pointer select-none"
                            onClick={() => setPersonas(toggleInListCanon(personas, o.slug))}
                            title={`slug: ${o.slug}${canon !== o.slug ? ` → canon: ${canon}` : ""}`}
                            data-testid={`persona-${o.slug}`}
                          >
                            {o.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <Input
                    value={manualPersonas}
                    onChange={(e) => setManualPersonas(e.target.value)}
                    placeholder="Comma-separated persona slugs…"
                    data-testid="personas-manual"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={!intent.trim() || createMutation.isPending} data-testid="intent-submit">
              Create Work Item
            </Button>
            <Button variant="outline" onClick={() => setLocation("/work-orders")} data-testid="intent-go-work">
              Go to Work
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
