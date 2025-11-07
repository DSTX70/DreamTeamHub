export type FormField =
  | { kind: "string"; name: string; label: string; enum?: string[] }
  | { kind: "number"; name: string; label: string }
  | { kind: "boolean"; name: string; label: string }
  | { kind: "array<string>"; name: string; label: string }
  | { kind: "array<number>"; name: string; label: string };

export type FormModel = { fields: FormField[] };

type JSONSchema = any;

function join(name: string, key: string){ return name ? name + "." + key : key; }

export function formFromSchema(schema: JSONSchema, prefix = ""): FormModel {
  const fields: FormField[] = [];
  if (!schema || typeof schema !== "object") return { fields };

  function walk(node: any, name: string) {
    if (!node) return;
    const t = Array.isArray(node.type) ? node.type[0] : node.type;
    if (node.enum && Array.isArray(node.enum)) {
      fields.push({ kind: "string", name, label: name, enum: node.enum.map(String) });
      return;
    }
    if (t === "object" && node.properties) {
      Object.entries(node.properties).forEach(([k, v]) => walk(v, join(name, k)));
      return;
    }
    if (t === "array") {
      const it = node.items || {};
      const itType = Array.isArray(it.type) ? it.type[0] : it.type;
      if (itType === "object" && it.properties) {
        // arrays of objects: flatten first level with index placeholder [i]
        Object.entries(it.properties).forEach(([k, v]) => walk(v, join(name, k)));
        return;
      }
      if (itType === "string") fields.push({ kind: "array<string>", name, label: name });
      else if (itType === "number" || itType === "integer") fields.push({ kind: "array<number>", name, label: name });
      return;
    }
    if (t === "string") fields.push({ kind: "string", name, label: name, enum: node.enum });
    else if (t === "number" || t === "integer") fields.push({ kind: "number", name, label: name });
    else if (t === "boolean") fields.push({ kind: "boolean", name, label: name });
  }

  walk(schema, prefix || "");
  return { fields };
}

export function renderFormSnippet(model: FormModel): string {
  // Helper to safely access nested paths with optional chaining
  const getPath = (name: string) => {
    if (!name.includes('.')) return `form.${name}`;
    const parts = name.split('.');
    return parts.map((p, i) => i === 0 ? `form.${p}` : p).join('?.');
  };
  
  // Helper to safely set nested values (quote dotted keys)
  const setPath = (name: string, value: string) => {
    if (!name.includes('.')) return `{...prev, ${name}: ${value}}`;
    return `{...prev, "${name}": ${value}}`;
  };

  const rows = model.fields.map(f => {
    const access = getPath(f.name);
    if (f.enum && f.enum.length) {
      const options = f.enum.map(v=>`<option value=\"${v}\">${v}</option>`).join("");
      return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label}</span><select className=\"border rounded px-2 py-1\" value={${access}||\""} onChange={e=>setForm(prev=>(${setPath(f.name, "e.target.value")}))}>${options}</select></label>`;
    }
    if (f.kind === "string") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label}</span><input className=\"border rounded px-2 py-1\" value={${access}||\""} onChange={e=>setForm(prev=>(${setPath(f.name, "e.target.value")}))} /></label>`;
    if (f.kind === "number") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label}</span><input type=\"number\" className=\"border rounded px-2 py-1\" value={${access}??\""} onChange={e=>setForm(prev=>(${setPath(f.name, "Number(e.target.value)")}))} /></label>`;
    if (f.kind === "boolean") return `<label className=\"inline-flex items-center gap-2 text-sm\"><input type=\"checkbox\" checked={!!${access}} onChange={e=>setForm(prev=>(${setPath(f.name, "e.target.checked")}))} /><span>${f.label}</span></label>`;
    if (f.kind === "array<string>") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label} (CSV)</span><input className=\"border rounded px-2 py-1\" value={(${access}||[]).join(",")} onChange={e=>setForm(prev=>(${setPath(f.name, "e.target.value.split(\",\").map(s=>s.trim()).filter(Boolean)")}))} /></label>`;
    if (f.kind === "array<number>") return `<label className=\"flex flex-col text-sm\"><span className=\"text-xs text-gray-600\">${f.label} (CSV numbers)</span><input className=\"border rounded px-2 py-1\" value={(${access}||[]).join(",")} onChange={e=>setForm(prev=>(${setPath(f.name, "e.target.value.split(',').map(s=>Number(s.trim())).filter(n=>Number.isFinite(n))")}))} /></label>`;
    return "";
  }).join("\n    ");
  return `// Paste into a React component:\nconst [form, setForm] = React.useState({});\nreturn (\n  <form className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">\n    ${rows}\n  </form>\n);`;
}
