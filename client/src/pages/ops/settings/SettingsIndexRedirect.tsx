import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsIndexRedirect() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState<"admin" | "editor" | "none">("none");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ops/_auth/ping");
        if (!res.ok) {
          setChecked(true);
          setAllowed("none");
          return;
        }
        
        const json = await res.json();
        const roles: string[] = Array.isArray(json?.who?.roles) ? json.who.roles : [];
        
        if (roles.includes("ops_admin")) {
          setAllowed("admin");
          setLocation("/ops/settings/global", { replace: true });
          return;
        }
        
        if (roles.includes("ops_editor")) {
          setAllowed("editor");
          setLocation("/ops/settings/alerts", { replace: true });
          return;
        }
        
        setAllowed("none");
      } catch {
        setAllowed("none");
      } finally {
        setChecked(true);
      }
    })();
  }, [setLocation]);

  if (!checked) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Checking permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allowed === "none") {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive font-medium">
              You do not have access to Ops Settings.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Contact an administrator to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
