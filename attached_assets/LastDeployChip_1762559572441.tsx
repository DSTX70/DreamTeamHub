// client/src/components/ops/LastDeployChip.tsx
import React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function LastDeployChip() {
  const { data } = useSWR<{ lastDeploy?: { ts: string; sha?: string; tag?: string; actor?: string } }>(
    "/api/admin/deploy/last",
    fetcher,
    { refreshInterval: 15000 }
  );
  const d = data?.lastDeploy;
  if (!d) return null;
  const label = d.tag || (d.sha ? d.sha.slice(0, 7) : "unknown");
  return (
    <a
      href={`/ops/logs?level=info&kind=deploy`}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
      title={`Deployed ${label} by ${d.actor || "ci"} at ${new Date(d.ts).toLocaleString()}`}
    >
      <span className="font-medium">Last Deploy</span>
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-600">{new Date(d.ts).toLocaleString()}</span>
    </a>
  );
}
