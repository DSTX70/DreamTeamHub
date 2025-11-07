import React from "react";
import { useNavigate } from "react-router-dom";

const SettingsIndexRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [checked, setChecked] = React.useState(false);
  const [allowed, setAllowed] = React.useState<"admin"|"editor"|"none">("none");

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ops/_auth/ping");
        if (!r.ok) { setChecked(true); setAllowed("none"); return; }
        const j = await r.json();
        const roles: string[] = Array.isArray(j?.who?.roles) ? j.who.roles : [];
        if (roles.includes("ops_admin")) { setAllowed("admin"); navigate("/ops/settings/global", { replace: true }); return; }
        if (roles.includes("ops_editor")) { setAllowed("editor"); navigate("/ops/settings/alerts", { replace: true }); return; }
        setAllowed("none");
      } catch {
        setAllowed("none");
      } finally {
        setChecked(true);
      }
    })();
  }, [navigate]);

  if (!checked) return <div className="text-sm text-gray-500">Checking permissions…</div>;
  if (allowed === "none") return <div className="text-sm text-red-600">You do not have access to Ops Settings.</div>;
  return null;
};

export default SettingsIndexRedirect;
