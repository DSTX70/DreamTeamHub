import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import LeftRail from "@/components/LeftRail";
import { useState } from "react";

export default function ProviderSelect() {
  const [provider, setProvider] = useState("mock");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [prompt, setPrompt] = useState("Say hi, JSON-only please.");
  const run = async () => {
    const r = await fetch("/api/llm/infer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, model, prompt }) });
    const t = await r.text();
    alert(t);
  };
  return (
    <div className="flex">
      <LeftRail />
      <main className="p-6 space-y-6 flex-1">
        <PageBreadcrumb segments={[{ label: "LLM" }, { label: "Provider" }]} />
        <h1 className="text-xl font-semibold">LLM Provider (Pluggable)</h1>
        <div className="space-y-2">
          <label className="block text-sm">Provider</label>
          <select className="border p-2 rounded" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="mock">Mock</option>
            <option value="openai">OpenAI</option>
            <option value="vertex">Vertex</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Model</label>
          <input className="border p-2 rounded" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Prompt</label>
          <textarea className="border p-2 rounded w-full h-28" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <button className="px-4 py-2 border rounded" onClick={run}>Run</button>
      </main>
    </div>
  );
}
