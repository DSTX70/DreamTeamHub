import React from "react";

const ThresholdCell: React.FC<{ value: number; onChange: (v:number)=>void }> = ({ value, onChange }) => {
  const [local, setLocal] = React.useState(String(value));
  React.useEffect(()=>{ setLocal(String(value)); }, [value]);

  const commit = () => {
    const n = Math.max(0, Math.floor(Number(local)));
    if (Number.isFinite(n)) onChange(n);
  };

  return (
    <input
      className="border rounded px-2 py-1 w-20 text-right"
      value={local}
      onChange={e=>setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e=>{ if (e.key === "Enter") commit(); }}
    />
  );
};

export default ThresholdCell;
