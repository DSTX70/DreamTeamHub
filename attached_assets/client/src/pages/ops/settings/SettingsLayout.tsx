import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import Breadcrumbs from "../../../components/Breadcrumbs";

const Tab: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded border ${isActive ? 'bg-gray-100 border-gray-300' : 'border-transparent hover:bg-gray-50'}`
    }
    end
  >
    {label}
  </NavLink>
);

const SettingsLayout: React.FC = () => {
  const loc = useLocation();
  const [roles, setRoles] = React.useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ops/_auth/ping");
        const j = await r.json();
        const rs = Array.isArray(j?.who?.roles) ? j.who.roles : [];
        setRoles(rs);
      } catch {
        setRoles([]);
      }
    })();
  }, []);

  const tail = loc.pathname.endsWith("/global") ? "Global" : loc.pathname.endsWith("/alerts") ? "Alerts" : "Settings";

  return (
    <div className="p-4 space-y-4">
      <Breadcrumbs
        items={[
          { label: "Ops", href: "/ops/overview" },
          { label: "Settings", href: "/ops/settings" },
          { label: tail }
        ]}
        roles={roles}
      />
      <div className="flex gap-2">
        <Tab to="alerts" label="Alerts" />
        <Tab to="global" label="Global" />
      </div>
      <div className="border rounded p-3">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout;
