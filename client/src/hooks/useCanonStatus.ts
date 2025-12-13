import { useEffect, useState } from "react";

export type CanonSyncStatus = "synced" | "stale" | "unknown";

export type CanonStatusResponse = {
  canonKey: string;
  canonVersion: string;
  source: string;
  lastSyncedAt: string | null;
  status: CanonSyncStatus;
};

export function useCanonStatus(canonKey: string) {
  const [data, setData] = useState<CanonStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/canon/status?canonKey=${encodeURIComponent(canonKey)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CanonStatusResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [canonKey]);

  return { data, loading, error };
}
