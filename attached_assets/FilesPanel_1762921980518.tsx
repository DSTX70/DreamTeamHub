
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { listFiles, uploadFile, type WorkFile } from '@/client/lib/uploader/api';
import { useToast } from '@/client/lib/hooks/useToast';

export function FilesPanel({ workItemId }: { workItemId: string }) {
  const { toast } = useToast();
  const [files, setFiles] = React.useState<WorkFile[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [visibleTo, setVisibleTo] = React.useState<'owner'|'pod'|'approvers'|'org'>('org');
  const [file, setFile] = React.useState<File | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const data = await listFiles(workItemId);
      setFiles(data || []);
    } catch (e:any) {
      toast({ title:'Failed to load files', description:e?.message || 'Try again later' });
    }
  }, [workItemId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const onUpload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await uploadFile(workItemId, file, visibleTo);
      setFile(null);
      (document.getElementById('file-input') as HTMLInputElement | null)?.value && ((document.getElementById('file-input') as HTMLInputElement).value = '');
      await refresh();
      toast({ title:'Uploaded', description:`${file.name} attached to ${workItemId}` });
    } catch (e:any) {
      toast({ title:'Upload failed', description:e?.message || 'Could not upload file' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Files</CardTitle>
          <CardDescription>Attach brand artifacts to this Work Item.</CardDescription>
        </div>
        <div className="space-x-2">
          <Badge variant="secondary">WO: {workItemId}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="file-input">Select file</Label>
            <Input id="file-input" type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="md:col-span-1 space-y-2">
            <Label>Visibility</Label>
            <Select value={visibleTo} onValueChange={(v:any)=>setVisibleTo(v)}>
              <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="pod">Pod</SelectItem>
                <SelectItem value="approvers">Approvers</SelectItem>
                <SelectItem value="org">Org</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Button className="w-full" onClick={onUpload} disabled={busy || !file}>
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Size</th>
                <th className="text-left p-3">Visibility</th>
                <th className="text-left p-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="p-3">{f.name}</td>
                  <td className="p-3">{f.mime}</td>
                  <td className="p-3">{(f.size_bytes/1024).toFixed(1)} KB</td>
                  <td className="p-3">
                    <Badge variant="outline">{f.visible_to}</Badge>
                  </td>
                  <td className="p-3">{new Date(f.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={5}>No files yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilesPanel;
