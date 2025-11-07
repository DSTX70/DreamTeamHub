import React from "react";
import { lintSchema } from "../../../../shared/lint/promptLinter";
import { augmentForJson } from "../../../../shared/lint/promptAugment";
import { formFromSchema, renderFormSnippet } from "../../../../shared/lint/formFromSchema";
import LintRuleCard from "./components/LintRuleCard";

const sampleSchema = { type: "object", properties: { id: { type: "string" }, score: { type: "number" }, tags: { type: "array", items: { type: "string" } }, ok: { type: "boolean" } }, required: ["id"] };

const Editor: React.FC<{ label: string; value: string; setValue: (s:string)=>void, rows?: number }> = ({ label, value, setValue, rows=8 }) => (
  <div className="flex-1 flex flex-col">
    <div className="text-xs uppercase text-gray-600 mb-1">{label}</div>
    <textarea className="border rounded p-2 font-mono text-sm" rows={rows} value={value} onChange={e=>setValue(e.target.value)} />
  </div>
);

function validateJsonAgainstSchema(obj: any, schema: any): string[] {
  const errs: string[] = [];
  const t = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (t === "object" && schema.properties) {
    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach((k: string) => { if (!(k in obj)) errs.push(`Missing required: ${k}`); });
    }
    Object.entries(schema.properties).forEach(([k, v]: any) => {
      if (obj && obj[k] !== undefined) {
        const kt = Array.isArray(v.type) ? v.type[0] : v.type;
        if (kt === "number" || kt === "integer") { if (typeof obj[k] !== "number") errs.push(`Field ${k} should be number`); }
        else if (kt === "string") { if (typeof obj[k] !== "string") errs.push(`Field ${k} should be string`); }
        else if (kt === "boolean") { if (typeof obj[k] !== "boolean") errs.push(`Field ${k} should be boolean`); }
        else if (kt === "array") { if (!Array.isArray(obj[k])) errs.push(`Field ${k} should be array`); }
        else if (kt === "object") { if (typeof obj[k] !== "object") errs.push(`Field ${k} should be object`); else errs.push(...validateJsonAgainstSchema(obj[k], v)); }
        if (v.enum && Array.isArray(v.enum)) { if (!v.enum.includes(obj[k])) errs.push(`Field ${k} not in enum`); }
      }
    });
  }
  return errs;
}

const ProviderPromptLinter: React.FC = () => {
  const [schemaText, setSchemaText] = React.useState(JSON.stringify(sampleSchema, null, 2));
  const [prompt, setPrompt] = React.useState("You are a helpful API that returns JSON only.");
  const [issues, setIssues] = React.useState<any[]>([]);
  const [fixed, setFixed] = React.useState<string>("");
  const [aug, setAug] = React.useState<string>("");
  const [formSnippet, setFormSnippet] = React.useState<string>("");
  const [sampleJson, setSampleJson] = React.useState<string>('{"id":"abc","score":1,"tags":["x"],"ok":true}');
  const [validation, setValidation] = React.useState<string[]>([]);

  const runLint = (apply: boolean) => {
    try {
      const schema = JSON.parse(schemaText || "{}");
      const res = lintSchema(schema, apply);
      setIssues(res.issues);
      const s = (apply && res.fixedSchema) ? res.fixedSchema : schema;
      setFixed(apply && res.fixedSchema ? JSON.stringify(res.fixedSchema, null, 2) : "");
      setAug(augmentForJson(s, { forbidNonJsonText: true }));
      const model = formFromSchema(s);
      setFormSnippet(renderFormSnippet(model));
      // validate current sample
      try { const parsed = JSON.parse(sampleJson || "{}"); setValidation(validateJsonAgainstSchema(parsed, s)); } catch { setValidation(["Sample JSON parse error"]); }
    } catch (e: any) {
      setIssues([{ code: "schema.parse.error", level: "error", message: e?.message || "Invalid JSON", path: [] }]);
      setFixed(""); setAug(""); setFormSnippet(""); setValidation([]);
    }
  };

  const copyAug = async () => { try { await navigator.clipboard.writeText(aug || ""); } catch {} };
  const copyForm = async () => { try { await navigator.clipboard.writeText(formSnippet || ""); } catch {} };

  const runValidateOnly = () => {
    try { const s = JSON.parse(schemaText || "{}"); const parsed = JSON.parse(sampleJson || "{}"); setValidation(validateJsonAgainstSchema(parsed, s)); }
    catch { setValidation(["Sample JSON parse error"]); }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Prompt Linter (LLM Provider)</h1>
      <div className="flex gap-4">
        <Editor label="Output JSON Schema" value={schemaText} setValue={setSchemaText} />
        <Editor label="System/Instruction Prompt" value={prompt} setValue={setPrompt} />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className="px-3 py-2 border rounded" onClick={()=>runLint(false)}>Run Lint</button>
        <button className="px-3 py-2 border rounded" onClick={()=>runLint(true)}>Run Lint + Apply Fixes</button>
        <button className="px-3 py-2 border rounded" onClick={copyAug} disabled={!aug}>Copy Augment</button>
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
          <div className="font-semibold mb-2">Augmented Instructions</div>
          <textarea className="w-full border rounded p-2 font-mono text-xs" rows={8} value={aug} readOnly />
          <div className="text-xs text-gray-500 mt-1">Use “Copy Augment” for one-click copy.</div>
        </div>

        <div className="border rounded p-3 space-y-2">
          <div className="font-semibold">Generate Form (preview snippet)</div>
          <textarea className="w-full border rounded p-2 font-mono text-xs" rows={10} value={formSnippet} readOnly />
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded" onClick={copyForm} disabled={!formSnippet}>Copy Form Snippet</button>
          </div>
        </div>
      </div>

      <div className="border rounded p-3 space-y-2">
        <div className="font-semibold">Validate sample JSON against schema</div>
        <textarea className="w-full border rounded p-2 font-mono text-xs" rows={8} value={sampleJson} onChange={e=>setSampleJson(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={runValidateOnly}>Validate</button>
          {validation.length === 0 ? <span className="text-sm text-green-700">✓ Looks valid</span> :
            <ul className="text-sm text-red-700 list-disc pl-5">{validation.map((m,i)=><li key={i}>{m}</li>)}</ul>}
        </div>
      </div>
    </div>
  );
};
export default ProviderPromptLinter;
