import React from "react";

type AllowItem = { sku: string; baseKey: string };
type UploadResp = { ok: boolean; items: any[] };

function bytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024*1024) return (n/1024).toFixed(1) + " KB";
  return (n/1024/1024).toFixed(2) + " MB";
}

const ImagesAdmin: React.FC = () => {
  const [allowlist, setAllowlist] = React.useState<AllowItem[]>([]);
  const [sku, setSku] = React.useState("");
  const [baseKey, setBaseKey] = React.useState("uploads/products");
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [progress, setProgress] = React.useState<string>("");
  const [summary, setSummary] = React.useState<{ count: number; total: number } | null>(null);
  const [variants, setVariants] = React.useState<any[]>([]);
  const [cacheControl, setCacheControl] = React.useState("public, max-age=31536000, immutable");

  const load = async () => {
    const r = await fetch("/api/ops/images/allowlist");
    const j = await r.json();
    setAllowlist(j.items || []);
  };
  React.useEffect(()=>{ load(); }, []);

  const addAllow = async () => {
    await fetch("/api/ops/images/allowlist", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ items:[{ sku, baseKey }] }) });
    setSku("");
    await load();
  };

  const remove = async (sku: string) => {
    await fetch("/api/ops/images/allowlist/" + encodeURIComponent(sku), { method:"DELETE" });
    await load();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) setFiles(e.dataTransfer.files);
  };

  const onUpload = async () => {
    if (!files || !sku || !baseKey) return;
    let total = 0;
    for (const f of Array.from(files)) total += f.size;
    setSummary({ count: files.length, total });

    const form = new FormData();
    form.append("sku", sku);
    form.append("baseKey", baseKey);
    form.append("cacheControl", cacheControl);
    Array.from(files).forEach(f => form.append("files", f, f.name));

    setProgress("Uploading…");
    const res = await fetch("/api/ops/images/upload", { method: "POST", body: form });
    const json: UploadResp = await res.json();
    setProgress(json.ok ? "Done" : "Failed");
    const list = await (await fetch("/api/ops/images/variants/" + encodeURIComponent(baseKey))).json();
    setVariants(list.items || []);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Responsive Images — Allowlist & Upload</h1>

      <section className="space-y-3">
        <div className="font-semibold">Allowlist</div>
        <div className="flex gap-2">
          <input className="border rounded px-2 py-1" placeholder="SKU" value={sku} onChange={e=>setSku(e.target.value)} />
          <input className="border rounded px-2 py-1 w-96" placeholder="Base key (e.g., uploads/products/CARD-CC-HELLO-001)" value={baseKey} onChange={e=>setBaseKey(e.target.value)} />
          <button className="px-3 py-1 border rounded" onClick={addAllow}>Add/Update</button>
        </div>
        <div className="border rounded">
          <table className="min-w-full text-sm">
            <thead><tr><th className="text-left px-3 py-2">SKU</th><th className="text-left px-3 py-2">Base Key</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {allowlist.map(it => (
                <tr key={it.sku} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 font-mono">{it.sku}</td>
                  <td className="px-3 py-2">{it.baseKey}</td>
                  <td className="px-3 py-2 text-right"><button className="px-2 py-1 border rounded" onClick={()=>remove(it.sku)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-semibold">Upload & Transform</div>
        <div className="flex items-center gap-2">
          <label>Cache-Control</label>
          <input className="border rounded px-2 py-1 w-[480px]" value={cacheControl} onChange={e=>setCacheControl(e.target.value)} />
        </div>
        <div
          onDragOver={e=>e.preventDefault()}
          onDrop={onDrop}
          className="border-dashed border-2 rounded p-6 text-center"
        >
          Drag & drop images here (png, jpg, webp, avif). SVG/XML is blocked.
        </div>
        <div className="flex gap-2 items-center">
          <input type="file" multiple onChange={e=>setFiles(e.target.files)} />
          <button className="px-3 py-1 border rounded" onClick={onUpload}>Upload</button>
          <span>{progress}</span>
        </div>
        {summary && (
          <div className="text-sm text-gray-600">Total payload: {summary.count} files, {bytes(summary.total)}</div>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-semibold">Generated Variants</div>
        <div className="border rounded overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr><th className="text-left px-3 py-2">Key</th><th className="text-right px-3 py-2">Width</th><th className="text-left px-3 py-2">Ext</th><th className="text-right px-3 py-2">Size</th></tr></thead>
            <tbody>
              {variants.map(v => (
                <tr key={v.key} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 font-mono">{v.key}</td>
                  <td className="px-3 py-2 text-right">{v.width ?? "—"}</td>
                  <td className="px-3 py-2">{v.ext ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{bytes(v.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ImagesAdmin;
