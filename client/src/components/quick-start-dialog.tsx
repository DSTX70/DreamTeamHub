import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Pod, Person } from "@shared/schema";
import { Upload, X, ExternalLink, Plus } from "lucide-react";
import { format } from "date-fns";

type QuickStartAction = 'discussion' | 'brainstorm' | 'audit' | 'conversation' | 'previous' | 'chat' | null;

interface QuickStartDialogProps {
  action: QuickStartAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  directionPrompt: z.string().optional(),
  auditType: z.string().optional(),
  selectedPods: z.array(z.number()).default([]),
  selectedPersons: z.array(z.number()).default([]),
  knowledgeBaseLinks: z.array(z.string()).default([]),
});

const auditTypes = [
  { value: 'security_soc2', label: 'Security/SOC2', description: 'SOC2/ISO control spot-check, SBOM/license scan, incident readiness' },
  { value: 'ip_readiness', label: 'IP Readiness', description: 'Claims ↔ feature map, figure legibility @66%, IDS/ADS stubs' },
  { value: 'brand_lock', label: 'Brand-Lock', description: 'Palettes, typography, logo lockups, KDP/Shopify specs' },
  { value: 'finance_ops', label: 'Finance Ops', description: 'CAC/COGS snapshot, budget variance, approvals' },
];

type FormData = z.infer<typeof formSchema>;

