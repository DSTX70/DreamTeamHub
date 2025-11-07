import React from "react";
import { lintSchema } from "../../../../shared/lint/promptLinter";
import { augmentForJson } from "../../../../shared/lint/promptAugment";
import { formFromSchema, renderFormSnippet } from "../../../../shared/lint/formFromSchema";
import { PRESETS, type LlmPresetKey } from "../../../../shared/lint/presets";
import LintRuleCard from "./components/LintRuleCard";

const sampleSchema = { type: "object", properties: { id: { type: "string" }, score: { type: "number" }, tags: { type: "array", items: { type: "string" } }, ok: { type: "boolean" } }, required: ["id"] };

const Editor: React.FC<{ label: string; value: string; setValue: (s:string)=>void, rows?: number }> = ({ label, value, setValue, rows=8 }) => (
  <div className="flex-1 flex flex-col">
    <div className="text-xs uppercase text-gray-600 mb-1">{label}</div>
    <textarea className="border rounded p-2 font-mono text-sm" rows={rows} value={value} onChange={e=>setValue(e.target.value)} />
  </div>
);

const ProviderPromptLinter: React.FC = () => {
  const [schemaText, setSchemaText] = React.useState(JSON.stringify(sampleSchema, null, 2));
  const [prompt, setPrompt] = React.useState("You are a helpful API that returns JSON only.");
  const [issues, setIssues] = React.useState<any[]>([]);
  const [fixed, setFixed] = React.useState<string>("");
  const [aug, setAug] = React.useState<string>("");
  const [formSnippet, setFormSnippet] = React.useState<string>("");
  const [model, setModel] = React.useState<LlmPresetKey>("gpt");

  const runLint = (apply: boolean) => {
    try {
      const schema = JSON.parse(schemaText || "{}");
      const res = lintSchema(schema, apply);
      setIssues(res.issues);
      const s = (apply && res.fixedSchema) ? res.fixedSchema : schema;
      setFixed(apply && res.fixedSchema ? JSON.stringify(res.fixedSchema, null, 2) : "");
      const baseAug = augmentForJson(s, { forbidNonJsonText: true });
      const extra = PRESETS[model].extraAugment.join(" ");
      setAug([baseAug, extra].filter(Boolean).join(" "));
      const modelForm = formFromSchema(s);
      setFormSnippet(renderFormSnippet(modelForm));
    } catch (e: any) {
      setIssues([{ code: "schema.parse.error", level: "error", message: e?.message || "Invalid JSON", path: [] }]);
      setFixed("");
      setAug("");
      setFormSnippet("");
    }
  };

  const copyAug = async () => { try { await navigator.clipboard.writeText(aug || ""); } catch {} };
  const copyForm = async () => { try { await navigator.clipboard.writeText(formSnippet || ""); } catch {} };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Prompt Linter (LLM Provider)</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">Model preset</label>
          <select className="border rounded px-2 py-1" value={model} onChange={e=>setModel(e.target.value as LlmPresetKey)}>
            <option value="gpt">{PRESETS.gpt.name}</option>
            <option value="claude">{PRESETS.claude.name}</option>
            <option value="gemini">{PRESETS.gemini.name}</option>
          </select>
          <button className="px-3 py-2 border rounded" onClick={()=>runLint(false)}>Run Lint</button>
          <button className="px-3 py-2 border rounded" onClick={()=>runLint(true)}>Lint + Fixes</button>
          <button className="px-3 py-2 border rounded" onClick={copyAug} disabled={!aug}>Copy Augment</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <div className="font-semibold mb-2">Findings</div>
          <div className="space-y-2">
            {issues.length === 0 ? <div className="text-sm text-gray-500">No issues yet.</div> :
              issues.map((i, idx) => <LintRuleCard key={idx} issue={i} />)
            }
          </div>
        </div>

        <div className="border rounded p-3">
          <div className="font-semibold mb-2">Patched Schema (preview)</div>
          <textarea className="w-full border rounded p-2 font-mono text-xs" rows={16} value={fixed} readOnly />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <div className="font-semibold mb-2">Augmented Instructions ({PRESETS[model].name})</div>
          <textarea className="w-full border rounded p-2 font-mono text-xs" rows={8} value={aug} readOnly />
          <div className="text-xs text-gray-500 mt-1">Tips:</div>
          <ul className="list-disc pl-5 text-xs text-gray-600">{PRESETS[model].tips.map((t,i)=><li key={i}>{t}</li>)}</ul>
        </div>

        <div className="border rounded p-3">
          <div className="font-semibold mb-2">Generate Form (preview snippet)</div>
          <textarea className="w-full border rounded p-2 font-mono text-xs" rows={10} value={formSnippet} readOnly />
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-2 border rounded" onClick={copyAug} disabled={!aug}>Copy Augment</button>
            <button className="px-3 py-2 border rounded" onClick={copyForm} disabled={!formSnippet}>Copy Form Snippet</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPromptLinter;
