import Breadcrumbs from "../../components/Breadcrumbs";
import LeftRail from "../../components/LeftRail";
import React from "react";

type CoverageSummary = {
  files: number;
  lines: number;
  covered: number;
  pct: number;
};

export default function DeepDive() {
  const [data, setData] = React.useState<CoverageSummary | null>(null);

  React.useEffect(() => {
    fetch("/api/coverage/summary").then(r => r.json()).then(setData).catch(() => setData(null));
  }, []);

  return (
    <div className="flex">
      <LeftRail />
      <main className="p-6 space-y-6 flex-1">
        <Breadcrumbs trail={[{ label: "Coverage" }, { label: "Deep Dive" }]} />
        <h1 className="text-xl font-semibold">Coverage Deep Dive</h1>
        {!data ? <p>Loading…</p> : (
          <div className="space-y-2">
            <div>Files: {data.files}</div>
            <div>Lines: {data.lines}</div>
            <div>Covered: {data.covered}</div>
            <div>Percent: {data.pct.toFixed(2)}%</div>
          </div>
        )}
      </main>
    </div>
  );
}
