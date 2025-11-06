import React from "react";
import FormRow from "./components/FormRow";

type Settings = {
  slackWebhookUrl: string;
  emailEnabled: boolean;
  emailFrom: string;
  emailTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  hotkeysEnabled: boolean;
};

const OpsSettings: React.FC = () => {
  const [s, setS] = React.useState<Settings | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<string>("");

  const load = async () => {
    const r = await fetch("/api/ops/settings/notifiers");
    const j = await r.json();
    setS(j.settings);
  };
  React.useEffect(()=>{ load(); }, []);

  const save = async () => {
    if (!s) return;
    setBusy(true);
    setNote("");
    try {
      await fetch("/api/ops/settings/notifiers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      setNote("Saved.");
    } finally {
      setBusy(false);
    }
  };

  const testWebhook = async () => {
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/api/ops/settings/test-webhook", { method: "POST" });
      setNote(r.ok ? "Webhook sent." : "Webhook failed.");
    } finally {
      setBusy(false);
    }
  };

  const testEmail = async () => {
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/api/ops/settings/test-email", { method: "POST" });
      setNote(r.ok ? "Email sent." : "Email failed.");
    } finally {
      setBusy(false);
    }
  };

  const scanNow = async () => {
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/api/ops/inventory/scan-now", { method: "POST" });
      setNote(r.ok ? "Scan triggered." : "Scan failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!s) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Ops Settings — Alerts</h1>

      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Global Controls</div>
        <FormRow label="Enable Keyboard Shortcuts">
          <input type="checkbox" checked={s.hotkeysEnabled} onChange={e=>setS({ ...s, hotkeysEnabled: e.target.checked })} data-testid="checkbox-hotkeys-enabled" />
        </FormRow>
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Slack / Webhook</div>
        <FormRow label="Webhook URL">
          <input className="border rounded px-2 py-1 w-full" value={s.slackWebhookUrl} onChange={e=>setS({ ...s, slackWebhookUrl: e.target.value })} />
        </FormRow>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={testWebhook} disabled={busy}>Test Webhook</button>
        </div>
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Email</div>
        <FormRow label="Enable Email">
          <input type="checkbox" checked={s.emailEnabled} onChange={e=>setS({ ...s, emailEnabled: e.target.checked })} />
        </FormRow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormRow label="From">
            <input className="border rounded px-2 py-1 w-full" value={s.emailFrom} onChange={e=>setS({ ...s, emailFrom: e.target.value })} />
          </FormRow>
          <FormRow label="To">
            <input className="border rounded px-2 py-1 w-full" value={s.emailTo} onChange={e=>setS({ ...s, emailTo: e.target.value })} />
          </FormRow>
          <FormRow label="SMTP Host">
            <input className="border rounded px-2 py-1 w-full" value={s.smtpHost} onChange={e=>setS({ ...s, smtpHost: e.target.value })} />
          </FormRow>
          <FormRow label="SMTP Port">
            <input type="number" className="border rounded px-2 py-1 w-full" value={s.smtpPort} onChange={e=>setS({ ...s, smtpPort: Number(e.target.value) })} />
          </FormRow>
          <FormRow label="SMTP User">
            <input className="border rounded px-2 py-1 w-full" value={s.smtpUser} onChange={e=>setS({ ...s, smtpUser: e.target.value })} />
          </FormRow>
          <FormRow label="SMTP Pass">
            <input type="password" className="border rounded px-2 py-1 w-full" value={s.smtpPass} onChange={e=>setS({ ...s, smtpPass: e.target.value })} />
          </FormRow>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={testEmail} disabled={busy || !s.emailEnabled}>Test Email</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 border rounded" onClick={save} disabled={busy}>Save</button>
        <button className="px-3 py-2 border rounded" onClick={scanNow} disabled={busy}>Scan now</button>
        <span className="text-sm text-gray-600">{note}</span>
      </div>
    </div>
  );
};

export default OpsSettings;
