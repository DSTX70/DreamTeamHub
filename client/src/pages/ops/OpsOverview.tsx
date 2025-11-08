import React from "react";
import StatCard from "./components/StatCard";
import LiveHealthCard from "../../components/ops/LiveHealthCard";
import LastDeployChip from "../../components/ops/LastDeployChip";
import { OverviewHeader } from "../../components/ops/OverviewHeader";
type Overview = { inventory:{lowCount:number}; images:{bucket:string;region:string;probeOk:boolean;defaultCacheControl:string}; affiliates:{clicks:number;uniques:number;orders:number;revenue:number;commission:number;window:{fromISO:string;toISO:string}}; linter:{rules:number}; env:{databaseUrl:boolean;s3Bucket:boolean;opsToken:boolean}; digest?:{enabled:boolean;lastSent?:string}; logs?:{errors:number;events:number}; liveHealth?:any; };
function fmtCurrency(n:number){ return new Intl.NumberFormat(undefined,{style:"currency",currency:"USD"}).format(n); }
export default function OpsOverview(){
  const [data,setData]=React.useState<Overview|null>(null);
  React.useEffect(()=>{(async()=>{try{const r=await fetch("/api/ops/overview");const j=await r.json();setData(j);}catch{setData(null);}})();},[]);
  const EnvRow=()=>{
    if(!data) return <div className="text-gray-500">Loading…</div>;
    const ok=(b:boolean)=><span className={"px-2 py-0.5 rounded text-xs "+(b?"bg-green-100 text-green-800 border border-green-200":"bg-red-100 text-red-800 border border-red-200")}>{b?"OK":"Missing"}</span>;
    return(<div className="border rounded p-3">
      <div className="font-semibold mb-2">Env Health</div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-sm">
        <div>DATABASE_URL: {ok(data.env.databaseUrl)}</div>
        <div>AWS_S3_BUCKET: {ok(data.env.s3Bucket)}</div>
        <div>OPS_API_TOKEN: {ok(data.env.opsToken)}</div>
        <div>Digest: {data.digest?.enabled? <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 border border-green-200">Enabled</span>:<span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">Disabled</span>} {data.digest?.lastSent? <span className="ml-2 text-gray-600">Last: {new Date(data.digest.lastSent).toLocaleString()}</span>:<span className="ml-2 text-gray-500">Last: —</span>}</div>
        <div>Logs: <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">Err {data.logs?.errors??0} · Ev {data.logs?.events??0}</span></div>
      </div></div>);
  };
  return(<div className="space-y-0">
    <OverviewHeader />
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Ops Overview</h1>
      <LastDeployChip />
    <EnvRow/>
    <LiveHealthCard />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Inventory" subtitle="Low-stock & thresholds" href="/ops/inventory">{data?<div>Low-stock SKUs: <span className={data.inventory.lowCount?"text-red-600 font-semibold":""}>{data.inventory.lowCount}</span></div>:<div className="text-gray-500">Loading…</div>}</StatCard>
      <StatCard title="Images" subtitle="Allowlist & uploads" href="/ops/images">{data?(<div className="space-y-1"><div>Bucket: <span className="font-mono">{data.images.bucket||"(unset)"}</span></div><div>Probe: {data.images.probeOk?"OK":"Check IAM/Region"}</div><div className="text-xs text-gray-600">Cache-Control: {data.images.defaultCacheControl}</div></div>):<div className="text-gray-500">Loading…</div>}</StatCard>
      <StatCard title="Affiliates" subtitle="E2E + Ops report" href="/ops/affiliates">{data?(<div className="space-y-1"><div>Clicks: {data.affiliates.clicks} • Uniques: {data.affiliates.uniques}</div><div>Orders: {data.affiliates.orders}</div><div>Revenue: {fmtCurrency(data.affiliates.revenue)} • Commission: {fmtCurrency(data.affiliates.commission)}</div><div className="text-xs text-gray-600">Window: {new Date(data.affiliates.window.fromISO).toLocaleDateString()} → {new Date(data.affiliates.window.toISO).toLocaleDateString()}</div></div>):<div className="text-gray-500">Loading…</div>}</StatCard>
      <StatCard title="LLM Linter" subtitle="Prompt rules & fixes" href="/llm/provider/linter">{data?<div>{data.linter.rules} core rules loaded</div>:<div className="text-gray-500">Loading…</div>}</StatCard>
    </div>
    </div>
  </div>);
}