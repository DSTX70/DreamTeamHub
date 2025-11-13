import * as React from 'react';
import { listSkuMap, upsertSkuMap } from '@/lib/fccSkuMap';

type Row = { id?: number; brand: string; shot_key: string; label: string; base_key: string };

type Check = { size: string; url: string; ok: boolean | null; err?: string };

async function headExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

function buildChecks(baseKey: string, ext: 'webp' | 'avif' = 'webp'): Check[] {
  const mk = (w: number, h: number) => `/${baseKey}_${w}x${h}.${ext}`;
  return [
    { size: 'Desktop 1920×800', url: mk(1920, 800), ok: null },
    { size: 'Tablet 960×600',   url: mk(960, 600),   ok: null },
    { size: 'Mobile 1080×1350', url: mk(1080, 1350), ok: null },
  ];
}

export default function FCCSkuSwitcher() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [brand, setBrand] = React.useState('fcc');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [checks, setChecks] = React.useState<Record<string, Check[]>>({});

  const load = async () => {
    setErr(null);
    try {
      const j = await listSkuMap(brand);
      setRows(j.items || []);
    } catch (e: any) {
      setErr(String(e));
    }
  };

  React.useEffect(() => { load(); }, [brand]);

  const save = async (i: number) => {
    setBusy(true);
    try {
      const r = rows[i];
      await upsertSkuMap({ brand, shot_key: r.shot_key, label: r.label, base_key: r.base_key });
      await load();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const validate = async (i: number) => {
    const r = rows[i];
    const list = buildChecks(r.base_key);
    setChecks(prev => ({ ...prev, [r.shot_key]: list }));

    const results = await Promise.all(list.map(async (c) => ({ ...c, ok: await headExists(c.url) })));
    setChecks(prev => ({ ...prev, [r.shot_key]: results }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fab Card Co — SKU Switcher</h1>
        <div className="text-sm text-muted-foreground">Brand:
          <select
            className="ml-2 border rounded px-2 py-1"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="fcc">fcc</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Flip lifestyle banner SKUs without code. Use <code>base_key</code> like:
        <span className="ml-1 font-mono">fcc/lifestyle/OL-1_Brunch_Banter_SKU-OL-PRIDE-001</span>
      </p>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Shot Key</th>
              <th className="text-left p-3">Label</th>
              <th className="text-left p-3">Base Key</th>
              <th className="text-left p-3 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <React.Fragment key={r.shot_key}>
                <tr className="border-t align-top">
                  <td className="p-3 font-mono">{r.shot_key}</td>
                  <td className="p-3">
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={r.label}
                      onChange={(e) =>
                        setRows(prev => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="border rounded px-2 py-1 w-full font-mono"
                      value={r.base_key}
                      onChange={(e) =>
                        setRows(prev => prev.map((x, i) => (i === idx ? { ...x, base_key: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        className="border rounded px-2 py-1"
                        onClick={() => save(idx)}
                        title="Save this mapping"
                        data-testid={`button-save-${r.shot_key}`}
                      >
                        {busy ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="border rounded px-2 py-1"
                        onClick={() => validate(idx)}
                        title="HEAD-check 1920×800 / 960×600 / 1080×1350"
                        data-testid={`button-validate-${r.shot_key}`}
                      >
                        Validate
                      </button>
                    </div>
                  </td>
                </tr>

                {checks[r.shot_key] && (
                  <tr className="border-t bg-neutral-50/60">
                    <td className="p-3" colSpan={4}>
                      <div className="flex flex-wrap gap-3">
                        {checks[r.shot_key].map((c) => (
                          <div key={c.size} className="flex items-center gap-2 border rounded px-2 py-1">
                            <span className="text-xs">{c.size}</span>
                            {c.ok === null && <span className="text-xs text-muted-foreground">…</span>}
                            {c.ok === true && <span className="text-xs text-green-600">✓</span>}
                            {c.ok === false && <span className="text-xs text-red-600">✕</span>}
                            <a href={c.url} target="_blank" rel="noreferrer" className="text-xs underline">{c.url}</a>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-muted-foreground" colSpan={4}>
                  No rows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {err && <div className="text-xs text-red-600">Error: {err}</div>}
    </div>
  );
}
