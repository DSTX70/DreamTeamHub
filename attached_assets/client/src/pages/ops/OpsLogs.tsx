import React from "react";

const OpsLogs: React.FC = () => {
  const [lines, setLines] = React.useState<string[]>([]);
  const [limit, setLimit] = React.useState(200);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/ops/logs/tail?limit=${limit}`);
      const j = await r.json();
      setLines(j.lines || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(()=>{
    load();
    const id = setInterval(load, 5000);
    return ()=> clearInterval(id);
  }, [limit]);

  const downloadHref = "/api/ops/logs.csv";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ops Logs</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">Show last&nbsp;
            <select className="border rounded px-2 py-1" value={limit} onChange={e=>setLimit(Number(e.target.value))}>
              {[50,100,200,500,1000].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            &nbsp;lines
          </label>
          <a href={downloadHref} className="px-3 py-2 border rounded">Download CSV</a>
          <button className="px-3 py-2 border rounded" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
      </div>
      <div className="border rounded p-2 bg-black text-green-200 font-mono text-xs overflow-auto max-h-[70vh]">
        {lines.length === 0 ? <div className="text-gray-400">No log lines yet.</div> :
          <pre className="whitespace-pre-wrap">{lines.join("\n")}</pre>
        }
      </div>
    </div>
  );
};

export default OpsLogs;
