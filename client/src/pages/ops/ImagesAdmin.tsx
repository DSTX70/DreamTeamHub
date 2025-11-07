import React from "react";
import StatusBadge from "./components/StatusBadge";
import Breadcrumbs from "../../components/Breadcrumbs";

type AllowItem = { sku: string; baseKey: string };
type UploadResp = { ok: boolean; items: any[] };
type Status = { bucket: string; region: string; defaultCacheControl: string; hasBucketEnv: boolean; probeOk: boolean };
type StatItem = { key: string; width: number; ext: "avif"|"webp"|"jpg"; size: number };
type PreviewItem = { width: number; ext: "avif"|"webp"|"jpg"; size: number };

const ExternalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" className={className}>
    <path d="M14 3h7v7m0-7L10 14" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M21 10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function bytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024*1024) return (n/1024).toFixed(1) + " KB";
  return (n/1024/1024).toFixed(2) + " MB";
}

const BarChart: React.FC<{ data: StatItem[] }> = ({ data }) => {
  const widths = Array.from(new Set(data.map(d => d.width))).sort((a,b)=>a-b);
  const max = Math.max(1, ...data.map(d => d.size));
  const barH = 20, gap = 6, pad = 10;
  const height = widths.length * (barH * 3 + gap) + pad * 2 + 10;
  const widthPx = 520;
  const rowHeight = barH * 3 + gap;
  const formats: ("avif"|"webp"|"jpg")[] = ["avif","webp","jpg"];
  const color = (ext: string) => (ext === "avif" ? "#6b7280" : ext === "webp" ? "#9ca3af" : "#d1d5db");

  return (
    <svg width={widthPx} height={height} role="img" aria-label="Variant sizes chart">
      <text x={0} y={14} fontSize="12" fill="#374151">Size by width & format</text>
      {widths.map((w, i) => {
        const y0 = pad + 10 + i * rowHeight;
        return (
          <g key={w} transform={`translate(0, ${y0})`}>
            <text x={0} y={12} fontSize="10" fill="#374151">{w}px</text>
            {formats.map((ext, j) => {
              const rec = data.find(d => d.width === w && d.ext === ext);
              const size = rec?.size || 0;
              const barW = Math.max(1, Math.round((size / max) * (widthPx - 150)));
              const y = 16 + j * barH;
              return (
                <g key={ext}>
                  <rect x={60} y={y} width={barW} height={barH - 4} fill={color(ext)} />
                  <text x={60 + barW + 6} y={y + barH - 8} fontSize="10" fill="#374151">
                    {ext} • {bytes(size)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

const ImagesAdmin: React.FC = () => {
  const [allowlist, setAllowlist] = React.useState<AllowItem[]>([]);
  const [sku, setSku] = React.useState("");
  const [baseKey, setBaseKey] = React.useState("uploads/products");
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [lastFile, setLastFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState<string>("");
  const [summary, setSummary] = React.useState<{ count: number; total: number } | null>(null);
  const [variants, setVariants] = React.useState<any[]>([]);
  const [cacheControl, setCacheControl] = React.useState("public, max-age=31536000, immutable");

  const [status, setStatus] = React.useState<Status | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [stats, setStats] = React.useState<{ items: StatItem[]; totalsByExt: Record<string, number>; totalsBytes: number } | null>(null);

  // Preview drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [avifQ, setAvifQ] = React.useState(50);
  const [webpQ, setWebpQ] = React.useState(70);
  const [jpgQ, setJpgQ] = React.useState(80);
  const [sizesCsv, setSizesCsv] = React.useState("320,640,960,1280,1600,1920");
  const [preview, setPreview] = React.useState<{ items: PreviewItem[]; totalsByExt: Record<string, number>; totalsBytes: number } | null>(null);
  const [previewBusy, setPreviewBusy] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string>("");
  
  // Replace state
  const [replacing, setReplacing] = React.useState(false);

  React.useEffect(()=>{
    (async ()=>{
      const r = await fetch("/api/ops/images/allowlist"); const j = await r.json(); setAllowlist(j.items||[]);
    })();
  },[]);

  React.useEffect(()=>{
    (async ()=>{
      try { const r = await fetch("/api/ops/images/status"); const j = await r.json(); setStatus(j); } catch { setStatus(null); }
      try { const r2 = await fetch("/api/ops/_auth/ping"); const j2 = await r2.json(); setRoles(Array.isArray(j2?.roles)? j2.roles: []); } catch { setRoles([]); }
    })();
  },[]);

  const addAllow = async () => {
    await fetch("/api/ops/images/allowlist", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ items:[{ sku, baseKey }] }) });
    setSku(""); const r = await fetch("/api/ops/images/allowlist"); const j = await r.json(); setAllowlist(j.items||[]);
  };

  const remove = async (sku: string) => {
    await fetch("/api/ops/images/allowlist/" + encodeURIComponent(sku), { method:"DELETE" });
    const r = await fetch("/api/ops/images/allowlist"); const j = await r.json(); setAllowlist(j.items||[]);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      setFiles(e.dataTransfer.files);
      setLastFile(e.dataTransfer.files[0]);
    }
  };

  const refreshStats = async (key: string) => {
    const s = await fetch(`/api/ops/images/stats?baseKey=${encodeURIComponent(key)}`).then(r=>r.json());
    setStats(s);
  };

  const onUpload = async () => {
    if (!files || !sku || !baseKey) return;
    let total = 0; for (const f of Array.from(files)) total += f.size; setSummary({ count: files.length, total });
    const form = new FormData(); form.append("sku", sku); form.append("baseKey", baseKey); form.append("cacheControl", cacheControl);
    Array.from(files).forEach(f => form.append("files", f, f.name));
    setProgress("Uploading…");
    const res = await fetch("/api/ops/images/upload", { method: "POST", body: form });
    const json: UploadResp = await res.json(); setProgress(json.ok ? "Done" : "Failed");
    const list = await (await fetch("/api/ops/images/variants/" + encodeURIComponent(baseKey))).json(); setVariants(list.items || []);
    await refreshStats(baseKey);
  };

  React.useEffect(()=>{
    if (baseKey) { refreshStats(baseKey).catch(()=>{}); }
  }, [baseKey]);

  const runPreview = async () => {
    setPreviewBusy(true);
    setPreviewError("");
    try {
      const form = new FormData();
      const source = lastFile || (files && files[0]) || null;
      if (!source) { setPreviewError("Select a source image (drag & drop or choose file above)"); setPreviewBusy(false); return; }
      form.append("file", source);
      form.append("sizes", sizesCsv);
      form.append("avifQ", String(avifQ));
      form.append("webpQ", String(webpQ));
      form.append("jpgQ", String(jpgQ));
      const r = await fetch("/api/ops/images/preview", { method: "POST", body: form });
      if (!r.ok) { setPreviewError("Preview failed"); setPreviewBusy(false); return; }
      const j = await r.json();
      setPreview({ items: j.items || [], totalsByExt: j.totalsByExt || {}, totalsBytes: j.totalsBytes || 0 });
    } catch (e:any) {
      setPreviewError("Preview error");
    } finally {
      setPreviewBusy(false);
    }
  };

  const getTargetPrefixFromStats = (): string | null => {
    if (!stats?.items || stats.items.length === 0) return null;
    const firstKey = stats.items[0].key;
    // Strip -<width>.<ext> from the end
    const match = firstKey.match(/^(.+)-\d+\.(avif|webp|jpg)$/);
    return match ? match[1] : null;
  };

  const doReplace = async () => {
    setReplacing(true);
    setPreviewError("");
    try {
      const targetPrefix = getTargetPrefixFromStats();
      if (!targetPrefix) { setPreviewError("No uploaded variants found"); setReplacing(false); return; }
      
      const form = new FormData();
      const source = lastFile || (files && files[0]) || null;
      if (!source) { setPreviewError("Select a source image"); setReplacing(false); return; }
      
      form.append("file", source);
      form.append("targetPrefix", targetPrefix);
      form.append("sizes", sizesCsv);
      form.append("avifQ", String(avifQ));
      form.append("webpQ", String(webpQ));
      form.append("jpgQ", String(jpgQ));
      
      const r = await fetch("/api/ops/images/reencode", { method: "POST", body: form });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: "Re-encode failed" }));
        setPreviewError(err.error || "Re-encode failed");
        setReplacing(false);
        return;
      }
      
      const j = await r.json();
      console.log("[ImagesAdmin] Re-encoded variants:", j);
      
      // Refresh stats to show new sizes
      await refreshStats(baseKey);
      setPreviewError("✓ Replaced successfully");
      
    } catch (e: any) {
      setPreviewError("Replace error: " + (e?.message || "unknown"));
    } finally {
      setReplacing(false);
    }
  };

  // Build comparison map: uploaded stats -> preview sizes
  const uploadedMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (stats?.items||[]).forEach(it => map.set(`${it.width}-${it.ext}`, it.size));
    return map;
  }, [stats]);

  const compareRows = React.useMemo(() => {
    const rows: { width:number; ext:"avif"|"webp"|"jpg"; uploaded?:number; preview?:number; delta?:number; pct?:number }[] = [];
    (preview?.items||[]).forEach(p => {
      const key = `${p.width}-${p.ext}`;
      const uploaded = uploadedMap.get(key);
      const delta = (uploaded !== undefined) ? (p.size - uploaded) : undefined;
      const pct = (uploaded && uploaded>0 && delta!==undefined) ? (delta/uploaded*100) : undefined;
      rows.push({ width: p.width, ext: p.ext, uploaded, preview: p.size, delta, pct });
    });
    return rows.sort((a,b)=> (a.width - b.width) || (a.ext.localeCompare(b.ext)));
  }, [preview, uploadedMap]);

  const s3State: "ok"|"warn"|"err" = status ? (status.hasBucketEnv ? (status.probeOk ? "ok" : "warn") : "err") : "warn";
  const ccState: "ok"|"warn"|"err" = status ? (status.defaultCacheControl ? "ok" : "warn") : "warn";

  return (
    <div className="p-4 space-y-6">
      <Breadcrumbs items={[{label:"Ops", href:"/ops/overview"}, {label:"Images"}]} roles={roles} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Responsive Images — Allowlist & Upload</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge label={status ? `S3: ${status.bucket || "(unset)"}` : "S3: (loading)"} state={s3State} />
            <StatusBadge label={status ? `Cache-Control: ${status.defaultCacheControl || "(unset)"}` : "Cache-Control: (loading)"} state={ccState} />
          </div>
          <div className="flex items-center gap-2">
            <a className="text-xs underline text-gray-600" href="/ops/settings">Settings</a>
            <a className="text-gray-500 hover:text-gray-800" href="/ops/settings" target="_blank" rel="noopener noreferrer" aria-label="Open settings in new tab" title="Open in new tab">
              <ExternalIcon />
            </a>
          </div>
        </div>
      </div>

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
                  <td className="px-3 py-2 text-right"><button className="px-2 py-1 border rounded" onClick={()=>setBaseKey(it.baseKey)}>Use</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-semibold">Upload & Transform</div>
        <div
          onDragOver={e=>e.preventDefault()}
          onDrop={onDrop}
          className="border-dashed border-2 rounded p-6 text-center"
        >
          Drag & drop images here (png, jpg, webp, avif). SVG/XML is blocked.
        </div>
        <div className="flex gap-2 items-center">
          <input type="file" multiple onChange={e=>{ setFiles(e.target.files); setLastFile(e.target.files ? e.target.files[0] : null); }} />
          <button className="px-3 py-1 border rounded" onClick={onUpload}>Upload</button>
          <span>{progress}</span>
        </div>
        {summary && (<div className="text-sm text-gray-600">Total payload: {summary.count} files, {bytes(summary.total)}</div>)}
      </section>

      {stats && (
        <section className="space-y-2">
          <div className="font-semibold">Quality vs Size (by uploaded variants)</div>
          <BarChart data={stats.items as any} />
          <div className="border rounded p-3">
            <div className="text-sm">
              Totals — AVIF: {bytes(stats.totalsByExt?.avif||0)} • WEBP: {bytes(stats.totalsByExt?.webp||0)} • JPG: {bytes(stats.totalsByExt?.jpg||0)} • All: {bytes(stats.totalsBytes||0)}
            </div>
          </div>
        </section>
      )}

      {/* Preview drawer */}
      <section className="border rounded p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Preview re-encode</div>
          <button className="px-3 py-1 border rounded" onClick={()=>setDrawerOpen(v=>!v)}>{drawerOpen ? "Close" : "Open"}</button>
        </div>

        {drawerOpen && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="flex flex-col text-sm">
                <span className="text-xs text-gray-600">AVIF Quality</span>
                <input type="range" min={1} max={100} value={avifQ} onChange={e=>setAvifQ(Number(e.target.value))} />
                <span className="text-xs">{avifQ}</span>
              </label>
              <label className="flex flex-col text-sm">
                <span className="text-xs text-gray-600">WEBP Quality</span>
                <input type="range" min={1} max={100} value={webpQ} onChange={e=>setWebpQ(Number(e.target.value))} />
                <span className="text-xs">{webpQ}</span>
              </label>
              <label className="flex flex-col text-sm">
                <span className="text-xs text-gray-600">JPG Quality</span>
                <input type="range" min={1} max={100} value={jpgQ} onChange={e=>setJpgQ(Number(e.target.value))} />
                <span className="text-xs">{jpgQ}</span>
              </label>
              <label className="flex flex-col text-sm">
                <span className="text-xs text-gray-600">Widths (CSV)</span>
                <input className="border rounded px-2 py-1" value={sizesCsv} onChange={e=>setSizesCsv(e.target.value)} />
              </label>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <button className="px-3 py-1 border rounded" onClick={runPreview} disabled={previewBusy}>{previewBusy ? "Running…" : "Run Preview"}</button>
              
              {roles.includes("ops_admin") && (
                <button 
                  className="px-3 py-1 border rounded bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={doReplace}
                  disabled={replacing || !preview || !stats || stats.items.length === 0 || (!lastFile && !files)}
                  title="Re-encode and replace existing S3 variants (ops_admin only)"
                >
                  {replacing ? "Replacing…" : "Replace uploaded variants"}
                </button>
              )}
              
              {previewError && <span className={`text-sm ${previewError.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{previewError}</span>}
            </div>

            {preview && (
              <div className="space-y-3">
                <div className="text-sm">
                  Preview totals — AVIF: {bytes(preview.totalsByExt?.avif||0)} • WEBP: {bytes(preview.totalsByExt?.webp||0)} • JPG: {bytes(preview.totalsByExt?.jpg||0)} • All: {bytes(preview.totalsBytes||0)}
                </div>

                <div className="border rounded overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Width</th>
                        <th className="text-left px-3 py-2">Format</th>
                        <th className="text-right px-3 py-2">Uploaded</th>
                        <th className="text-right px-3 py-2">Preview</th>
                        <th className="text-right px-3 py-2">Δ Size</th>
                        <th className="text-right px-3 py-2">Δ %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview && preview.items.map((p, idx) => {
                        const key = `${p.width}-${p.ext}`;
                        const up = uploadedMap.get(key);
                        const delta = (up !== undefined) ? p.size - up : undefined;
                        const pct = (up && up>0 && delta!==undefined) ? (delta/up*100) : undefined;
                        return (
                          <tr key={idx} className="odd:bg-white even:bg-gray-50">
                            <td className="px-3 py-2">{p.width}</td>
                            <td className="px-3 py-2">{p.ext}</td>
                            <td className="px-3 py-2 text-right">{up !== undefined ? bytes(up) : "—"}</td>
                            <td className="px-3 py-2 text-right">{bytes(p.size)}</td>
                            <td className={"px-3 py-2 text-right " + (delta!==undefined ? (delta>0?"text-red-700":"text-green-700"):"")}>
                              {delta!==undefined ? (delta>0?"+":"") + bytes(Math.abs(delta)) : "—"}
                            </td>
                            <td className={"px-3 py-2 text-right " + (pct!==undefined ? (pct>0?"text-red-700":"text-green-700"):"")}>
                              {pct!==undefined ? (pct>0?"+":"") + pct.toFixed(1) + "%" : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
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
