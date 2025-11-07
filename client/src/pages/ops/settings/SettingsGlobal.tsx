import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type GlobalSettings = {
  hotkeysEnabled: boolean;
};

export default function SettingsGlobal() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const r = await fetch("/api/ops/settings/global");
      const j = await r.json();
      setSettings(j.settings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load global settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      await fetch("/api/ops/settings/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast({
        title: "Saved",
        description: "Global settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save global settings",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Controls</CardTitle>
          <CardDescription>System-wide settings accessible only to administrators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hotkeys-enabled">Enable Keyboard Shortcuts</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to navigate with keyboard shortcuts (g+o, g+i, etc.)
              </p>
            </div>
            <Switch
              id="hotkeys-enabled"
              checked={settings.hotkeysEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, hotkeysEnabled: checked })}
              data-testid="switch-hotkeys-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={busy} data-testid="button-save-global">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
