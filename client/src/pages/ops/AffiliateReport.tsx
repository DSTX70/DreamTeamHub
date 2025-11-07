import React, { useEffect, useMemo, useState } from "react";
import SummaryCards from "./components/SummaryCards";

type ReportItem = {
  code: string;
  clicks: number;
  uniqueVisitors: number;
  orders: number;
  revenue: number;
  commission: number;
  conversionRate: number;
};

type ReportResp = {
  items: ReportItem[];
  totals: { clicks: number; uniqueVisitors: number; orders: number; revenue: number; commission: number };
  window: { fromISO: string; toISO: string };
  commissionRate: number;
};

type EventItem = { id: string; ts: number; type: "click" | "attribution"; code?: string; orderId?: string; orderTotal?: number; source?: string };

type AffiliateAdminRow = { code: string; name?: string; commissionRate: number|null; status: string };

function fmtCurrency(n: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n); }
function fmtPct(n: number) { return (n * 100).toFixed(1) + "%"; }
function isoToday() { const d = new Date(); return d.toISOString().slice(0,10); }
function isoNDaysAgo(n: number) { const d = new Date(Date.now() - n*86400000); return d.toISOString().slice(0,10); }

const Badge: React.FC<{ children: React.ReactNode; tone?: "gray"|"blue"|"red" }> = ({ children, tone="gray" }) => {
  const cls = tone === "blue"
    ? "bg-blue-100 text-blue-800 border-blue-200"
    : tone === "red"
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-gray-100 text-gray-800 border-gray-200";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs border ${cls}`}>{children}</span>;
};

const DownloadCsvButton: React.FC<{ from: string; to: string; rate: number }> = ({ from, to, rate }) => {
  const href = `/api/ops/aff/report.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&rate=${rate}`;
  return <a href={href} className="inline-flex items-center px-3 py-2 border rounded">Download CSV</a>;
};

