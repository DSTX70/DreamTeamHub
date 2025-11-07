import React from "react";
import Tooltip from "./Tooltip";

const Item: React.FC<{ href: string; label: string; desc?: string; right?: React.ReactNode }> = ({ href, label, desc, right }) => (
  <a href={href} className="block px-3 py-2 rounded hover:bg-gray-50">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc ? <div className="text-xs text-gray-500">{desc}</div> : null}
      </div>
      {right}
    </div>
  </a>
);

const roleColors: Record<string, string> = {
  ops_viewer: "bg-gray-100 text-gray-700 border-gray-200",
  ops_editor: "bg-blue-100 text-blue-700 border-blue-200",
  ops_admin:  "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const Chip: React.FC<{ role: string }> = ({ role }) => (
  <span className={`text-[10px] px-1 py-0.5 rounded border ${roleColors[role] || "bg-gray-100 text-gray-700 border-gray-200"}`}>{role}</span>
);

const HeaderOpsMenu: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = React.useState<boolean>(true);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [logs, setLogs] = React.useState<{errors:number;events:number}>({errors:0, events:0});
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!ref.current) return; if (!ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ops/settings/notifiers"); const j = await r.json(); setHotkeysEnabled(j.settings?.hotkeysEnabled ?? true);
      } catch { setHotkeysEnabled(true); }
      try {
        const r = await fetch("/api/ops/_auth/ping"); const j = await r.json(); setRoles(Array.isArray(j?.who?.roles) ? j.who.roles : []);
      } catch { setRoles([]); }
      try {
        const r = await fetch("/api/ops/overview"); const j = await r.json(); setLogs(j.logs || { errors:0, events:0 });
      } catch { setLogs({ errors:0, events:0 }); }
    })();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hotkeysEnabled) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const editable = el?.getAttribute?.("contenteditable");
      if (tag === "INPUT" || tag === "TEXTAREA" || editable === "true") return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeysEnabled]);

  const logsBadge = <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 border border-gray-200">Err {logs.errors} · Ev {logs.events}</span>;

  return (
    <div className="relative" ref={ref}>
      <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:shadow-sm" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="menu">
        <span className="inline-flex items-center gap-2">
          <span>Ops</span>
          <span className="inline-flex items-center gap-1">
            {roles.slice(0,3).map(r => <Chip key={r} role={r} />)}
            {roles.length > 3 && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">+{roles.length-3}</span>}
          </span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70"><path d="M7 10l5 5 5-5H7z"></path></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-2 z-50">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="text-xs uppercase tracking-wide text-gray-500">Operations</div>
            <Tooltip muted={!hotkeysEnabled} content={hotkeysEnabled ? (<div className="text-xs">g o — Overview<br/>g i — Inventory<br/>g m — Images<br/>g a — Affiliates<br/>g s — Settings</div>) : <div className="text-gray-500 text-xs">Hotkeys disabled by Ops</div>} />
          </div>
          <Item href="/ops/overview"   label="Overview"   desc="Ops dashboard & health" />
          <Item href="/ops/inventory"  label="Inventory"  desc="Low stock & thresholds" />
          <Item href="/ops/images"     label="Images"     desc="Allowlist & uploader" />
          <Item href="/ops/affiliates" label="Affiliates" desc="E2E & Ops report" />
          <Item href="/ops/logs"       label="Logs"       desc="Live tail & CSV" right={logsBadge} />
          <div className="h-px bg-gray-200 my-1" />
          {roles.includes("ops_admin") && <Item href="/ops/settings"   label="Settings"   desc="Alerts & notifications" />}
        </div>
      )}
    </div>
  );
};

export default HeaderOpsMenu;
