// client/src/pages/llm/LinterPresetsCRUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { suggestPromptFixes, applyPromptAutofix, suggestSchemaFixes, applySchemaAutofix, extractJSONBlock, validateAgainstSchema } from "./autofix";
import SchemaFormPanel from "./SchemaForm";

type Preset = {
  id: string;
  family: "gpt" | "claude" | "gemini";
  label: string;
  tips: string[];
  augmentLines: string[];
  enabled: boolean;
  updatedAt: string;
};

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function LinterPresetsCRUD() {
  const { data, mutate } = useSWR<{ presets: Preset[] }>("/api/llm/presets", fetcher);
  const [editing, setEditing] = useState<Partial<Preset>>({ family: "gpt", label: "" });
  const presets = data?.presets || [];

  const save = async () => {
    if (editing?.id) {
      await fetch(`/api/llm/presets/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    } else {
      await fetch(`/api/llm/presets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    }
    setEditing({ family: "gpt", label: "" });
    mutate();
  };

  const remove = async (id: string) => {
    await fetch(`/api/llm/presets/${id}`, { method: "DELETE" });
    mutate();
  };

  // Prompt autofix demo
  const [prompt, setPrompt] = useState("Return a JSON object with keys name and age.");
  const promptFixes = suggestPromptFixes(prompt);
  const applyPrompt = () => setPrompt(p => applyPromptAutofix(p));

  // JSON extraction demo
  const [rawLLM, setRawLLM] = useState("Here is your result:\n```json\n{ \"name\": \"Ada\", \"age\": 42 }\n```");
  const [schemaText, setSchemaText] = useState(JSON.stringify({ type: "object", properties: { name: { type: "string" }, age: { type: "integer" } }, required: ["name","age"], additionalProperties: false }, null, 2));
  const schema = useMemo(() => { try { return JSON.parse(schemaText); } catch { return null; } }, [schemaText]);
  const parsed = extractJSONBlock(rawLLM);
  const validated = schema && parsed.json ? validateAgainstSchema(parsed.json, schema) : null;
  const schemaFixes = suggestSchemaFixes(schema || {});
  const applySchema = () => { if (!schema) return; setSchemaText(JSON.stringify(applySchemaAutofix(schema), null, 2)); };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">LLM Presets (CRUD)</h2>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => mutate()}>Refresh</button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Existing presets</div>
            <div className="rounded border">
              {presets.length === 0 && <div className="p-2 text-sm text-gray-500">No presets yet</div>}
              {presets.map(p => (
                <div key={p.id} className="flex items-start justify-between gap-2 border-b p-2 text-sm">
                  <div>
                    <div className="font-medium">{p.label} <span className="text-gray-500">({p.family})</span></div>
                    <div className="text-gray-600">Augments: {p.augmentLines.join(" · ") || "—"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded border px-2 py-1" onClick={() => setEditing(p)}>Edit</button>
                    <button className="rounded border px-2 py-1" onClick={() => remove(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Edit / Create</div>
            <div className="rounded border p-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">
                  <div className="text-gray-700">Family</div>
                  <select className="mt-1 w-full rounded border p-1" value={editing.family} onChange={e => setEditing({ ...editing, family: e.target.value as any })}>
                    <option value="gpt">GPT</option>
                    <option value="claude">Claude</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </label>
                <label className="text-sm">
                  <div className="text-gray-700">Label</div>
                  <input className="mt-1 w-full rounded border p-1" value={editing.label || ""} onChange={e => setEditing({ ...editing, label: e.target.value })} />
                </label>
              </div>
              <label className="mt-2 block text-sm">
                <div className="text-gray-700">Augment lines</div>
                <textarea className="mt-1 w-full rounded border p-1 font-mono text-xs" rows={4} value={(editing.augmentLines || []).join("\n")} onChange={e => setEditing({ ...editing, augmentLines: e.target.value.split(/\r?\n/) })} />
              </label>
              <label className="mt-2 block text-sm">
                <div className="text-gray-700">Tips</div>
                <textarea className="mt-1 w-full rounded border p-1 font-mono text-xs" rows={4} value={(editing.tips || []).join("\n")} onChange={e => setEditing({ ...editing, tips: e.target.value.split(/\r?\n/) })} />
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input id="enabled" type="checkbox" checked={editing.enabled ?? true} onChange={e => setEditing({ ...editing, enabled: e.target.checked })} />
                <label htmlFor="enabled" className="text-sm">Enabled</label>
              </div>
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-3 py-1 text-sm" onClick={save}>Save</button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setEditing({ family: "gpt", label: "" })}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Prompt Auto-fix</h2>
        <textarea className="mt-2 w-full rounded border p-2 font-mono text-xs" rows={5} value={prompt} onChange={e => setPrompt(e.target.value)} />
        <div className="mt-2 text-sm text-gray-700">Suggestions:</div>
        <ul className="list-disc pl-5 text-sm">{promptFixes.map((f, i) => <li key={i}>{f}</li>)}</ul>
        <button className="mt-2 rounded border px-3 py-1 text-sm" onClick={applyPrompt}>Apply fixes</button>
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">JSON Extraction + Validate</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Raw LLM output</div>
            <textarea className="mt-1 h-48 w-full rounded border p-2 font-mono text-xs" value={rawLLM} onChange={e => setRawLLM(e.target.value)} />
            <div className="mt-2 text-sm font-medium">Schema</div>
            <textarea className="mt-1 h-48 w-full rounded border p-2 font-mono text-xs" value={schemaText} onChange={e => setSchemaText(e.target.value)} />
            <div className="mt-2 text-sm">Schema suggestions</div>
            <ul className="list-disc pl-5 text-sm">{schemaFixes.map((f, i) => <li key={i}>{f}</li>)}</ul>
            <button className="mt-2 rounded border px-3 py-1 text-sm" onClick={applySchema}>Apply schema fixes</button>
          </div>
          <div>
            <div className="text-sm font-medium">Extracted JSON</div>
            <pre className="mt-1 h-64 overflow-auto rounded border p-2 text-xs">{JSON.stringify(parsed.json ?? parsed, null, 2)}</pre>
            <div className="mt-2 text-sm font-medium">Validation</div>
            {validated ? (validated.ok ? <div className="rounded border border-green-300 bg-green-50 p-2 text-xs text-green-800">Valid</div> :
              <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800">
                <div className="font-medium">Errors</div>
                <ul className="list-disc pl-5">
                  {validated.errors.map((e: any, i: number) => <li key={i}>{e.instancePath || "/"} {e.message}</li>)}
                </ul>
              </div>
            ) : <div className="text-xs text-gray-500">Paste schema and ensure JSON parsed.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
