import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listWorkOrderFiles } from '@/lib/workOrderFiles';

type WOFile = {
  file_id: string;
  work_item_id: number;
  name: string;
  mime: string;
  size_bytes: number;
  storage_uri: string;
  created_at: string;
};

export function WorkOrderAggregatedFiles({ woId }: { woId: string }) {
  const [files, setFiles] = useState<WOFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const resp = await listWorkOrderFiles(woId);
        setFiles(resp.files || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [woId]);

  return (
    <Card className="shadow-sm" data-testid="card-wo-files">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle data-testid="text-wo-files-title">All Files for {woId}</CardTitle>
          <CardDescription data-testid="text-wo-files-description">Aggregated from all linked Work Items</CardDescription>
        </div>
        <Badge variant="secondary" data-testid="badge-file-count">{files.length} file{files.length===1?'':'s'}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground" data-testid="text-loading">Loading…</div>
        ) : files.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4" data-testid="text-no-files">No files yet for this work order.</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Size</th>
                  <th className="text-left p-3">Work Item</th>
                  <th className="text-left p-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.file_id} className="border-t" data-testid={`row-file-${f.file_id}`}>
                    <td className="p-3" data-testid={`text-filename-${f.file_id}`}>{f.name}</td>
                    <td className="p-3" data-testid={`text-mime-${f.file_id}`}>{f.mime}</td>
                    <td className="p-3" data-testid={`text-size-${f.file_id}`}>{(f.size_bytes/1024).toFixed(1)} KB</td>
                    <td className="p-3" data-testid={`text-workitem-${f.file_id}`}>#{f.work_item_id}</td>
                    <td className="p-3" data-testid={`text-created-${f.file_id}`}>{new Date(f.created_at).toLocaleString()}</td>
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
