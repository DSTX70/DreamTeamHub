import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import LeftRail from "@/components/LeftRail";
import { useState } from "react";

export default function AlertHooksDemo() {
  const [msg, setMsg] = useState<string>("");
  const send = async () => {
    const r = await fetch("/api/ops/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "info", message: msg || "Hello Ops" }) });
    alert(await r.text());
  };
  return (
    <div className="flex">
      <LeftRail />
      <main className="p-6 space-y-6 flex-1">
        <PageBreadcrumb segments={[{ label: "Ops" }, { label: "Alerts" }]} />
        <h1 className="text-xl font-semibold">Alert Hooks (Ops)</h1>
        <div className="flex items-center gap-2">
          <input className="border p-2 rounded flex-1" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message to alert pipeline…" />
          <button className="px-4 py-2 border rounded" onClick={send}>Send</button>
        </div>
      </main>
    </div>
  );
}
