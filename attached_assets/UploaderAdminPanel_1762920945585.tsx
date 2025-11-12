import React, { useEffect, useState } from 'react';

type Cfg = { backend: 'local'|'drive'|'s3'; allowlist: string; maxMb: number };

export function UploaderAdminPanel(){
  const [cfg, setCfg] = useState<Cfg>({ backend: 'local', allowlist: 'json,csv,zip,webp,png,svg,txt,md', maxMb: 25 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');

  async function load(){
    const res = await fetch('/api/ops/uploader/config');
    const data = await res.json();
    setCfg(data);
  }
  useEffect(()=>{ load(); }, []);

  async function save(){
    setSaving(true); setMsg('');
    const body = {
      backend: cfg.backend,
      allowlist: cfg.allowlist.split(',').map(s=>s.trim()).filter(Boolean).join(','),
      maxMb: Math.max(1, Number(cfg.maxMb)||25)
    };
    const res = await fetch('/api/ops/uploader/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.ok) setMsg('Saved ✓');
    else setMsg(data.error || 'Save failed');
    setSaving(false);
  }

  return (
    <div className="max-w-xl p-6 rounded-2xl border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Uploader Settings</h2>

      <label className="block text-sm mb-1">Storage Backend</label>
      <select className="w-full mb-4 p-2 rounded bg-gray-900 border border-gray-700"
        value={cfg.backend} onChange={e=>setCfg({...cfg, backend: e.target.value as Cfg['backend']})}>
        <option value="local">local</option>
        <option value="drive">drive (Google Drive)</option>
        <option value="s3">s3</option>
      </select>

      <label className="block text-sm mb-1">Allowlist (comma-separated extensions)</label>
      <input className="w-full mb-4 p-2 rounded bg-gray-900 border border-gray-700"
        value={cfg.allowlist} onChange={e=>setCfg({...cfg, allowlist: e.target.value})} />

      <label className="block text-sm mb-1">Max File Size (MB)</label>
      <input type="number" min={1} className="w-full mb-4 p-2 rounded bg-gray-900 border border-gray-700"
        value={cfg.maxMb} onChange={e=>setCfg({...cfg, maxMb: Number(e.target.value)})} />

      <button onClick={save} disabled={saving}
        className="px-4 py-2 rounded bg-white text-black font-medium hover:opacity-90">
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
      {msg && <span className="ml-3 text-sm text-green-400">{msg}</span>}

      <p className="mt-6 text-xs text-gray-400">
        Tip: Changes apply immediately; refresh your Work Item page to see the Files panel reflect new limits.
      </p>
    </div>
  );
}
