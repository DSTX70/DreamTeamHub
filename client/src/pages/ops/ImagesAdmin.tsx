import React from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusBadge from "./components/StatusBadge";

type AllowItem = { sku: string; baseKey: string };
type UploadResp = { ok: boolean; items: any[] };
type Status = {
  bucket: string;
  region: string;
  defaultCacheControl: string;
  hasBucketEnv: boolean;
  probeOk: boolean;
};

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
  const [status, setStatus] = React.useState<Status | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);

  const load = async () => {
    const r = await fetch("/api/ops/images/allowlist");
    const j = await r.json();
    setAllowlist(j.items || []);
  };
  
  const loadStatus = async () => {
    try {
      const r = await fetch("/api/ops/images/status");
      const j = await r.json();
      setStatus(j);
    } catch {
      setStatus(null);
    }
  };

  const loadRoles = async () => {
    try {
      const r = await fetch("/api/ops/_auth/ping");
      const j = await r.json();
      setRoles(Array.isArray(j?.who?.roles) ? j.who.roles : []);
    } catch {
      setRoles([]);
    }
  };
  
  React.useEffect(() => {
    load();
    loadStatus();
    loadRoles();
  }, []);

  const addAllow = async () => {
    await fetch("/api/ops/images/allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ sku, baseKey }] })
    });
    setSku("");
    await load();
  };

  const remove = async (sku: string) => {
    await fetch("/api/ops/images/allowlist/" + encodeURIComponent(sku), { method: "DELETE" });
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

  const s3State: "ok"|"warn"|"err" = status
    ? (status.hasBucketEnv ? (status.probeOk ? "ok" : "warn") : "err")
    : "warn";
  const ccState: "ok"|"warn"|"err" = status
    ? (status.defaultCacheControl ? "ok" : "warn")
    : "warn";

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Ops", href: "/ops/overview" },
          { label: "Images" }
        ]}
        roles={roles}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Responsive Images — Allowlist & Upload</h1>
        <div className="flex items-center gap-2">
          <StatusBadge
            label={status ? `S3: ${status.bucket || "(unset)"}` : "S3: (loading)"}
            state={s3State}
          />
          <StatusBadge
            label={status ? `Cache-Control: ${status.defaultCacheControl || "(unset)"}` : "Cache-Control: (loading)"}
            state={ccState}
          />
          <div className="flex items-center gap-2">
            <Link href="/ops/settings" className="text-xs underline text-muted-foreground hover:text-foreground">
              Settings
            </Link>
            <a href="/ops/settings" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700" title="Open Settings in new tab" data-testid="link-settings-new-tab">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="font-semibold">Allowlist</div>
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="SKU"
            value={sku}
            onChange={e => setSku(e.target.value)}
            data-testid="input-sku"
          />
          <input
            className="border rounded px-2 py-1 w-96"
            placeholder="Base key (e.g., uploads/products/CARD-CC-HELLO-001)"
            value={baseKey}
            onChange={e => setBaseKey(e.target.value)}
            data-testid="input-base-key"
          />
          <button
            className="px-3 py-1 border rounded hover-elevate active-elevate-2"
            onClick={addAllow}
            data-testid="button-add-allowlist"
          >
            Add/Update
          </button>
        </div>
        <div className="border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-3 py-2">SKU</th>
                <th className="text-left px-3 py-2">Base Key</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {allowlist.map(it => (
                <tr key={it.sku} className="odd:bg-background even:bg-muted/50">
                  <td className="px-3 py-2 font-mono">{it.sku}</td>
                  <td className="px-3 py-2">{it.baseKey}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="px-2 py-1 border rounded hover-elevate active-elevate-2"
                      onClick={() => remove(it.sku)}
                      data-testid={`button-remove-${it.sku}`}
                    >
                      Remove
                    </button>
                  </td>
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
          <input
            className="border rounded px-2 py-1 w-[480px]"
            value={cacheControl}
            onChange={e => setCacheControl(e.target.value)}
            data-testid="input-cache-control"
          />
        </div>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className="border-dashed border-2 rounded p-6 text-center text-muted-foreground"
          data-testid="dropzone-upload"
        >
          Drag & drop images here (png, jpg, webp, avif). SVG/XML is blocked.
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            multiple
            onChange={e => setFiles(e.target.files)}
            data-testid="input-file-upload"
          />
          <button
            className="px-3 py-1 border rounded hover-elevate active-elevate-2"
            onClick={onUpload}
            data-testid="button-upload"
          >
            Upload
          </button>
          <span className="text-sm text-muted-foreground">{progress}</span>
        </div>
        {summary && (
          <div className="text-sm text-muted-foreground">
            Total payload: {summary.count} files, {bytes(summary.total)}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-semibold">Generated Variants</div>
        <div className="border rounded overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-3 py-2">Key</th>
                <th className="text-right px-3 py-2">Width</th>
                <th className="text-left px-3 py-2">Ext</th>
                <th className="text-right px-3 py-2">Size</th>
              </tr>
            </thead>
            <tbody>
              {variants.map(v => (
                <tr key={v.key} className="odd:bg-background even:bg-muted/50">
                  <td className="px-3 py-2 font-mono text-xs">{v.key}</td>
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
