
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listWorkOrderFiles } from '@/client/lib/uploader/api';

type WOFile = {
  file_id: string;
  work_item_id: number;
  name: string;
  mime: string;
  size_bytes: number;
  visible_to: 'owner'|'pod'|'approvers'|'org';
  storage_uri: string;
  created_at: string;
};

export function WorkOrderAggregatedFiles({ woId }: { woId: string }) {
  const [files, setFiles] = React.useState<WOFile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const resp = await listWorkOrderFiles(woId);
        setFiles(resp.files || []);
      } catch (e) {
        // swallow in UI; production can surface toast
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [woId]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>All Files for {woId}</CardTitle>
          <CardDescription>Aggregated from all linked Work Items</CardDescription>
        </div>
        <Badge variant="secondary">{files.length} file{files.length===1?'':'s'}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : files.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4">No files yet for this work order.</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Size</th>
                  <th className="text-left p-3">Visibility</th>
                  <th className="text-left p-3">Work Item</th>
                  <th className="text-left p-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.file_id} className="border-t">
                    <td className="p-3">{f.name}</td>
                    <td className="p-3">{f.mime}</td>
                    <td className="p-3">{(f.size_bytes/1024).toFixed(1)} KB</td>
                    <td className="p-3"><Badge variant="outline">{f.visible_to}</Badge></td>
                    <td className="p-3">#{f.work_item_id}</td>
                    <td className="p-3">{new Date(f.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WorkOrderAggregatedFiles;
