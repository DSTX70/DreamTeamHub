import React from "react";

type Item = { code: string; name: string; status: string; revenue: number; rate: number; commission: number };

function isoToday() { return new Date().toISOString().slice(0,10); }
function isoNDaysAgo(n:number) { const d = new Date(Date.now()-n*86400000); return d.toISOString().slice(0,10); }
function fmt(n:number) { return new Intl.NumberFormat(undefined, { style:"currency", currency:"USD" }).format(n); }

const AffiliatePayouts: React.FC = () => {
  const [from, setFrom] = React.useState(isoNDaysAgo(30));
  const [to, setTo] = React.useState(isoToday());
  const [items, setItems] = React.useState<Item[]>([]);
  const [totals, setTotals] = React.useState<{ revenue:number; commission:number }>({ revenue:0, commission:0 });
  const [defaultRate, setDefaultRate] = React.useState(0.10);

  const load = async () => {
    const qs = new URLSearchParams({ from, to, defaultRate: String(defaultRate) });
    const r = await fetch(`/api/ops/aff/payouts?${qs.toString()}`);
    const j = await r.json();
    setItems(j.items || []);
    setTotals(j.totals || { revenue:0, commission:0 });
  };

  React.useEffect(()=>{ load(); }, []);

  const csvHref = `/api/ops/aff/payouts.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&defaultRate=${defaultRate}`;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Affiliate Payouts</h1>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-sm">
          <span className="text-xs text-gray-600">From</span>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="text-xs text-gray-600">To</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="text-xs text-gray-600">Default Rate (%)</span>
          <input type="number" step="0.1" className="border rounded px-2 py-1 w-28"
                 value={(defaultRate*100).toFixed(1)} onChange={e=>setDefaultRate(Number(e.target.value)/100)} />
        </label>
        <button className="px-3 py-2 border rounded" onClick={load}>Refresh</button>
        <a href={csvHref} className="px-3 py-2 border rounded">Download CSV</a>
      </div>

      <div className="border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Affiliate</th>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Revenue</th>
              <th className="text-right px-3 py-2">Rate</th>
              <th className="text-right px-3 py-2">Commission</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.code} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 font-mono">{it.code}</td>
                <td className="px-3 py-2">{it.name}</td>
                <td className="px-3 py-2">{it.status}</td>
                <td className="px-3 py-2 text-right">{fmt(it.revenue)}</td>
                <td className="px-3 py-2 text-right">{(it.rate*100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-right">{fmt(it.commission)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-3 py-2 text-right" colSpan={3}>Totals</td>
              <td className="px-3 py-2 text-right">{fmt(totals.revenue)}</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right">{fmt(totals.commission)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AffiliatePayouts;
