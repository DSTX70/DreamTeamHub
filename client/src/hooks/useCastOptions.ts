import { useQuery } from "@tanstack/react-query";

type Pod = { id?: string; name?: string; title?: string; slug?: string };
type Role = { id?: string; name?: string; title?: string; handle?: string };

async function safeFetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeNames(items: any[], keys: string[]): string[] {
  const out: string[] = [];
  for (const it of items || []) {
    if (!it || typeof it !== "object") continue;
    for (const k of keys) {
      const v = (it as any)[k];
      if (typeof v === "string" && v.trim()) {
        out.push(v.trim());
        break;
      }
    }
  }
  // de-dupe
  return Array.from(new Set(out)).sort((a, b) => a.localeCompare(b));
}

/**
 * Best-effort discovery of pods/personas.
 * If endpoints do not exist, UI still works with manual entry.
 */
export function useCastOptions() {
  const podsQ = useQuery({
    queryKey: ["/api/pods"],
    queryFn: async () => {
      const data = await safeFetchJSON<any>("/api/pods");
      if (!data) return { ok: false as const, names: [] as string[] };
      // supports either array payloads or { pods: [] }
      const list = Array.isArray(data) ? data : Array.isArray(data?.pods) ? data.pods : [];
      return { ok: true as const, names: normalizeNames(list, ["name", "title", "slug", "id"]) };
    },
    staleTime: 60_000,
    retry: false,
  });

  const personasQ = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const data = await safeFetchJSON<any>("/api/roles");
      if (!data) return { ok: false as const, names: [] as string[] };
      // supports either array payloads or { roles: [] }
      const list = Array.isArray(data) ? data : Array.isArray(data?.roles) ? data.roles : [];
      return { ok: true as const, names: normalizeNames(list, ["name", "title", "handle", "id"]) };
    },
    staleTime: 60_000,
    retry: false,
  });

  return {
    pods: podsQ.data?.names ?? [],
    podsOk: podsQ.data?.ok ?? false,
    podsLoading: podsQ.isLoading,
    personas: personasQ.data?.names ?? [],
    personasOk: personasQ.data?.ok ?? false,
    personasLoading: personasQ.isLoading,
  };
}
