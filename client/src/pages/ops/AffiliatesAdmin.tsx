import React from "react";
import { ArrowLeft } from "lucide-react";

type Row = { code: string; name?: string; commissionRate: number|null; status: string };

function useQuery() {
  const [q, setQ] = React.useState(() => new URLSearchParams(window.location.search));
  React.useEffect(() => {
    const onPop = () => setQ(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return q;
}

const AffiliatesAdmin: React.FC = () => {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const qp = useQuery();

  const load = async () => {
    const r = await fetch("/api/ops/aff/affiliates");
    const j = await r.json();
    setRows(j.items || []);
  };
  React.useEffect(()=>{ load(); }, []);

  React.useEffect(()=>{
    const code = qp.get("code");
    if (code) setFilter(code.toUpperCase());
  }, [qp.toString()]);

  const onChange = (code: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => r.code===code ? { ...r, ...patch } : r));
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/ops/aff/affiliates", { method:"POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ items: rows }) });
      await load();
    } finally { setSaving(false); }
  };

  const filtered = rows.filter(r => !filter || r.code.toUpperCase().includes(filter));
  const hasCodeParam = !!qp.get("code");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        {hasCodeParam && (
          <a href="/ops/affiliates" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900" data-testid="link-back-to-report">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Report</span>
          </a>
        )}
        <h1 className="text-xl font-semibold">Affiliates — Rates & Status</h1>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex flex-col text-sm">
          <span className="text-xs text-gray-600">Filter by code</span>
          <input className="border rounded px-2 py-1 w-56" value={filter} onChange={e=>setFilter(e.target.value.toUpperCase())} placeholder="AFF123" data-testid="input-filter-code" />
        </label>
        <button className="px-3 py-2 border rounded" onClick={()=>setFilter("")} data-testid="button-clear-filter">Clear</button>
      </div>

      <div className="border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-right px-3 py-2">Rate (%)</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.code} className="odd:bg-white even:bg-gray-50" id={`row-${r.code}`} data-testid={`row-affiliate-${r.code}`}>
                <td className="px-3 py-2 font-mono">{r.code}</td>
                <td className="px-3 py-2">
                  <input className="border rounded px-2 py-1 w-56" value={r.name||""} onChange={e=>onChange(r.code,{ name: e.target.value })} data-testid={`input-name-${r.code}`} />
                </td>
                <td className="px-3 py-2 text-right">
                  <input className="border rounded px-2 py-1 w-24 text-right" placeholder="(default)"
                         value={r.commissionRate===null ? "" : String((r.commissionRate*100).toFixed(2))}
                         onChange={e=>{
                           const v=e.target.value.trim();
                           onChange(r.code,{ commissionRate: v===""? null : (Number(v)/100) })
                         }}
                         data-testid={`input-rate-${r.code}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <select className="border rounded px-2 py-1" value={r.status} onChange={e=>onChange(r.code,{ status: e.target.value })} data-testid={`select-status-${r.code}`}>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="px-3 py-2 border rounded" onClick={save} disabled={saving} data-testid="button-save">{saving ? "Saving…" : "Save changes"}</button>
    </div>
  );
};

export default AffiliatesAdmin;
