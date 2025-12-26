import { useQuery } from "@tanstack/react-query";
import { canonAgentsAsOptions } from "@/lib/canonAgents";

type AnyObj = Record<string, any>;
export type CastOption = { slug: string; label: string };

async function safeFetchJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickList(data: any, keys: string[]): any[] {
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k];
  }
  return [];
}

function toOption(item: any): CastOption | null {
  if (typeof item === "string" && item.trim()) {
    const slug = item.trim();
    return { slug, label: slug };
  }
  if (item && typeof item === "object") {
    const obj = item as AnyObj;
    const slug =
      (typeof obj.slug === "string" && obj.slug.trim()) ? obj.slug.trim() :
      (typeof obj.handle === "string" && obj.handle.trim()) ? obj.handle.trim() :
      (typeof obj.id === "string" && obj.id.trim()) ? obj.id.trim() :
      null;

    const label =
      (typeof obj.name === "string" && obj.name.trim()) ? obj.name.trim() :
      (typeof obj.title === "string" && obj.title.trim()) ? obj.title.trim() :
      (typeof obj.label === "string" && obj.label.trim()) ? obj.label.trim() :
      (typeof slug === "string" ? slug : null);

    if (!slug || !label) return null;
    return { slug, label };
  }
  return null;
}

function normalizeOptions(list: any[]): CastOption[] {
  const out: CastOption[] = [];
  for (const it of list || []) {
    const opt = toOption(it);
    if (opt) out.push(opt);
  }
  const map = new Map<string, CastOption>();
  for (const o of out) map.set(o.slug, o);
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Best-effort discovery of pods/personas.
 * - Pods: tries /api/pods (no fallback list here)
 * - Personas: tries /api/roles, falls back to canonAgents.ts if empty/unavailable
 */
export function useCastOptions() {
  const podsQ = useQuery({
    queryKey: ["/api/pods"],
    queryFn: async () => {
      const data = await safeFetchJSON("/api/pods");
      if (!data) return { ok: false as const, options: [] as CastOption[] };
      const list = pickList(data, ["pods", "data", "rows"]);
      const options = normalizeOptions(list);
      return { ok: options.length > 0, options };
    },
    staleTime: 60_000,
    retry: false,
  });

  const personasQ = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const data = await safeFetchJSON("/api/roles");
      if (!data) {
        const fallback = canonAgentsAsOptions();
        return { ok: true as const, options: fallback };
      }

      const list = pickList(data, ["roles", "agents", "data", "rows"]);
      const options = normalizeOptions(list);

      if (options.length === 0) {
        const fallback = canonAgentsAsOptions();
        return { ok: true as const, options: fallback };
      }

      return { ok: true as const, options };
    },
    staleTime: 60_000,
    retry: false,
  });

  return {
    pods: podsQ.data?.options ?? [],
    podsOk: podsQ.data?.ok ?? false,
    podsLoading: podsQ.isLoading,
    personas: personasQ.data?.options ?? [],
    personasOk: personasQ.data?.ok ?? false,
    personasLoading: personasQ.isLoading,
  };
}
