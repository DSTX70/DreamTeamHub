import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb } from 'lucide-react';
import type { IdeaSpark, Pod, Project } from '@shared/schema';

interface IdeaSparkEditDialogProps {
  spark: IdeaSpark;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdeaSparkEditDialog({ spark, isOpen, onOpenChange }: IdeaSparkEditDialogProps) {
  const [title, setTitle] = useState(spark.title);
  const [content, setContent] = useState(spark.content || '');
  const [pod, setPod] = useState<string>(spark.pod || 'none');
  const [projectId, setProjectId] = useState<string>(spark.projectId?.toString() || 'none');
  const [fileUrl, setFileUrl] = useState(spark.fileUrl || '');
  const { toast } = useToast();

  // Reset form when spark changes
  useEffect(() => {
    setTitle(spark.title);
    setContent(spark.content || '');
    setPod(spark.pod || 'none');
    setProjectId(spark.projectId?.toString() || 'none');
    setFileUrl(spark.fileUrl || '');
  }, [spark]);

  // Fetch pods for selection
  const { data: pods = [] } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  // Fetch projects for selection
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const updateSparkMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/idea-sparks/${spark.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/idea-sparks');
        }
      });
      toast({
        title: 'Idea Spark updated!',
        description: 'Your changes have been saved successfully.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update idea spark',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your idea',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      title,
      content: content || null,
      pod: (pod && pod !== 'none') ? pod : null,
      projectId: (projectId && projectId !== 'none') ? parseInt(projectId) : null,
      fileUrl: fileUrl || null,
    };

    updateSparkMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-edit-idea-spark">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Edit Idea Spark
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for your idea..."
              required
              data-testid="input-edit-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Description</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Expand on your idea..."
              rows={4}
              data-testid="textarea-edit-content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pod">Pod Assignment</Label>
              <Select value={pod} onValueChange={setPod}>
                <SelectTrigger id="edit-pod" data-testid="select-edit-pod">
                  <SelectValue placeholder="Select pod..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / Unassigned</SelectItem>
                  {pods.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project">Link to Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="edit-project" data-testid="select-edit-project">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-fileUrl">File URL (optional)</Label>
            <Input
              id="edit-fileUrl"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/file.pdf"
              data-testid="input-edit-fileurl"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateSparkMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateSparkMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
