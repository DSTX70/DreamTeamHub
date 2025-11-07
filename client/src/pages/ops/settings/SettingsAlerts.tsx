import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type AlertSettings = {
  slackWebhookUrl: string;
  emailEnabled: boolean;
  emailFrom: string;
  emailTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
};

export default function SettingsAlerts() {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const r = await fetch("/api/ops/settings/alerts");
      const j = await r.json();
      setSettings(j.settings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load alert settings",
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
      await fetch("/api/ops/settings/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast({
        title: "Saved",
        description: "Alert settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save alert settings",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const testWebhook = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/ops/settings/alerts/test-webhook", { method: "POST" });
      if (r.ok) {
        toast({
          title: "Success",
          description: "Test webhook sent successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send test webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test webhook",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const testEmail = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/ops/settings/alerts/test-email", { method: "POST" });
      if (r.ok) {
        toast({
          title: "Success",
          description: "Test email sent successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
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
          <CardTitle>Slack / Webhook</CardTitle>
          <CardDescription>Configure webhook notifications for alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              value={settings.slackWebhookUrl}
              onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
              data-testid="input-webhook-url"
            />
          </div>
          <Button
            variant="outline"
            onClick={testWebhook}
            disabled={busy}
            data-testid="button-test-webhook"
          >
            Test Webhook
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Configure SMTP settings for email alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled">Enable Email Alerts</Label>
            <Switch
              id="email-enabled"
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
              data-testid="switch-email-enabled"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-from">From Address</Label>
              <Input
                id="email-from"
                value={settings.emailFrom}
                onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                placeholder="alerts@example.com"
                data-testid="input-email-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-to">To Address</Label>
              <Input
                id="email-to"
                value={settings.emailTo}
                onChange={(e) => setSettings({ ...settings, emailTo: e.target.value })}
                placeholder="ops@example.com"
                data-testid="input-email-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                data-testid="input-smtp-host"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                placeholder="587"
                data-testid="input-smtp-port"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input
                id="smtp-user"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="username"
                data-testid="input-smtp-user"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-pass">SMTP Password</Label>
              <Input
                id="smtp-pass"
                type="password"
                value={settings.smtpPass}
                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                placeholder="••••••••"
                data-testid="input-smtp-pass"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={testEmail}
            disabled={busy || !settings.emailEnabled}
            data-testid="button-test-email"
          >
            Test Email
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={busy} data-testid="button-save-alerts">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
