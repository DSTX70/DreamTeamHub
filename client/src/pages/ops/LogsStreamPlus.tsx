// client/src/pages/ops/LogsStreamPlus.tsx
import React, { useEffect, useMemo, useState } from "react";
import CopyBtn from "../../components/ops/CopyBtn";
import type { OpsEvent } from "../../../shared/types/ops";

type Since = "15m" | "1h" | "24h" | "";
type CopyMode = "summary" | "json";

function parseSince(s: Since): number | null {
  const now = Date.now();
  if (s === "15m") return now - 15*60*1000;
  if (s === "1h") return now - 60*60*1000;
  if (s === "24h") return now - 24*60*60*1000;
  return null;
}

export default function LogsStreamPlus() {
  // Load from localStorage or use defaults
  const [level, setLevel] = useState<string>(() => localStorage.getItem("ops-logs-level") || "");
  const [owner, setOwner] = useState<string>(() => localStorage.getItem("ops-logs-owner") || "");
  const [kind, setKind] = useState<string>(() => localStorage.getItem("ops-logs-kind") || "");
  const [since, setSince] = useState<Since>(() => (localStorage.getItem("ops-logs-since") || "15m") as Since);
  const [copyMode, setCopyMode] = useState<CopyMode>(() => (localStorage.getItem("ops-logs-copymode") || "summary") as CopyMode);

  // Persist to localStorage on change
  useEffect(() => { localStorage.setItem("ops-logs-level", level); }, [level]);
  useEffect(() => { localStorage.setItem("ops-logs-owner", owner); }, [owner]);
  useEffect(() => { localStorage.setItem("ops-logs-kind", kind); }, [kind]);
  useEffect(() => { localStorage.setItem("ops-logs-since", since); }, [since]);
  useEffect(() => { localStorage.setItem("ops-logs-copymode", copyMode); }, [copyMode]);

  const [events, setEvents] = useState<OpsEvent[]>([]);
  const cutoff = useMemo(() => parseSince(since), [since]);

  useEffect(() => {
    const es = new EventSource("/api/ops/logs/stream");
    es.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (payload?.event) {
          setEvents(prev => prev.concat(payload.event as OpsEvent).slice(-5000));
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  const filtered = events.filter(e => {
    if (level && e.level !== level) return false;
    if (owner && e.owner !== owner) return false;
    if (kind && e.kind !== kind) return false;
    if (cutoff && new Date(e.ts).getTime() < cutoff) return false;
    return true;
  });

  const mkSummary = (e: OpsEvent) => `${e.ts} [${e.level}] ${e.kind} ${e.owner || ""} — ${e.msg}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded border px-2 py-1 text-sm" value={since} onChange={(e) => setSince(e.target.value as Since)}>
          <option value="15m">Last 15m</option>
          <option value="1h">Last 1h</option>
          <option value="24h">Last 24h</option>
          <option value="">All</option>
        </select>
        <select className="rounded border px-2 py-1 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
        <input className="rounded border px-2 py-1 text-sm" placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <input className="rounded border px-2 py-1 text-sm" placeholder="kind" value={kind} onChange={(e) => setKind(e.target.value)} />
        <select className="rounded border px-2 py-1 text-sm" value={copyMode} onChange={(e) => setCopyMode(e.target.value as CopyMode)}>
          <option value="summary">Copy summary</option>
          <option value="json">Copy JSON</option>
        </select>
      </div>

      <div className="rounded-xl border">
        <div className="grid grid-cols-12 border-b bg-gray-50 p-2 text-xs font-semibold">
          <div className="col-span-2">Time</div>
          <div className="col-span-1">Lvl</div>
          <div className="col-span-2">Kind</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-4">Message</div>
          <div className="col-span-1 text-right">Copy</div>
        </div>
        <div className="max-h-[60vh] overflow-auto text-xs">
          {filtered.map((e) => (
            <div key={e.id} className="grid grid-cols-12 items-start border-b p-2">
              <div className="col-span-2 font-mono">{new Date(e.ts).toLocaleString()}</div>
              <div className="col-span-1">{e.level}</div>
              <div className="col-span-2">{e.kind}</div>
              <div className="col-span-2">{e.owner || ""}</div>
              <div className="col-span-4 break-words">{e.msg}</div>
              <div className="col-span-1 text-right">
                <CopyBtn text={copyMode === "json" ? JSON.stringify(e) : mkSummary(e)} />
              </div>
            </div>
          ))}
          {!filtered.length && <div className="p-3 text-gray-500">No events</div>}
        </div>
      </div>
    </div>
  );
}
