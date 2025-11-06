// components/AcademySidebar.tsx
import React, { useState } from "react";

type AgentLite = {
  id: string;
  name: string;
  autonomy: "L0"|"L1"|"L2"|"L3";
  status: "pilot"|"live"|"watch"|"rollback";
  nextGate?: number | null;
};

export default function AcademySidebar({
  agent,
  onTrainClick,
  onPromote,
}: {
  agent: AgentLite;
  onTrainClick?: (agentId: string) => void;
  onPromote?: (agentId: string) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const nextGate = typeof agent.nextGate === "number" ? agent.nextGate : undefined;

  const promote = async () => {
    if (!onPromote || busy) return;
    setBusy(true);
    try {
      await onPromote(agent.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">Academy</h3>
        <span className="text-xs text-gray-600">Right sidebar</span>
      </div>

      <div className="text-sm">
        <div className="text-gray-700"><b>{agent.name}</b></div>
        <div className="text-gray-600">Level: <b>{agent.autonomy}</b> · Status: <b>{agent.status}</b></div>
        <div className="text-gray-600">Next gate: <b>{nextGate ?? "—"}</b></div>
      </div>

      <div className="flex flex-col gap-2">
        <button className="px-3 py-1 border rounded" onClick={()=>onTrainClick?.(agent.id)}>Open Training</button>
        <button className="px-3 py-1 border rounded bg-black text-white disabled:opacity-50" disabled={!onPromote || busy} onClick={promote}>
          {busy ? "Promoting…" : "Promote (advance gate)"}
        </button>
      </div>

      <div className="text-xs text-gray-600">
        Promotion will advance the agent’s <b>gate</b> after review. Use this for agents with stable KPIs (success ≥ 90%, p95 ≤ 3s).
      </div>
    </aside>
  );
}
