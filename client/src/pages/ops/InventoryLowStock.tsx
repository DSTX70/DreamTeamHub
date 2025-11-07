import React from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ThresholdCell from "./components/ThresholdCell";
import NotifierBadge from "./components/NotifierBadge";

type Item = { sku: string; name: string; stock: number; threshold: number; status: "LOW"|"OK"; updatedAt: string };
type EventsItem = { id: string; ts: number; type: "low-stock"; sku: string; stock: number; threshold: number };
type NotifierSettings = { slackWebhookUrl: string; emailEnabled: boolean };

function fmtDate(iso: string) { return new Date(iso).toLocaleString(); }

const InventoryLowStock: React.FC = () => {
  const [rows, setRows] = React.useState<Item[]>([]);
  const [onlyLow, setOnlyLow] = React.useState(false);
  const [events, setEvents] = React.useState<EventsItem[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [notifiers, setNotifiers] = React.useState<NotifierSettings | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);

  const load = async () => {
    const res = await fetch("/api/ops/inventory/thresholds");
    const json = await res.json();
    setRows(json.items || []);
  };
  const loadEvents = async () => {
    const res = await fetch("/api/ops/inventory/events?limit=100");
    const json = await res.json();
    setEvents(json.items || []);
  };
  const loadNotifiers = async () => {
    try {
      const r = await fetch("/api/ops/settings/notifiers");
      const j = await r.json();
      setNotifiers({ slackWebhookUrl: j.settings?.slackWebhookUrl || "", emailEnabled: !!j.settings?.emailEnabled });
    } catch {
      setNotifiers({ slackWebhookUrl: "", emailEnabled: false });
    }
  };
  const loadRoles = async () => {
    try {
      const r = await fetch("/api/ops/_auth/ping");
      const j = await r.json();
      setRoles(Array.isArray(j?.who?.roles) ? j.who.roles : []);
    } catch {
      setRoles([]);
    }
  };

  React.useEffect(() => {
    load();
    loadEvents();
    loadNotifiers();
    loadRoles();
  }, []);

  const filtered = React.useMemo(() => rows.filter(r => !onlyLow || r.status === "LOW"), [rows, onlyLow]);

  const saveThresholds = async (updates: { sku: string; threshold: number }[]) => {
    setSaving(true);
    try {
      await fetch("/api/ops/inventory/thresholds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: updates }) });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onChangeThreshold = (sku: string, threshold: number) => {
    setRows(prev => prev.map(r => r.sku === sku ? { ...r, threshold } : r));
  };

  const onSave = () => {
    const updates = rows.map(r => ({ sku: r.sku, threshold: r.threshold }));
    saveThresholds(updates);
  };

  const simulateRecount = async () => {
    const input = window.prompt("Enter sku:stock pairs (comma separated), e.g. CARD-CC-HELLO-001:9,CARD-ME-NYE-004:5");
    if (!input) return;
    const items = input.split(",").map(s => {
      const [sku, stock] = s.split(":");
      return { sku: sku?.trim(), stock: Number(stock) };
    });
    await fetch("/api/ops/inventory/recount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    await load();
    await loadEvents();
  };

  const slackActive = !!notifiers?.slackWebhookUrl;
  const emailActive = !!notifiers?.emailEnabled;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Ops", href: "/ops/overview" },
          { label: "Inventory" }
        ]}
        roles={roles}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventory — Low Stock & Thresholds</h1>
        <div className="flex items-center gap-2">
          <NotifierBadge
            label={slackActive ? "Slack: On" : "Slack: Off"}
            active={slackActive}
            href="/ops/settings"
          />
          <NotifierBadge
            label={emailActive ? "Email: On" : "Email: Off"}
            active={emailActive}
            href="/ops/settings"
          />
          <div className="flex items-center gap-2">
            <Link href="/ops/settings" className="text-xs underline text-muted-foreground hover:text-foreground">
              Settings
            </Link>
            <a href="/ops/settings" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700" title="Open Settings in new tab" data-testid="link-settings-new-tab">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} />
            Show only low
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={simulateRecount}
            className="px-3 py-2 border rounded hover-elevate active-elevate-2"
            data-testid="button-recount"
          >
            Recount (simulate)
          </button>
          <button
            onClick={onSave}
            className="px-3 py-2 border rounded hover-elevate active-elevate-2"
            disabled={saving}
            data-testid="button-save"
          >
            {saving ? "Saving…" : "Save thresholds"}
          </button>
        </div>
      </div>

      <div className="border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">SKU</th>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-right px-3 py-2">Stock</th>
              <th className="text-right px-3 py-2">Threshold</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.sku} className={row.status === "LOW" ? "bg-red-50 dark:bg-red-900/20" : "odd:bg-background even:bg-muted/30"}>
                <td className="px-3 py-2 font-mono">{row.sku}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 text-right">{row.stock}</td>
                <td className="px-3 py-2 text-right">
                  <ThresholdCell value={row.threshold} onChange={v => onChangeThreshold(row.sku, v)} />
                </td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">{fmtDate(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded p-4 bg-muted/30">
        <div className="font-semibold mb-2">Recent Low-Stock Events</div>
        <ul className="max-h-64 overflow-auto text-sm space-y-1">
          {events.map(ev => (
            <li key={ev.id} className="text-muted-foreground">
              • [{new Date(ev.ts).toLocaleString()}] {ev.type} — {ev.sku} now {ev.stock} (thr {ev.threshold})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InventoryLowStock;
