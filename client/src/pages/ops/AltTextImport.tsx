import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface WorkItem {
  id: number;
  title: string;
  description?: string;
  status: string;
}

interface WorkItemFile {
  id: number;
  workItemId: number;
  filename: string;
  s3Key: string;
  s3Url: string;
  uploadedAt: string;
}

interface ImportResult {
  ok: boolean;
  imported?: number;
  errors?: Array<{ line: number; error: string }>;
  filename?: string;
  workItemId?: number;
  error?: string;
}

export default function AltTextImport() {
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: workItems, isLoading: loadingWorkItems } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items'],
  });

  const { data: filesResponse, isLoading: loadingFiles } = useQuery<{ ok: boolean; files: WorkItemFile[] }>({
    queryKey: ['/api/work-items', selectedWorkItemId, 'files'],
    enabled: !!selectedWorkItemId,
  });

  const files = filesResponse?.files || [];

  const importMutation = useMutation({
    mutationFn: async ({ workItemId, filename }: { workItemId: number; filename?: string }) => {
      console.log('[AltTextImport] Starting import:', { workItemId, filename });
      const response = await apiRequest('POST', '/api/seo/alt-text/import', { 
        work_item_id: workItemId, 
        filename 
      });
      const result = await response.json();
      console.log('[AltTextImport] Import result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[AltTextImport] Import successful:', data);
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/seo/alt-text/list'] });
    },
    onError: (error) => {
      console.error('[AltTextImport] Import failed:', error);
      setImportResult({
        ok: false,
        error: error instanceof Error ? error.message : 'Import failed'
      });
    },
  });

  const handleImport = () => {
    if (!selectedWorkItemId) return;
    
    const selectedFile = files.find(f => f.id === selectedFileId);
    importMutation.mutate({ 
      workItemId: selectedWorkItemId,
      filename: selectedFile?.filename 
    });
  };

  const csvFiles = files.filter(f => f.filename.toLowerCase().endsWith('.csv'));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-alt-text-import">Alt Text Import</h1>
          <p className="text-muted-foreground">Import SEO alt text from CSV files attached to Work Items</p>
        </div>
      </div>

      <Alert data-testid="alert-csv-format">
        <Download className="h-4 w-4" />
        <AlertDescription>
          <strong>CSV Format:</strong> Your CSV should have columns: <code>image_key</code>, <code>alt_text</code>, and optionally <code>context</code>, <code>locale</code>, <code>reviewed_by</code>, <code>reviewed_at</code>
        </AlertDescription>
      </Alert>

      <Card data-testid="card-import-wizard">
        <CardHeader>
          <CardTitle>Import Wizard</CardTitle>
          <CardDescription>Select a work item and CSV file to import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="work-item-select">Work Item</Label>
            <Select
              value={selectedWorkItemId?.toString() || ''}
              onValueChange={(value) => {
                setSelectedWorkItemId(parseInt(value));
                setSelectedFileId(null);
                setImportResult(null);
              }}
            >
              <SelectTrigger id="work-item-select" data-testid="select-work-item">
                <SelectValue placeholder="Select a work item..." />
              </SelectTrigger>
              <SelectContent>
                {loadingWorkItems ? (
                  <SelectItem value="loading" disabled>Loading work items...</SelectItem>
                ) : (
                  workItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()} data-testid={`option-work-item-${item.id}`}>
                      #{item.id} - {item.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkItemId && (
            <div className="space-y-2">
              <Label htmlFor="file-select">CSV File</Label>
              {loadingFiles ? (
                <div className="text-sm text-muted-foreground">Loading files...</div>
              ) : csvFiles.length === 0 ? (
                <Alert data-testid="alert-no-csv-files">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No CSV files found for this work item. Please upload a CSV file to the work item first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedFileId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedFileId(parseInt(value));
                    setImportResult(null);
                  }}
                >
                  <SelectTrigger id="file-select" data-testid="select-csv-file">
                    <SelectValue placeholder="Select a CSV file..." />
                  </SelectTrigger>
                  <SelectContent>
                    {csvFiles.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()} data-testid={`option-file-${file.id}`}>
                        {file.filename} ({new Date(file.uploadedAt).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedWorkItemId && csvFiles.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={!selectedFileId || importMutation.isPending}
              data-testid="button-import"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending ? 'Importing...' : 'Import Alt Text'}
            </Button>
          )}
        </CardContent>
      </Card>

      {importResult && (
        <Card data-testid="card-import-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.ok ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Import Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.ok ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Imported:</span>
                  <Badge variant="secondary" data-testid="badge-imported-count">
                    {importResult.imported} rows
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">File:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{importResult.filename}</code>
                </div>
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <Alert data-testid="alert-import-errors">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{importResult.errors.length} rows had errors:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx} className="text-xs">
                            Line {err.line}: {err.error}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-xs text-muted-foreground">
                            ...and {importResult.errors.length - 5} more
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="destructive" data-testid="alert-import-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importResult.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-instructions">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Prepare a CSV file with columns: <code>image_key</code>, <code>alt_text</code>, and optionally <code>context</code>, <code>locale</code></li>
            <li>Upload the CSV file to a Work Item (use the file attachment feature)</li>
            <li>Select the Work Item from the dropdown above</li>
            <li>Select the CSV file you just uploaded</li>
            <li>Click "Import Alt Text" to process the CSV</li>
          </ol>
          
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Duplicate entries (same image_key + locale) will be updated with the new alt text from the CSV.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
