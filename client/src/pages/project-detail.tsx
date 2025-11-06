import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, Link, useLocation } from 'wouter';
import { ArrowLeft, Calendar, Users, Tag, FileText, MessageSquare, ListTodo, Sparkles, Lightbulb, Shield, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { IdeaSparksList } from '@/components/idea-sparks-list';
import { PageBreadcrumb, buildBreadcrumbs } from '@/components/PageBreadcrumb';
import AcademySidebar from '@/components/AcademySidebar';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Project, ProjectAgent, ProjectTask, ProjectMessage, ProjectFile, Brand } from '@shared/schema';

type AgentDetails = {
  id: string;
  title: string;
  autonomy: "L0" | "L1" | "L2" | "L3";
  status: "pilot" | "live" | "watch" | "rollback";
  nextGate: number | null;
};

const PILLAR_ICONS = {
  Imagination: Sparkles,
  Innovation: Lightbulb,
  Impact: Shield,
};

const STATUS_CONFIG = {
  planning: { label: "Planning", icon: Clock, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  active: { label: "Active", icon: CheckCircle2, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  on_hold: { label: "On Hold", icon: AlertCircle, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  archived: { label: "Archived", icon: FileText, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  medium: { label: "Medium", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export default function ProjectDetail() {
  const [, params] = useRoute('/project/:id');
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : undefined;
  const { toast } = useToast();

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  // Fetch brand for breadcrumb
  const { data: brand } = useQuery<Brand>({
    queryKey: ['/api/brands', project?.brandId],
    enabled: !!project?.brandId,
    queryFn: async () => {
      const res = await fetch(`/api/brands/${project?.brandId}`);
      if (!res.ok) throw new Error('Failed to fetch brand');
      return res.json();
    },
  });

  // Fetch project agents
  const { data: agents = [] } = useQuery<ProjectAgent[]>({
    queryKey: ['/api/projects', projectId, 'agents'],
    enabled: !!projectId,
  });

  // Fetch project tasks
  const { data: tasks = [] } = useQuery<ProjectTask[]>({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId,
  });

  // Fetch project files
  const { data: files = [] } = useQuery<ProjectFile[]>({
    queryKey: ['/api/projects', projectId, 'files'],
    enabled: !!projectId,
  });

  // Fetch project messages
  const { data: messages = [] } = useQuery<ProjectMessage[]>({
    queryKey: ['/api/projects', projectId, 'messages'],
    enabled: !!projectId,
  });

  // Fetch full details for first agent (for Academy Sidebar)
  const firstAgentId = agents.length > 0 ? agents[0].agentId : null;
  const { data: featuredAgent } = useQuery<AgentDetails>({
    queryKey: ['/api/agents', firstAgentId],
    enabled: !!firstAgentId,
    queryFn: async () => {
      const res = await fetch(`/api/agents/${firstAgentId}`);
      if (!res.ok) throw new Error('Failed to fetch agent details');
      return res.json();
    },
  });

  // Academy Sidebar handlers
  const handleTrainClick = (agentId: string) => {
    setLocation(`/academy/train?agent=${agentId}`);
  };

  const handlePromote = async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advance: 1 }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to promote agent");
      }
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/agents', agentId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'agents'] });
      
      toast({
        title: "Agent promoted",
        description: "The agent has been successfully promoted to the next gate.",
      });
    } catch (error: any) {
      toast({
        title: "Promotion failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Project Not Found
            </CardTitle>
            <CardDescription>
              The project you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/projects">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PillarIcon = PILLAR_ICONS[project.category as keyof typeof PILLAR_ICONS] || Sparkles;
  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || Clock;
  const priorityConfig = PRIORITY_CONFIG[project.priority as keyof typeof PRIORITY_CONFIG];

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Build breadcrumbs
  const breadcrumbs = buildBreadcrumbs({
    businessUnit: brand ? { slug: brand.business_unit.toLowerCase(), name: brand.business_unit } : undefined,
    brand: brand ? { id: brand.id, name: brand.name } : undefined,
    project: { id: project.id, name: project.title },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <PageBreadcrumb segments={breadcrumbs} />
        </div>

        {/* Two-column layout: Main content + Academy Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Link href="/projects">
              <Button variant="ghost" size="sm" data-testid="button-back-to-projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <PillarIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-project-name">
                  {project.title}
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="text-project-description">
                  {project.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={statusConfig?.color} data-testid="badge-project-status">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig?.label}
            </Badge>
            <Badge className={priorityConfig?.color} data-testid="badge-project-priority">
              {priorityConfig?.label} Priority
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PillarIcon className="h-4 w-4" />
                Pillar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-pillar">{project.category}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-task-count">
                {completedTasks} / {tasks.length}
              </p>
              <p className="text-xs text-muted-foreground">{progressPercentage}% complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-agent-count">{agents.length}</p>
              <p className="text-xs text-muted-foreground">Assigned agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold" data-testid="text-created-date">
                {format(new Date(project.createdAt), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="ideas" data-testid="tab-ideas">Idea Sparks</TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">Team ({agents.length})</TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">Files ({files.length})</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Messages ({messages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p className="text-sm">{project.description || 'No description provided'}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <Badge className={statusConfig?.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig?.label}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority</h3>
                    <Badge className={priorityConfig?.color}>{priorityConfig?.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No tasks created yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} data-testid={`task-${task.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 'secondary'}
                          data-testid={`task-status-${task.id}`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <CardDescription>{task.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Project Idea Sparks
                </CardTitle>
                <CardDescription>
                  Ideas and insights related to this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IdeaSparksList projectId={projectId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            {agents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No agents assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} data-testid={`agent-${agent.id}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{agent.agentId}</CardTitle>
                      <CardDescription>{agent.role}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            {files.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No files uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <Card key={file.id} data-testid={`file-${file.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base">{file.fileName}</CardTitle>
                          <CardDescription>
                            Uploaded {format(new Date(file.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{file.reviewStatus || 'pending'}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <Card key={message.id} data-testid={`message-${message.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">
                            {message.fromAgentId || message.fromPersonId || 'Unknown'}
                          </CardTitle>
                          <p className="text-sm mt-1">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
          </div>
          {/* End Main content */}

          {/* Academy Sidebar */}
          {featuredAgent && (
            <aside className="lg:w-80 flex-shrink-0">
              <AcademySidebar
                agent={{
                  id: featuredAgent.id,
                  name: featuredAgent.title,
                  autonomy: featuredAgent.autonomy,
                  status: featuredAgent.status,
                  nextGate: featuredAgent.nextGate,
                }}
                onTrainClick={handleTrainClick}
                onPromote={handlePromote}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
