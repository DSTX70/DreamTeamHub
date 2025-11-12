
import * as React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getConfig, saveConfig } from '@/client/lib/uploader/api';
import { useToast } from '@/client/lib/hooks/useToast';

type Backend = 'local'|'drive'|'s3'|'env';

export function UploaderSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [devRoleHeader, setDevRoleHeader] = React.useState(true);
  const [backend, setBackend] = React.useState<Backend>('env');
  const [maxFileMb, setMaxFileMb] = React.useState<number>(100);
  const [allowedTypes, setAllowedTypes] = React.useState<string>('image/png,image/jpeg,application/pdf,text/csv');
  const [pageSize, setPageSize] = React.useState<number>(50);
  const [envLocked, setEnvLocked] = React.useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        const cfg = await getConfig();
        setBackend((cfg.backend as Backend) || 'env');
        setMaxFileMb(cfg.max_file_mb ?? 100);
        setAllowedTypes((cfg.allowed_types ?? ['image/png','image/jpeg','application/pdf','text/csv']).join(','));
        setPageSize(cfg.list_page_size ?? 50);
        setEnvLocked(!!cfg.env_locked || cfg.backend === 'env');
      } catch (e:any) {
        toast({ title:'Failed to load', description: e?.message || 'Could not load uploader config' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        backend, 
        max_file_mb: maxFileMb,
        allowed_types: allowedTypes.split(',').map(s => s.trim()).filter(Boolean),
        list_page_size: pageSize
      };
      await saveConfig(body, { devRoleHeader });
      toast({ title:'Saved', description:'Uploader settings updated.' });
    } catch (e:any) {
      toast({ title:'Save failed', description: e?.message || 'Could not save config' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading uploader settings…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Uploader Settings</CardTitle>
            <CardDescription>Hybrid DB+Env — env for secrets, DB for safe toggles.</CardDescription>
          </div>
          <div className="space-x-2">
            <Badge variant="secondary">Civility Mode</Badge>
            <Badge variant="secondary">Balanced perspectives</Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Autonomy notice</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Backend</Label>
              <Select value={backend} onValueChange={(v:any)=>setBackend(v)}>
                <SelectTrigger><SelectValue placeholder="Select backend" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="env">Env-locked</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="drive">Google Drive</SelectItem>
                  <SelectItem value="s3">Amazon S3</SelectItem>
                </SelectContent>
              </Select>
              {envLocked && (
                <p className="text-xs text-amber-600">Backend is env-locked by server configuration.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Max file size (MB)</Label>
              <Input type="number" min={1} value={maxFileMb} onChange={e=>setMaxFileMb(parseInt(e.target.value||'0',10))} />
              <p className="text-xs text-muted-foreground">Large sizes may impact UX and storage costs.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Allowed MIME types (comma-separated)</Label>
              <Input value={allowedTypes} onChange={e=>setAllowedTypes(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>List page size</Label>
              <Input type="number" min={5} value={pageSize} onChange={e=>setPageSize(parseInt(e.target.value||'0',10))} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Switch checked={devRoleHeader} onCheckedChange={setDevRoleHeader} />
                Dev header: <code className="text-xs">x-role: ops_admin</code>
              </Label>
              <p className="text-xs text-muted-foreground">Enable for local testing; prod should use real auth.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Secrets (keys/buckets) remain in environment variables.
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default UploaderSettings;
