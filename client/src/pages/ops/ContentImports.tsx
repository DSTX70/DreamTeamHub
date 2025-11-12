import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ImportResult {
  ok: boolean;
  imported?: number;
  total?: number;
  errors?: Array<{ row: number; error: string }>;
  error?: string;
}

export default function ContentImports() {
  const [workItemId, setWorkItemId] = useState('7');
  const [seoResult, setSeoResult] = useState<ImportResult | null>(null);
  const [altResult, setAltResult] = useState<ImportResult | null>(null);

  const seoImportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/seo/meta/import', {
        work_item_id: Number(workItemId),
        filename: 'seo_meta.csv'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSeoResult(data);
    },
    onError: (error) => {
      setSeoResult({
        ok: false,
        error: error instanceof Error ? error.message : 'Import failed'
      });
    },
  });

  const altImportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/seo/alt-text/import', {
        work_item_id: Number(workItemId),
        filename: 'alt_text.csv'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAltResult(data);
    },
    onError: (error) => {
      setAltResult({
        ok: false,
        error: error instanceof Error ? error.message : 'Import failed'
      });
    },
  });

  const handleSeoImport = () => {
    setSeoResult(null);
    seoImportMutation.mutate();
  };

  const handleAltImport = () => {
    setAltResult(null);
    altImportMutation.mutate();
  };

  const busy = seoImportMutation.isPending || altImportMutation.isPending;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-content-imports">Content Imports</h1>
          <p className="text-muted-foreground">Import SEO metadata and alt text from CSV files</p>
        </div>
      </div>

      <Alert data-testid="alert-info">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Upload your CSV files to a Work Item, then use this page to import them into the database.
          Default Work Item: <strong>#7 (Assets Hub)</strong>
        </AlertDescription>
      </Alert>

      <Card data-testid="card-work-item-selector">
        <CardHeader>
          <CardTitle>Work Item Configuration</CardTitle>
          <CardDescription>Select the Work Item containing your CSV files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="work-item-id" className="text-sm whitespace-nowrap">Work Item ID</Label>
            <Input
              id="work-item-id"
              type="number"
              value={workItemId}
              onChange={(e) => setWorkItemId(e.target.value)}
              className="w-32"
              data-testid="input-work-item-id"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="card-seo-import">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              SEO Metadata
            </CardTitle>
            <CardDescription>Import from seo_meta.csv</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Required columns:</strong> route, section_key, title, description
                <br />
                <strong>Optional:</strong> og_image, keywords, locale
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSeoImport}
              disabled={busy}
              className="w-full"
              data-testid="button-import-seo"
            >
              <Upload className="h-4 w-4 mr-2" />
              {seoImportMutation.isPending ? 'Importing...' : 'Import SEO Meta'}
            </Button>

            {seoResult && (
              <Alert variant={seoResult.ok ? 'default' : 'destructive'} data-testid="alert-seo-result">
                {seoResult.ok ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {seoResult.ok ? (
                    <div className="space-y-1">
                      <p className="font-medium">✓ Import successful</p>
                      <p className="text-sm">Imported {seoResult.imported} of {seoResult.total} entries</p>
                      {seoResult.errors && seoResult.errors.length > 0 && (
                        <details className="text-xs mt-2">
                          <summary className="cursor-pointer">View {seoResult.errors.length} errors</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(seoResult.errors, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Import failed</p>
                      <p className="text-sm">{seoResult.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-alt-import">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Alt Text
            </CardTitle>
            <CardDescription>Import from alt_text.csv</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Required columns:</strong> image_key, alt_text
                <br />
                <strong>Optional:</strong> context, locale, reviewed_by, reviewed_at
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleAltImport}
              disabled={busy}
              className="w-full"
              data-testid="button-import-alt"
            >
              <Upload className="h-4 w-4 mr-2" />
              {altImportMutation.isPending ? 'Importing...' : 'Import Alt Text'}
            </Button>

            {altResult && (
              <Alert variant={altResult.ok ? 'default' : 'destructive'} data-testid="alert-alt-result">
                {altResult.ok ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {altResult.ok ? (
                    <div className="space-y-1">
                      <p className="font-medium">✓ Import successful</p>
                      <p className="text-sm">Imported {altResult.imported} of {altResult.total} entries</p>
                      {altResult.errors && altResult.errors.length > 0 && (
                        <details className="text-xs mt-2">
                          <summary className="cursor-pointer">View {altResult.errors.length} errors</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(altResult.errors, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Import failed</p>
                      <p className="text-sm">{altResult.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
