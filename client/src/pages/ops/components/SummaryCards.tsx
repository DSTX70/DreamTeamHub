import React from "react";

function fmtCurrency(n: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n); }

const SummaryCards: React.FC<{ totals: { clicks: number; uniqueVisitors: number; orders: number; revenue: number; commission: number } }> = ({ totals }) => {
  const items = [
    { label: "Clicks", value: totals.clicks },
    { label: "Unique Visitors", value: totals.uniqueVisitors },
    { label: "Orders", value: totals.orders },
    { label: "Revenue", value: fmtCurrency(totals.revenue) },
    { label: "Commission", value: fmtCurrency(totals.commission) },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <div key={it.label} className="border rounded p-3 shadow-sm">
          <div className="text-xs uppercase text-gray-500">{it.label}</div>
          <div className="text-lg font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
