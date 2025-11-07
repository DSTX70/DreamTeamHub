import React from "react";

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false), 1000); } catch {}
  };
  return (
    <button onClick={onCopy} className="text-xs px-2 py-0.5 border rounded bg-gray-800 text-gray-100 hover:bg-gray-700">
      {copied ? "✓" : "Copy"}
    </button>
  );
};

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

      <div className="border rounded bg-black text-green-200 font-mono text-xs overflow-auto max-h-[70vh]">
        {lines.length === 0 ? (
          <div className="text-gray-400 p-2">No log lines yet.</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {lines.map((ln, i) => (
              <li key={i} className="p-2 flex items-start gap-2">
                <CopyBtn text={ln} />
                <pre className="whitespace-pre-wrap flex-1">{ln}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OpsLogs;
