// client/src/components/ops/LiveHealthCard.tsx
import React from "react";
import useSWR from "swr";
import type { HealthResponse } from "../../../shared/types/health";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Badge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        (ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
      }
    >
      {ok ? "OK" : "Fail"}
    </span>
  );
}

export default function LiveHealthCard() {
  const { data, error, isLoading, mutate } = useSWR<HealthResponse>("/api/healthz", fetcher, {
    refreshInterval: 30000, // refresh every 30s
  });

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Health</h3>
        <button
          onClick={() => mutate()}
          className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {isLoading && <div className="mt-3 text-sm text-gray-500">Loading…</div>}
      {error && <div className="mt-3 text-sm text-red-600">Error loading health.</div>}

      {data && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <Badge ok={data.ok} />
            <div className="text-sm text-gray-600">
              Total latency: <span className="font-medium">{data.latencyMs} ms</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {data.checks.map((c) => (
              <div key={c.name} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium uppercase">{c.name}</div>
                  <Badge ok={c.ok} />
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {c.latencyMs} ms
                  {!c.ok && c.details ? <div className="mt-1 text-red-700">{c.details}</div> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs text-gray-400">Updated {new Date(data.ts).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
