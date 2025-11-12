import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, Lock, FileType, HardDrive, Eye, Save } from 'lucide-react';

interface EffectiveUploads {
  enabled: boolean;
  allowlist: string;
  maxSizeMB: number;
  visibleTo: 'owner' | 'pod' | 'approvers' | 'org';
}

interface Locked {
  backend: boolean;
}

interface UploaderConfig {
  backend: 'local' | 'drive' | 's3';
  effective: EffectiveUploads;
  locked: Locked;
}

export default function UploaderAdmin() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EffectiveUploads | null>(null);

  const { data, isLoading } = useQuery<UploaderConfig>({
    queryKey: ['/api/ops/uploader/config'],
    onSuccess: (data) => {
      setConfig(data.effective);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EffectiveUploads>) => {
      return await apiRequest('/api/ops/uploader/config', 'POST', updates);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ops/uploader/config'] });
      if (response.effective) {
        setConfig(response.effective);
      }
      toast({
        title: 'Settings saved',
        description: 'Uploader configuration has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save',
        description: error.message || 'Failed to update configuration',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!config) return;

    updateMutation.mutate({
      enabled: config.enabled,
      allowlist: config.allowlist,
      maxSizeMB: config.maxSizeMB,
      visibleTo: config.visibleTo,
    });
  };

  const handleAllowlistChange = (value: string) => {
    if (!config) return;
    setConfig({ ...config, allowlist: value });
  };

  const handleMaxSizeChange = (value: string) => {
    if (!config) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 200) {
      setConfig({ ...config, maxSizeMB: num });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  if (!data || !config) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load configuration</AlertDescription>
        </Alert>
      </div>
    );
  }

  const allowlistArray = config.allowlist.split(',').filter(Boolean);
  const hasChanges = JSON.stringify(config) !== JSON.stringify(data.effective);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">File Uploader Administration</h1>
            <p className="text-muted-foreground">Manage runtime file upload settings</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          data-testid="button-save-config"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Alert data-testid="alert-admin-info">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You have ops_admin privileges. Runtime settings are stored in the database with full audit trail.
          Locked settings (backend) require environment variable changes.
        </AlertDescription>
      </Alert>

      {hasChanges && (
        <Alert data-testid="alert-unsaved-changes">
          <AlertDescription>
            <strong>Unsaved changes:</strong> Remember to save your changes before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-backend">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Storage Backend</CardTitle>
              </div>
              {data.locked.backend && (
                <Badge variant="outline" data-testid="badge-locked">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <CardDescription>
              Provider for file storage (environment-locked)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                value={data.backend}
                readOnly
                disabled
                data-testid="input-backend"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Change via UPLOADS_BACKEND environment variable
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-enabled">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileType className="h-5 w-5 text-primary" />
              <CardTitle>Upload Status</CardTitle>
            </div>
            <CardDescription>
              Enable or disable file uploads globally
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                data-testid="switch-enabled"
              />
              <Label htmlFor="enabled" className="cursor-pointer">
                {config.enabled ? 'Uploads enabled' : 'Uploads disabled'}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-allowlist">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileType className="h-5 w-5 text-primary" />
            <CardTitle>Allowed File Types</CardTitle>
          </div>
          <CardDescription>
            File extensions permitted for upload (comma-separated)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allowlist">Allowlist</Label>
            <Input
              id="allowlist"
              value={config.allowlist}
              onChange={(e) => handleAllowlistChange(e.target.value)}
              placeholder="json,csv,zip,webp,png,svg,txt,md"
              data-testid="input-allowlist"
            />
            <p className="text-xs text-muted-foreground">
              Enter file extensions separated by commas (no dots or spaces)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowlistArray.map((ext) => (
              <Badge key={ext} variant="secondary" data-testid={`badge-ext-${ext}`}>
                .{ext}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {allowlistArray.length} file types
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-max-size">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <CardTitle>Maximum File Size</CardTitle>
            </div>
            <CardDescription>
              Maximum upload size per file (1-200 MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxSize">Size in MB</Label>
              <Input
                id="maxSize"
                type="number"
                min={1}
                max={200}
                value={config.maxSizeMB}
                onChange={(e) => handleMaxSizeChange(e.target.value)}
                data-testid="input-max-size"
              />
            </div>
            <div className="text-2xl font-bold" data-testid="text-max-size-display">
              {config.maxSizeMB}
              <span className="text-sm text-muted-foreground ml-2">MB</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({(config.maxSizeMB * 1024).toFixed(0)} KB)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-visibility">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>File Visibility</CardTitle>
            </div>
            <CardDescription>
              Who can view uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visibleTo">Visible to</Label>
              <Select
                value={config.visibleTo}
                onValueChange={(value) => setConfig({ ...config, visibleTo: value as any })}
              >
                <SelectTrigger id="visibleTo" data-testid="select-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner" data-testid="option-owner">Owner only</SelectItem>
                  <SelectItem value="pod" data-testid="option-pod">Pod members</SelectItem>
                  <SelectItem value="approvers" data-testid="option-approvers">Approvers</SelectItem>
                  <SelectItem value="org" data-testid="option-org">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Current setting: <strong>{config.visibleTo}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-audit-info">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            All configuration changes are automatically logged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Changes to uploader settings are recorded in <code className="bg-muted px-1 py-0.5 rounded">ops_settings_audit</code> table
            with user ID, timestamp, and before/after values for compliance and troubleshooting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
