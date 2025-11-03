import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Trash2, ExternalLink, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { IdeaSpark } from '@shared/schema';

interface IdeaSparksListProps {
  projectId?: number;
  showAll?: boolean;
  limit?: number;
}

export function IdeaSparksList({ projectId, showAll = false, limit }: IdeaSparksListProps) {
  const { toast } = useToast();

  // Build query params
  const queryParams = new URLSearchParams();
  if (projectId) queryParams.append('projectId', projectId.toString());

  const queryString = queryParams.toString();
  const queryKey = queryString 
    ? ['/api/idea-sparks', queryString]
    : ['/api/idea-sparks'];

  const { data: allSparks = [], isLoading } = useQuery<IdeaSpark[]>({
    queryKey,
  });

  // Apply limit if specified
  const sparks = limit ? allSparks.slice(0, limit) : allSparks;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/idea-sparks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/idea-sparks'] });
      toast({
        title: 'Idea deleted',
        description: 'The idea spark has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete idea spark',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sparks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No idea sparks yet</p>
          <p className="text-sm mt-1">Click the lightbulb button to capture an idea!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="idea-sparks-list">
      {sparks.map((spark) => (
        <Card key={spark.id} className="hover-elevate" data-testid={`idea-spark-${spark.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  {spark.title}
                </CardTitle>
                {spark.content && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {spark.content}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(spark.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-spark-${spark.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {spark.pod && (
                <Badge variant="outline" data-testid={`spark-pod-${spark.id}`}>
                  {spark.pod}
                </Badge>
              )}
              {spark.fileUrl && (
                <a
                  href={spark.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                  data-testid={`spark-file-${spark.id}`}
                >
                  <FileImage className="h-3 w-3" />
                  View attachment
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span className="ml-auto">
                {format(new Date(spark.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
