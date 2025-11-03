import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Filter, FolderKanban, Calendar, Users, CheckCircle2, AlertCircle, Clock, Sparkles, Lightbulb, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, InsertProject } from "@shared/schema";
import { insertProjectSchema } from "@shared/schema";

const PILLAR_ICONS = {
  Imagination: Sparkles,
  Innovation: Lightbulb,
  Impact: Shield,
};

const STATUS_CONFIG = {
  planning: { label: "Planning", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  active: { label: "Active", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  on_hold: { label: "On Hold", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  completed: { label: "Completed", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  archived: { label: "Archived", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  medium: { label: "Medium", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

// Normalize URL slug to proper category name
const normalizeCategoryFromUrl = (slug?: string): string => {
  if (!slug) return "all";
  const normalized = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  return ["Imagination", "Innovation", "Impact"].includes(normalized) ? normalized : "all";
};

// Convert category name to URL slug
const categoryToSlug = (category: string): string => {
  return category.toLowerCase();
};

export default function Projects() {
  const [, params] = useRoute("/projects/:category");
  const [, setLocation] = useLocation();
  const categoryFromUrl = normalizeCategoryFromUrl(params?.category);
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Imagination" as const,
      status: "planning" as const,
      priority: "medium" as const,
      dueDate: "",
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await apiRequest('POST', '/api/projects', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  // Sync category with URL parameter
  useEffect(() => {
    const normalizedCategory = normalizeCategoryFromUrl(params?.category);
    if (normalizedCategory !== selectedCategory) {
      setSelectedCategory(normalizedCategory);
    }
  }, [params?.category]);

  // Update URL when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "all") {
      setLocation("/projects");
    } else {
      setLocation(`/projects/${categoryToSlug(category)}`);
    }
  };

  // Fetch all projects for stats (unfiltered)
  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Stable queryKey for filtered projects
  const filteredQueryKey = useMemo(() => {
    const key: (string | undefined)[] = ['/api/projects'];
    if (selectedCategory !== 'all') key.push(`category:${selectedCategory}`);
    if (selectedStatus !== 'all') key.push(`status:${selectedStatus}`);
    return key;
  }, [selectedCategory, selectedStatus]);

  // Fetch filtered projects for display
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: filteredQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const url = `/api/projects${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
  });

  const filteredProjects = projects;

  // Stats calculated from all projects (unfiltered)
  const projectsByPillar = {
    Imagination: allProjects.filter(p => p.category === 'Imagination').length,
    Innovation: allProjects.filter(p => p.category === 'Innovation').length,
    Impact: allProjects.filter(p => p.category === 'Impact').length,
  };

  const activeProjects = allProjects.filter(p => p.status === 'active').length;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-projects">
              <FolderKanban className="h-8 w-8" />
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize work by business pillars: Imagination, Innovation, Impact
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-project">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-create-project">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to one of the business pillars: Imagination, Innovation, or Impact.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter project title" data-testid="input-project-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""}
                            placeholder="Describe the project goals and scope" 
                            rows={3}
                            data-testid="input-project-description" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Pillar</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-project-category">
                                <SelectValue placeholder="Select pillar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Imagination">Imagination</SelectItem>
                              <SelectItem value="Innovation">Innovation</SelectItem>
                              <SelectItem value="Impact">Impact</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-project-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-project-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              type="date" 
                              data-testid="input-project-due-date" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      data-testid="button-cancel-project"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProjectMutation.isPending}
                      data-testid="button-submit-project"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-projects">{allProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Imagination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-imagination">{projectsByPillar.Imagination}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Innovation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-innovation">{projectsByPillar.Innovation}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-impact">{projectsByPillar.Impact}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Category:</span>
          </div>
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
            <TabsList>
              <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
              <TabsTrigger value="Imagination" data-testid="filter-imagination">
                <Sparkles className="h-3 w-3 mr-1" />
                Imagination
              </TabsTrigger>
              <TabsTrigger value="Innovation" data-testid="filter-innovation">
                <Lightbulb className="h-3 w-3 mr-1" />
                Innovation
              </TabsTrigger>
              <TabsTrigger value="Impact" data-testid="filter-impact">
                <Shield className="h-3 w-3 mr-1" />
                Impact
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm font-medium">Status:</span>
          </div>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="all" data-testid="filter-status-all">All</TabsTrigger>
              <TabsTrigger value="planning" data-testid="filter-status-planning">Planning</TabsTrigger>
              <TabsTrigger value="active" data-testid="filter-status-active">Active</TabsTrigger>
              <TabsTrigger value="on_hold" data-testid="filter-status-on-hold">On Hold</TabsTrigger>
              <TabsTrigger value="completed" data-testid="filter-status-completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center space-y-2">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No projects found</p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(true)}
                data-testid="button-create-first-project"
              >
                <Plus className="h-4 w-4" />
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const PillarIcon = PILLAR_ICONS[project.category as keyof typeof PILLAR_ICONS];
              const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning;
              const priorityConfig = PRIORITY_CONFIG[(project.priority || 'medium') as keyof typeof PRIORITY_CONFIG];
              
              return (
                <Card key={project.id} className="hover-elevate cursor-pointer" data-testid={`card-project-${project.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <PillarIcon className="h-4 w-4" />
                          {project.title}
                        </CardTitle>
                        <CardDescription className="mt-1">{project.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={statusConfig.color} data-testid={`badge-status-${project.id}`}>
                        {statusConfig.label}
                      </Badge>
                      <Badge className={priorityConfig.color} data-testid={`badge-priority-${project.id}`}>
                        {priorityConfig.label}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-category-${project.id}`}>
                        {project.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {project.dueDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
