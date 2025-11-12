import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, FileType, HardDrive } from 'lucide-react';

interface UploaderConfig {
  allowlist: string[];
  maxSizeMB: number;
}

export default function UploaderSettings() {
  const { data: config, isLoading } = useQuery<UploaderConfig>({
    queryKey: ['/api/ops/uploader/config'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">File Uploader Configuration</h1>
          <p className="text-muted-foreground">Manage file upload settings for Work Items</p>
        </div>
      </div>

      <Alert data-testid="alert-admin-info">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          These settings are configured via environment variables. Contact your system administrator to modify them.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-file-types">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileType className="h-5 w-5 text-primary" />
              <CardTitle>Allowed File Types</CardTitle>
            </div>
            <CardDescription>
              File extensions permitted for upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {config?.allowlist.map((ext) => (
                <Badge key={ext} variant="secondary" data-testid={`badge-ext-${ext}`}>
                  .{ext}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Total: {config?.allowlist.length || 0} file types
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-size-limit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <CardTitle>Maximum File Size</CardTitle>
            </div>
            <CardDescription>
              Maximum upload size per file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="text-max-size">
              {config?.maxSizeMB || 0}
              <span className="text-xl text-muted-foreground ml-2">MB</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {((config?.maxSizeMB || 0) * 1024).toFixed(0)} KB
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-environment-config">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Configuration is managed through these environment variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-sm bg-muted px-2 py-1 rounded">UPLOADER_ALLOWLIST</code>
              <span className="text-sm text-muted-foreground">Comma-separated file extensions</span>
            </div>
            <p className="text-xs text-muted-foreground pl-2">
              Example: pdf,doc,docx,xls,xlsx,png,jpg
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-sm bg-muted px-2 py-1 rounded">UPLOADER_MAX_MB</code>
              <span className="text-sm text-muted-foreground">Maximum file size in megabytes</span>
            </div>
            <p className="text-xs text-muted-foreground pl-2">
              Example: 25
            </p>
          </div>

          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Changes to these environment variables require a server restart to take effect.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
