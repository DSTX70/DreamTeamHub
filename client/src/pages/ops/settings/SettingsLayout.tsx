import { Link, Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumbs from "@/components/Breadcrumbs";
import RequireRole from "@/components/RequireRole";
import SettingsAlerts from "@/pages/ops/settings/SettingsAlerts";
import SettingsGlobal from "@/pages/ops/settings/SettingsGlobal";
import SettingsIndexRedirect from "@/pages/ops/settings/SettingsIndexRedirect";

export default function SettingsLayout() {
  const [location, setLocation] = useLocation();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const r = await fetch("/api/ops/_auth/ping");
        const j = await r.json();
        const roles = Array.isArray(j?.roles) ? j.roles : [];
        setUserRoles(roles);
      } catch {
        setUserRoles([]);
      }
    };
    fetchRoles();
  }, []);

  // Determine breadcrumb tail based on current path
  const tail = location.endsWith("/global") ? "Global" : location.endsWith("/alerts") ? "Alerts" : "Settings";
  const currentTab = location.includes("/ops/settings/global") ? "global" : "alerts";
  const hasAlertAccess = userRoles.includes("ops_editor") || userRoles.includes("ops_admin");
  const hasGlobalAccess = userRoles.includes("ops_admin");

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Ops", href: "/ops/overview" },
          { label: "Settings", href: "/ops/settings" },
          { label: tail },
        ]}
        roles={userRoles}
      />

      <Tabs value={currentTab} className="w-full">
        <TabsList>
          {hasAlertAccess && (
            <Link href="/ops/settings/alerts">
              <TabsTrigger value="alerts" data-testid="tab-alerts">
                Alerts
              </TabsTrigger>
            </Link>
          )}
          {hasGlobalAccess && (
            <Link href="/ops/settings/global">
              <TabsTrigger value="global" data-testid="tab-global">
                Global
              </TabsTrigger>
            </Link>
          )}
        </TabsList>
      </Tabs>

      <Switch>
        <Route path="/ops/settings" component={SettingsIndexRedirect} />
        <Route path="/ops/settings/alerts">
          <RequireRole roles={["ops_editor", "ops_admin"]}>
            <SettingsAlerts />
          </RequireRole>
        </Route>
        <Route path="/ops/settings/global">
          <RequireRole roles={["ops_admin"]}>
            <SettingsGlobal />
          </RequireRole>
        </Route>
      </Switch>
    </div>
  );
}