const DateFilters: React.FC<{ from: string; to: string; setFrom: (s: string)=>void; setTo: (s: string)=>void; rate: number; setRate: (n: number)=>void; onRefresh: ()=>void; onSetRange?: (from: string, to: string)=>void; }> = ({ from, to, setFrom, setTo, rate, setRate, onRefresh, onSetRange }) => {
  const handleQuickSelect = (days: number) => {
    const newFrom = isoNDaysAgo(days);
    const newTo = isoToday();
    setFrom(newFrom);
    setTo(newTo);
    if (onSetRange) {
      onSetRange(newFrom, newTo);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-end mb-4">
      <div className="flex flex-col">
        <label>From</label>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-2 py-1"/>
      </div>
      <div className="flex flex-col">
        <label>To</label>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-2 py-1"/>
      </div>
      <div className="flex flex-col">
        <label>Commission %</label>
        <input type="number" min={0} max={100} step={0.5} value={rate*100} onChange={e=>setRate(Number(e.target.value)/100)} className="border rounded px-2 py-1 w-28"/>
      </div>
      <button onClick={onRefresh} className="px-3 py-2 border rounded">Refresh</button>
      <div className="flex gap-2">
        <button className="px-2 py-1 border rounded" onClick={()=>handleQuickSelect(7)}>Last 7d</button>
        <button className="px-2 py-1 border rounded" onClick={()=>handleQuickSelect(30)}>Last 30d</button>
      </div>
      <DownloadCsvButton from={from} to={to} rate={rate} />
    </div>
  );
};

const EventsPane: React.FC = () => {
  const [items, setItems] = useState<EventItem[]>([]);
  useEffect(()=>{
    fetch(`/api/ops/aff/events?limit=100`).then(r=>r.json()).then(d=>setItems(d.items||[]));
  },[]);
  return (
    <div className="border rounded p-3 mt-6">
      <div className="font-semibold mb-2">Recent Events</div>
      <ul className="max-h-64 overflow-auto space-y-1 text-sm">
        {items.map(ev=>{
          const when = new Date(ev.ts).toLocaleString();
          if (ev.type === "click") {
            return <li key={ev.id}>• [{when}] Click — code {ev.code}</li>;
          } else {
            return <li key={ev.id}>• [{when}] Attribution — code {ev.code || "UNATTRIBUTED"} — order {ev.orderId} ({fmtCurrency(ev.orderTotal||0)})</li>;
          }
        })}
      </ul>
    </div>
  );
};

const Table: React.FC<{
  rows: ReportItem[];
  totals: ReportResp["totals"];
  defaultRate: number;
  overrides: Record<string, number|null|undefined>;
  statuses: Record<string, string|undefined>;
}> = ({ rows, totals, defaultRate, overrides, statuses }) => {
  const rateBadge = (code: string) => {
    const ov = overrides[code];
    if (ov === null || ov === undefined) return null;
    if (Math.abs(ov - defaultRate) < 1e-9) return null;
    return <Badge tone="blue">{(ov*100).toFixed(1)}% (override)</Badge>;
  };
  const suspendedBadge = (code: string) => {
    const st = (statuses[code]||"").toLowerCase();
    if (st === "suspended") return <Badge tone="red">suspended</Badge>;
    return null;
  };

  return (
    <div className="border rounded overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Affiliate</th>
            <th className="text-right px-3 py-2">Clicks</th>
            <th className="text-right px-3 py-2">Unique</th>
            <th className="text-right px-3 py-2">Orders</th>
            <th className="text-right px-3 py-2">Conv%</th>
            <th className="text-right px-3 py-2">Revenue</th>
            <th className="text-right px-3 py-2">Commission</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.code} className="odd:bg-white even:bg-gray-50 align-top">
              <td className="px-3 py-2">
                <div className="font-mono">{r.code}</div>
                <div className="flex gap-2 mt-1">
                  {suspendedBadge(r.code)}
                  {rateBadge(r.code)}
                </div>
              </td>
              <td className="px-3 py-2 text-right">{r.clicks}</td>
              <td className="px-3 py-2 text-right">{r.uniqueVisitors}</td>
              <td className="px-3 py-2 text-right">{r.orders}</td>
              <td className="px-3 py-2 text-right">{fmtPct(r.conversionRate)}</td>
              <td className="px-3 py-2 text-right">{fmtCurrency(r.revenue)}</td>
              <td className="px-3 py-2 text-right">{fmtCurrency(r.commission)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td className="px-3 py-2 text-right">Totals</td>
            <td className="px-3 py-2 text-right">{totals.clicks}</td>
            <td className="px-3 py-2 text-right">{totals.uniqueVisitors}</td>
            <td className="px-3 py-2 text-right">{totals.orders}</td>
            <td className="px-3 py-2 text-right">—</td>
            <td className="px-3 py-2 text-right">{fmtCurrency(totals.revenue)}</td>
            <td className="px-3 py-2 text-right">{fmtCurrency(totals.commission)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const AffiliateReport: React.FC = () => {
  const [from, setFrom] = useState(isoNDaysAgo(30));
  const [to, setTo] = useState(isoToday());
  const [rate, setRate] = useState(0.10);
  const [data, setData] = useState<ReportResp | null>(null);
  const [loading, setLoading] = useState(false);

  // NEW: affiliates map for overrides & status
  const [overrides, setOverrides] = useState<Record<string, number|null|undefined>>({});
  const [statuses, setStatuses] = useState<Record<string, string|undefined>>({});

  const fetchAffiliates = async () => {
    try {
      const r = await fetch("/api/ops/aff/affiliates");
      const j = await r.json();
      const list: AffiliateAdminRow[] = j.items || [];
      const o: Record<string, number|null|undefined> = {};
      const s: Record<string, string|undefined> = {};
      list.forEach(a => { o[a.code] = a.commissionRate; s[a.code] = a.status; });
      setOverrides(o);
      setStatuses(s);
    } catch {
      setOverrides({});
      setStatuses({});
    }
  };

  const fetchData = async (customFrom?: string, customTo?: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ 
        from: customFrom || from, 
        to: customTo || to, 
        rate: String(rate) 
      });
      const res = await fetch(`/api/ops/aff/report?${qs.toString()}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRange = (newFrom: string, newTo: string) => {
    fetchData(newFrom, newTo);
  };

  useEffect(()=>{ fetchData(); fetchAffiliates(); }, []);

  const rows = data?.items || [];
  const totals = data?.totals || { clicks:0, uniqueVisitors:0, orders:0, revenue:0, commission:0 };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Affiliate Report</h1>
      <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} rate={rate} setRate={setRate} onRefresh={fetchData} onSetRange={handleSetRange} />
      <SummaryCards totals={totals} />
      {loading ? <div>Loading…</div> : <Table rows={rows} totals={totals} defaultRate={data?.commissionRate ?? rate} overrides={overrides} statuses={statuses} />}
      <EventsPane />
      <div className="text-xs text-gray-500">Window: {data?.window.fromISO} → {data?.window.toISO}. Default commission: {(data?.commissionRate ?? rate)*100}%</div>
    </div>
  );
};

export default AffiliateReport;
