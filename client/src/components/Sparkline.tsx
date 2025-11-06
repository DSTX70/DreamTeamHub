import { useMemo, useState } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  label?: string;
}

export function Sparkline({ data, width = 120, height = 28, label = "Last hour" }: SparklineProps) {
  const [hover, setHover] = useState(false);

  const { pts, d, last } = useMemo(() => {
    if (!data || !data.length) return { pts: [], d: "", last: 0 };
    
    const max = Math.max(...data, 1);
    const step = width / (data.length - 1 || 1);
    const points = data.map((v, i) => [i * step, height - (v / max) * height] as const);
    const path = points.map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(" ");
    const lastValue = data[data.length - 1] ?? 0;
    
    return { pts: points, d: path, last: lastValue };
  }, [data, width, height]);

  if (!data || !data.length) {
    return <svg width={width} height={height} />;
  }

  const toggle = () => setHover(h => !h);

  return (
    <div
      className="relative inline-block text-foreground"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={toggle}
      role="img"
      aria-label={`${label}: ${last}`}
      title={`${label}: ${last}`}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
        {/* last point indicator */}
        {pts.length > 0 && (
          <circle 
            cx={pts[pts.length - 1][0]} 
            cy={pts[pts.length - 1][1]} 
            r="2" 
            fill="currentColor" 
          />
        )}
      </svg>
      {hover && (
        <div className="absolute right-0 -top-7 px-2 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black text-xs shadow-lg whitespace-nowrap z-10">
          {label}: <b>{last}</b>
        </div>
      )}
    </div>
  );
}
