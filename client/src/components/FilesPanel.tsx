import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkItemFile {
  id: number;
  workItemId: number;
  filename: string;
  s3Key: string;
  s3Url: string;
  sizeBytes: number;
  mimeType: string | null;
  uploadedByUserId: string;
  uploadedAt: Date;
}

interface UploaderConfig {
  allowlist: string[];
  maxSizeMB: number;
}

interface FilesPanelProps {
  workItemId: number;
}

export function FilesPanel({ workItemId }: FilesPanelProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: config } = useQuery<UploaderConfig>({
    queryKey: ['/api/ops/uploader/config'],
  });

  const { data: filesData, isLoading } = useQuery<{ ok: boolean; files: WorkItemFile[] }>({
    queryKey: ['/api/work-items', workItemId, 'files'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/work-items/${workItemId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items', workItemId, 'files'] });
      setSelectedFile(null);
      toast({
        title: 'File uploaded',
        description: 'Your file has been attached successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !config.allowlist.includes(extension)) {
      toast({
        title: 'Invalid file type',
        description: `Only ${config.allowlist.join(', ')} files are allowed`,
        variant: 'destructive',
      });
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > config.maxSizeMB) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${config.maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const files = filesData?.files || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Attachments</h3>
        <span className="text-xs text-muted-foreground">({files.length})</span>
      </div>

      {config && (
        <Alert data-testid="alert-upload-info">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Allowed: {config.allowlist.join(', ')} • Max size: {config.maxSizeMB}MB
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
            className="flex-1"
            data-testid="input-file-upload"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            size="sm"
            data-testid="button-upload-file"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>

        {selectedFile && (
          <p className="text-xs text-muted-foreground" data-testid="text-selected-file">
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground" data-testid="text-loading-files">
          Loading files...
        </div>
      )}

      {!isLoading && files.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-files">
          No attachments yet
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="p-3" data-testid={`card-file-${file.id}`}>
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <a
                    href={file.s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline block truncate"
                    data-testid={`link-file-${file.id}`}
                  >
                    {file.filename}
                  </a>
                  <p className="text-xs text-muted-foreground" data-testid={`text-file-meta-${file.id}`}>
                    {formatFileSize(file.sizeBytes)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
