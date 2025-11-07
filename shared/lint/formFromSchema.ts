export type FormField =
  | { kind: "string"; name: string; label: string }
  | { kind: "number"; name: string; label: string }
  | { kind: "boolean"; name: string; label: string }
  | { kind: "array<string>"; name: string; label: string }
  | { kind: "array<number>"; name: string; label: string };

export type FormModel = { fields: FormField[] };
type JSONSchema = any;

export function formFromSchema(schema: JSONSchema): FormModel {
  const fields: FormField[] = [];
  if (!schema || typeof schema !== "object") return { fields };
  function addField(name: string, node: any) {
    if (!node) return;
    const t = Array.isArray(node.type) ? node.type[0] : node.type;
    if (t === "string") fields.push({ kind: "string", name, label: name });
    else if (t === "number" || t === "integer") fields.push({ kind: "number", name, label: name });
    else if (t === "boolean") fields.push({ kind: "boolean", name, label: name });
    else if (t === "array") {
      const it = node.items || {};
      const itType = Array.isArray(it.type) ? it.type[0] : it.type;
      if (itType === "string") fields.push({ kind: "array<string>", name, label: name });
      else if (itType === "number" || itType === "integer") fields.push({ kind: "array<number>", name, label: name });
    }
  }
  if (schema.type === "object" && schema.properties) {
    Object.entries(schema.properties).forEach(([k, v]) => addField(k as string, v));
  } else {
    addField("value", schema);
  }
  return { fields };
}

export function renderFormSnippet(model: FormModel): string {
  const rows = model.fields.map(f => {
    if (f.kind === "string") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label}</span><input className=\"border rounded px-2 py-1\" value={form.${f.name}||\""} onChange={e=>setForm(prev=>({...prev, ${f.name}: e.target.value}))} /></label>`;
    if (f.kind === "number") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label}</span><input type=\"number\" className=\"border rounded px-2 py-1\" value={form.${f.name}??\""} onChange={e=>setForm(prev=>({...prev, ${f.name}: Number(e.target.value)}))} /></label>`;
    if (f.kind === "boolean") return `<label className=\"inline-flex items-center gap-2 text-sm\"><input type=\"checkbox\" checked={!!form.${f.name}} onChange={e=>setForm(prev=>({...prev, ${f.name}: e.target.checked}))} /><span>${f.label}</span></label>`;
    if (f.kind === "array<string>") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label} (CSV)</span><input className=\"border rounded px-2 py-1\" value={(form.${f.name}||[]).join(",")} onChange={e=>setForm(prev=>({...prev, ${f.name}: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))} /></label>`;
    if (f.kind === "array<number>") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label} (CSV numbers)</span><input className=\"border rounded px-2 py-1\" value={(form.${f.name}||[]).join(",")} onChange={e=>setForm(prev=>({...prev, ${f.name}: e.target.value.split(',').map(s=>Number(s.trim())).filter(n=>Number.isFinite(n))}))} /></label>`;
    return "";
  }).join("\n    ");
  return `// Paste into a React component:\nconst [form, setForm] = React.useState({});\nreturn (\n  <form className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">\n    ${rows}\n  </form>\n);`;
}