export function QuickStartDialog({ action, open, onOpenChange }: QuickStartDialogProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [newLink, setNewLink] = useState("");

  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
    enabled: open,
  });

  const { data: persons } = useQuery<Person[]>({
    queryKey: ['/api/persons'],
    enabled: open,
  });

  const { data: previousItems } = useQuery({
    queryKey: ['/api/work-items'],
    enabled: open && action === 'previous',
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      purpose: "",
      directionPrompt: "",
      auditType: action === 'audit' ? 'security_soc2' : undefined,
      selectedPods: [],
      selectedPersons: [],
      knowledgeBaseLinks: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Combine uploaded files and knowledge base links into sourceLinks
      const sourceLinks = [
        ...data.knowledgeBaseLinks,
        ...uploadedFiles.map(f => `file:${f.name}`),
      ];

      // Map action to appropriate endpoint
      if (action === 'discussion' || action === 'chat' || action === 'conversation' || action === 'previous') {
        return apiRequest('POST', '/api/work-items', {
          title: data.title,
          description: `${data.purpose}\n\nDirection: ${data.directionPrompt || 'N/A'}\n\nType: ${action}`,
          podId: data.selectedPods[0] || null,
          ownerId: data.selectedPersons[0] || null,
          status: 'todo',
          priority: 'medium',
          dueDate: data.date || null,
          sourceLinks: sourceLinks.length > 0 ? sourceLinks : [],
        });
      } else if (action === 'brainstorm') {
        // Create brainstorm session
        const sessionResponse = await apiRequest('POST', '/api/brainstorm/sessions', {
          title: data.title,
          goal: data.purpose,
          template: data.directionPrompt,
          facilitatorId: data.selectedPersons[0] || null,
          status: 'planning',
        });
        
        const session = await sessionResponse.json();
        
        // Add participants for all selected persons
        if (data.selectedPersons.length > 0) {
          await Promise.all(
            data.selectedPersons.map((personId) =>
              apiRequest('POST', `/api/brainstorm/sessions/${session.id}/participants`, {
                sessionId: session.id,
                personId: personId,
                role: 'pro', // Default role, can be changed later
              })
            )
          );
        }
        
        return sessionResponse;
      } else if (action === 'audit') {
        // Get pod names for selected pod IDs
        const selectedPodNames = pods
          ?.filter(p => data.selectedPods.includes(p.id))
          .map(p => p.name) || [];
        
        return apiRequest('POST', '/api/audits', {
          title: data.title,
          type: data.auditType || 'security_soc2',
          facilitatorId: data.selectedPersons[0] || null,
          pods: selectedPodNames,
          status: 'planning',
          dueAt: data.date || null,
        });
      }
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: `${getActionTitle(action)} created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/brainstorm/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/control/dashboard'] });
      form.reset();
      setUploadedFiles([]);
      onOpenChange(false);
      
      // Navigate to appropriate page
      if (action === 'brainstorm') {
        navigate('/brainstorm');
      } else if (action === 'audit') {
        navigate('/audits');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const addKnowledgeBaseLink = () => {
    if (newLink) {
      const currentLinks = form.getValues('knowledgeBaseLinks');
      form.setValue('knowledgeBaseLinks', [...currentLinks, newLink]);
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    const currentLinks = form.getValues('knowledgeBaseLinks');
    form.setValue('knowledgeBaseLinks', currentLinks.filter((_, i) => i !== index));
  };

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getActionTitle(action)}</DialogTitle>
          <DialogDescription>
            {getActionDescription(action)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Continue Previous - Special Selector */}
            {action === 'previous' && previousItems && (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Previous Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-previous-item">
                          <SelectValue placeholder="Choose an item to continue..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(previousItems as any[]).slice(0, 10).map((item: any) => (
                          <SelectItem key={item.id} value={item.title}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            {action !== 'previous' && (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter title..." 
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      data-testid="input-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose..."
                      rows={3}
                      {...field}
                      data-testid="input-purpose"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Direction Prompt */}
            <FormField
              control={form.control}
              name="directionPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction Prompt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide guidance or direction..."
                      rows={2}
                      {...field}
                      data-testid="input-direction"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional guidance for participants
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audit Type Selection - Only for audits */}
            {action === 'audit' && (
              <FormField
                control={form.control}
                name="auditType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-audit-type">
                          <SelectValue placeholder="Select audit type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auditTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* Pod Selection */}
            <FormField
              control={form.control}
              name="selectedPods"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Select Pods</FormLabel>
                    <FormDescription>
                      Choose which pods to involve
                    </FormDescription>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {pods?.map((pod) => (
                      <FormField
                        key={pod.id}
                        control={form.control}
                        name="selectedPods"
                        render={({ field }) => (
                          <FormItem
                            key={pod.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(pod.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, pod.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== pod.id)
                                      );
                                }}
                                data-testid={`checkbox-pod-${pod.id}`}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {pod.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Individual Team Members */}
            <FormField
              control={form.control}
              name="selectedPersons"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Select Team Members</FormLabel>
                    <FormDescription>
                      Add individual participants
                    </FormDescription>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                    {persons?.map((person) => (
                      <FormField
                        key={person.id}
                        control={form.control}
                        name="selectedPersons"
                        render={({ field }) => (
                          <FormItem
                            key={person.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(person.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, person.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== person.id)
                                      );
                                }}
                                data-testid={`checkbox-person-${person.id}`}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal flex-1">
                              <div className="font-medium">{person.handle}</div>
                              <div className="text-xs text-muted-foreground">{person.name}</div>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* File Upload */}
            <div>
              <FormLabel>Upload Files</FormLabel>
              <FormDescription className="mb-2">
                Attach images, documents, or other files
              </FormDescription>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  data-testid="button-upload-file"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <Card key={index}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <Badge variant="secondary" className="shrink-0">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          data-testid={`button-remove-file-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Knowledge Base Links */}
            <div>
              <FormLabel>Knowledge Base</FormLabel>
              <FormDescription className="mb-2">
                Link to canonical folders or knowledge bases
              </FormDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="https://drive.google.com/..."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKnowledgeBaseLink())}
                  data-testid="input-knowledge-base-link"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addKnowledgeBaseLink}
                  data-testid="button-add-link"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.watch('knowledgeBaseLinks').length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.watch('knowledgeBaseLinks').map((link, index) => (
                    <Card key={index}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate"
                          >
                            {link}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLink(index)}
                          data-testid={`button-remove-link-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-save"
              >
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getActionTitle(action: QuickStartAction): string {
  switch (action) {
    case 'discussion':
      return 'New Discussion';
    case 'brainstorm':
      return 'New Brainstorm Session';
    case 'audit':
      return 'Conduct an Audit';
    case 'conversation':
      return 'Start a Conversation';
    case 'previous':
      return 'Continue Previous';
    case 'chat':
      return 'Quick Chat';
    default:
      return '';
  }
}

function getActionDescription(action: QuickStartAction): string {
  switch (action) {
    case 'discussion':
      return 'Start a new discussion with your team members';
    case 'brainstorm':
      return 'Launch a collaborative brainstorming session';
    case 'audit':
      return 'Run a compliance checklist across pods';
    case 'conversation':
      return 'Begin a verbal discussion or meeting';
    case 'previous':
      return 'Resume a previous activity or work item';
    case 'chat':
      return 'Quick messaging with team members';
    default:
      return '';
  }
}
