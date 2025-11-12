import React, { useEffect, useState } from 'react';

type Effective = { enabled:boolean; allowlist:string; maxMb:number; visible_to:'owner'|'pod'|'approvers'|'org' };
type Locked = { backend:boolean };

export function UploaderSettings(){
  const [effective, setEffective] = useState<Effective>({ enabled:true, allowlist:'json,csv,zip,webp,png,svg,txt,md', maxMb:25, visible_to:'pod' });
  const [backend, setBackend] = useState<'local'|'drive'|'s3'>('local');
  const [locked, setLocked] = useState<Locked>({ backend:true });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');

  async function load(){
    const res = await fetch('/api/ops/uploader/config');
    const data = await res.json();
    setEffective(data.effective);
    setBackend(data.backend);
    setLocked(data.locked || { backend:true });
  }
  useEffect(()=>{ load(); }, []);

  async function save(){
    setBusy(true); setMsg('');
    const res = await fetch('/api/ops/uploader/config', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-role':'ops_admin' }, body: JSON.stringify(effective)
    });
    const data = await res.json();
    if (data.ok) { setMsg('Saved'); setEffective(data.effective); }
    else setMsg(data.error || 'Save failed');
    setBusy(false);
  }

  return (
    <div>
      <h2>Uploader Settings</h2>
      <div>
        <label>Backend (env-locked)</label><br/>
        <input value={backend} readOnly aria-readonly /> {locked.backend && <small>locked by env</small>}
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Allowlist (comma-separated)</label><br/>
        <input value={effective.allowlist} onChange={e=>setEffective({ ...effective, allowlist:e.target.value })} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Max file size (MB)</label><br/>
        <input type="number" min={1} max={200} value={effective.maxMb} onChange={e=>setEffective({ ...effective, maxMb:Number(e.target.value) })} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Visibility</label><br/>
        <select value={effective.visible_to} onChange={e=>setEffective({ ...effective, visible_to: e.target.value as Effective['visible_to'] })}>
          <option value="owner">owner</option>
          <option value="pod">pod</option>
          <option value="approvers">approvers</option>
          <option value="org">org</option>
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Enabled</label><br/>
        <input type="checkbox" checked={effective.enabled} onChange={e=>setEffective({ ...effective, enabled: e.target.checked })} />
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
      </div>
    </div>
  );
}
