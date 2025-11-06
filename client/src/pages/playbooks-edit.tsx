import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";

interface Playbook {
  id: number;
  handle: string;
  title: string;
  bodyMd: string;
  createdAt: string;
}

export default function PlaybooksEditPage() {
  const [, params] = useRoute("/playbooks/:handle");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handle = params?.handle === "new" ? null : params?.handle;
  const isNew = params?.handle === "new";

  const [formData, setFormData] = useState({
    handle: "",
    title: "",
    bodyMd: "### Steps\n\n1. \n2. \n3. \n"
  });
  const [isLoading, setIsLoading] = useState(false);

  const { data: playbook, isLoading: isLoadingPlaybook } = useQuery<Playbook>({
    queryKey: [`/api/playbooks/${handle}`],
    enabled: !!handle,
  });

  useEffect(() => {
    if (playbook && !isNew) {
      setFormData({
        handle: playbook.handle,
        title: playbook.title,
        bodyMd: playbook.bodyMd
      });
    }
  }, [playbook, isNew]);

  async function savePlaybook() {
    if (!formData.handle || !formData.title || !formData.bodyMd) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest("/api/playbooks", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      if (!result.ok) {
        const error = await result.json();
        throw new Error(error.error || "Failed to save playbook");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      
      toast({
        title: isNew ? "Playbook Created" : "Playbook Updated",
        description: `${formData.title} has been saved successfully.`
      });

      if (isNew) {
        setLocation(`/playbooks/${formData.handle}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save playbook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingPlaybook && !isNew) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/playbooks")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playbooks
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-form-title">
            {isNew ? "Create New Playbook" : "Edit Playbook"}
          </CardTitle>
          <CardDescription>
            {isNew ? "Define a new playbook for Work Orders" : "Update playbook details and content"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="handle">Handle *</Label>
            <Input
              id="handle"
              data-testid="input-handle"
              placeholder="e.g., support_router_v1"
              value={formData.handle}
              onChange={e => setFormData({ ...formData, handle: e.target.value })}
              disabled={!isNew}
            />
            <p className="text-sm text-muted-foreground">
              Alphanumeric, underscores, and hyphens only. Cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              data-testid="input-title"
              placeholder="Enter playbook title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyMd">Playbook Content (Markdown) *</Label>
            <Textarea
              id="bodyMd"
              data-testid="input-body"
              placeholder="### Steps&#10;&#10;1. First step&#10;2. Second step&#10;3. Third step"
              value={formData.bodyMd}
              onChange={e => setFormData({ ...formData, bodyMd: e.target.value })}
              rows={16}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Use Markdown formatting. This will be rendered when viewing the playbook.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation("/playbooks")}
            disabled={isLoading}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={savePlaybook}
            disabled={isLoading || !formData.handle || !formData.title || !formData.bodyMd}
            data-testid="button-save"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Playbook"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
