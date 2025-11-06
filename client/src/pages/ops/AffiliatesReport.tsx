import React from "react";

type Row = {
  orderId: string;
  affiliateCode?: string | null;
  ownerUserId?: string | null;
  referrer?: string | null;
  ipHash?: string | null;
  emailHash?: string | null;
  uaHash?: string | null;
  amount?: number | null;
  createdAt: string;
};

type Totals = {
  totalOrders: number;
  totalAmount: number;
  byCode: Record<string, { orders: number; amount: number }>
};

export default function AffiliatesReport() {
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [code, setCode] = React.useState<string>("");
  const [ownerUserId, setOwnerUserId] = React.useState<string>("");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [totals, setTotals] = React.useState<Totals | null>(null);

  const load = async () => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (code) qs.set("code", code.toUpperCase());
    if (ownerUserId) qs.set("ownerUserId", ownerUserId);
    const r = await fetch("/api/affiliates/report?" + qs.toString());
    const j = await r.json();
    setRows(j.rows || []);
    setTotals(j.totals || null);
  };

  React.useEffect(()=>{ load(); }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Affiliate Report</h1>

      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="block text-sm mb-1">From</label>
          <input type="date" className="border p-2 rounded w-full" value={from} onChange={(e)=>setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">To</label>
          <input type="date" className="border p-2 rounded w-full" value={to} onChange={(e)=>setTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Code</label>
          <input className="border p-2 rounded w-full" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="PRISM10" />
        </div>
        <div>
          <label className="block text-sm mb-1">Owner</label>
          <input className="border p-2 rounded w-full" value={ownerUserId} onChange={(e)=>setOwnerUserId(e.target.value)} placeholder="user_prism" />
        </div>
        <div className="flex items-end">
          <button className="px-3 py-2 border rounded" onClick={load}>Apply</button>
        </div>
      </div>

      {totals && (
        <div className="space-y-1">
          <div>Total orders: <strong>{totals.totalOrders}</strong></div>
          <div>Total attributed amount: <strong>${totals.totalAmount.toFixed(2)}</strong></div>
          <div className="mt-2">
            <h3 className="font-medium">By Code</h3>
            <ul className="list-disc pl-6 text-sm">
              {Object.entries(totals.byCode).map(([k, v]) => (
                <li key={k}>{k}: {v.orders} orders (${v.amount.toFixed(2)})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Owner</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Referrer</th>
              <th className="py-2 pr-4">IP</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">UA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="py-2 pr-4">{r.orderId}</td>
                <td className="py-2 pr-4">{r.affiliateCode || "—"}</td>
                <td className="py-2 pr-4">{r.ownerUserId || "—"}</td>
                <td className="py-2 pr-4">{typeof r.amount === "number" ? `$${r.amount.toFixed(2)}` : "—"}</td>
                <td className="py-2 pr-4">{r.referrer || "—"}</td>
                <td className="py-2 pr-4">{r.ipHash || "—"}</td>
                <td className="py-2 pr-4">{r.emailHash || "—"}</td>
                <td className="py-2 pr-4">{r.uaHash || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <a
          className="underline"
          href={`/api/affiliates/report.csv?${new URLSearchParams({ from, to, code, ownerUserId }).toString()}`}
        >
          Download CSV
        </a>
      </div>
    </div>
  );
}
