import React, { useMemo, useState } from "react";

type JSONSchema = any;

function renderField(
  key: string,
  schema: any,
  value: any,
  onChange: (k: string, v: any) => void
) {
  const t = schema.type;
  if (t === "string") {
    return (
      <input
        className="border p-2 w-full rounded"
        value={value ?? ""}
        onChange={(e) => onChange(key, e.target.value)}
      />
    );
  }
  if (t === "number" || t === "integer") {
    return (
      <input
        type="number"
        className="border p-2 w-full rounded"
        value={value ?? ""}
        onChange={(e) => onChange(key, Number(e.target.value))}
      />
    );
  }
  if (t === "array") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {arr.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            {renderField(String(idx), schema.items, item, (k, v) => {
              const next = [...arr]; next[idx] = v; onChange(key, next);
            })}
            <button type="button" className="px-2 py-1 border rounded"
              onClick={() => { const next = arr.filter((_: any, i: number) => i !== idx); onChange(key, next); }}>−</button>
          </div>
        ))}
        <button type="button" className="px-3 py-1 border rounded"
          onClick={() => onChange(key, [...arr, schema.items.type === "object" ? {} : ""])}>+ Add</button>
      </div>
    );
  }
  if (t === "object") {
    return (
      <div className="space-y-3">
        {Object.entries(schema.properties || {}).map(([k, v]: any) => (
          <div key={k}>
            <label className="block text-sm mb-1">{k}</label>
            {renderField(k, v, value?.[k], (childKey, childVal) => {
              const next = { ...(value || {}) }; next[childKey] = childVal; onChange(key, next);
            })}
          </div>
        ))}
      </div>
    );
  }
  return <em>Unsupported: {t}</em>;
}

export default function JsonSchemaForm({
  schema,
  initial,
  onSubmit,
}: {
  schema: JSONSchema;
  initial?: any;
  onSubmit: (val: any) => void;
}) {
  const [val, setVal] = useState<any>(initial ?? {});
  const required = new Set<string>(schema.required || []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(val);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      {schema.type === "object" ? (
        Object.entries(schema.properties || {}).map(([k, v]: any) => (
          <div key={k}>
            <label className="block text-sm mb-1">
              {k} {required.has(k) && <span className="text-red-500">*</span>}
            </label>
            {renderField(k, v, val?.[k], (childKey, childVal) => {
              setVal((prev: any) => ({ ...(prev || {}), [childKey]: childVal }));
            })}
          </div>
        ))
      ) : (
        <div>Root schema must be type=object</div>
      )}
      <button type="submit" className="px-4 py-2 border rounded">Submit</button>
      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>
    </form>
  );
}
