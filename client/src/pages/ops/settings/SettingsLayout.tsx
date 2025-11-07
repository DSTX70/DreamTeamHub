import { Link, Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RequireRole from "@/components/RequireRole";
import SettingsAlerts from "@/pages/ops/settings/SettingsAlerts";
import SettingsGlobal from "@/pages/ops/settings/SettingsGlobal";

export default function SettingsLayout() {
  const [location, setLocation] = useLocation();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const r = await fetch("/api/ops/_auth/ping");
        const j = await r.json();
        setUserRoles(j.roles || []);
      } catch {
        setUserRoles([]);
      }
    };
    fetchRoles();
  }, []);

  // Auto-redirect /ops/settings to appropriate sub-route
  useEffect(() => {
    if (location === "/ops/settings") {
      const isAdmin = userRoles.includes("ops_admin");
      const isEditor = userRoles.includes("ops_editor");
      
      if (isEditor || isAdmin) {
        setLocation("/ops/settings/alerts");
      } else if (isAdmin) {
        setLocation("/ops/settings/global");
      }
    }
  }, [location, userRoles, setLocation]);

  const currentTab = location.includes("/ops/settings/global") ? "global" : "alerts";
  const hasAlertAccess = userRoles.includes("ops_editor") || userRoles.includes("ops_admin");
  const hasGlobalAccess = userRoles.includes("ops_admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-settings-title">Ops Settings</h1>
        <p className="text-muted-foreground">Configure operational alerts and global controls</p>
      </div>

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
