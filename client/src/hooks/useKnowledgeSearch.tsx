import { useCallback, useEffect, useState } from "react";

export function useKnowledgeSearch(
  owner: "BU"|"BRAND"|"PRODUCT",
  ownerId: string,
  q: string,
  limit = 10
){
  const [items, setItems] = useState<any[]>([]);
  const [next, setNext]   = useState<string | null>(null);
  const [loading, setL]   = useState(false);
  const [err, setErr]     = useState<string | null>(null);

  const load = useCallback(async (cursor: string | null = null, replace=false) => {
    setL(true); setErr(null);
    const u = new URL(`/api/knowledge/${owner}/${ownerId}/search`, window.location.origin);
    u.searchParams.set("q", q); u.searchParams.set("limit", String(limit));
    if (cursor) u.searchParams.set("pageToken", cursor);
    const r = await fetch(u.toString());
    if (!r.ok) { setErr(`HTTP ${r.status}`); setL(false); return; }
    const data = await r.json();
    const nextToken = r.headers.get("X-Next-Page-Token");
    setNext(nextToken); setItems(s => replace ? data.items : [...s, ...data.items]); setL(false);
  }, [owner, ownerId, q, limit]);

  useEffect(() => { setItems([]); setNext(null); if (q.trim().length>=2) load(null, true); }, [q, limit, load]);

  const fetchNext = useCallback(() => next ? load(next) : undefined, [next, load]);
  return { items, loading, error: err, hasMore: !!next, fetchNext, reset: () => { setItems([]); setNext(null); } };
}
