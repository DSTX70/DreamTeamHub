import { BookOpen, Rocket, Shield, Users, Zap, Target, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HelpPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Guide</h1>
        <p className="text-muted-foreground mt-2">
          Everything you need to know about Dream Team Hub's features and capabilities
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 pb-4 pt-2 -mt-2 border-b mb-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-muted">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
            <TabsTrigger value="agents" data-testid="tab-agents">AI Agents</TabsTrigger>
            <TabsTrigger value="workflows" data-testid="tab-workflows">Workflows</TabsTrigger>
            <TabsTrigger value="getting-started" data-testid="tab-getting-started">Getting Started</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" data-testid="content-overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                What is Dream Team Hub?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Dream Team Hub is a multi-pod orchestration platform that helps distributed teams manage complex workflows, 
                collaborate effectively, and leverage AI-powered agents to streamline operations. Think of it as a "single 
                pane of glass" that brings together all your team's priorities, decisions, ideas, and compliance needs in 
                one unified system.
              </p>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 space-y-2">
                  <Target className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Unified Operations</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage priorities, assignments, escalations, and decisions across all teams in one place.
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    40 specialized AI agents with unique expertise, ready to assist with any task or question.
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Governance Built-In</h3>
                  <p className="text-sm text-muted-foreground">
                    4-level autonomy system ensures AI agents operate safely within defined boundaries.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6" data-testid="content-features">
          <div className="grid gap-4">
            <FeatureCard
              icon={<Target className="h-5 w-5" />}
              title="Control Tower Dashboard"
              description="Your mission control center for the entire organization."
              features={[
                "Track top priorities across all teams at a glance",
                "Monitor assignments and due dates",
                "Identify and address blocked or at-risk work items",
                "View real-time statistics and team performance indicators",
                "Launch common tasks directly from the dashboard"
              ]}
              bestFor="Daily standup reviews, leadership oversight, identifying bottlenecks, and ensuring nothing falls through the cracks."
            />

            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Dream Team Chat"
              description="Talk to 40 specialized AI agents, each with unique expertise and personality."
              features={[
                "Role-based personas (Legal, Engineering, Marketing, Security, etc.)",
                "Context-aware responses based on organizational knowledge",
                "Natural language conversations - talk like you would to a colleague",
                "4 autonomy levels from Advisor to Orchestrator",
                "Agent memory and persistent context"
              ]}
              bestFor="Getting quick expert opinions, drafting documents, researching solutions, compliance checks, and brainstorming without scheduling meetings."
            />

            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Role Cards & Agent Specs"
              description="Define job descriptions and configure AI agent behavior."
              features={[
                "Document responsibilities and success criteria",
                "RACI Matrix support for clarity on roles",
                "Link human roles to AI agent capabilities",
                "Set custom instructions and guardrails",
                "Control tool access and policy enforcement"
              ]}
              bestFor="Onboarding, role clarity, defining team structure, and ensuring AI agents align with organizational needs."
            />

            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Decision Log"
              description="Immutable record of important organizational decisions."
              features={[
                "Document what was decided, when, and by whom",
                "Preserve context and reasoning behind decisions",
                "Approval workflows for stakeholder sign-off",
                "Search and filter past decisions quickly",
                "Complete audit trail for compliance"
              ]}
              bestFor="Governance, compliance audits, resolving disputes, understanding history, and preventing repeated debates."
            />

            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Audit Engine"
              description="Cross-pod compliance checks with automated evidence collection."
              features={[
                "Define compliance checklists across teams",
                "Automatically collect screenshots, logs, and documents",
                "Track findings and remediation progress",
                "Schedule audits to run automatically",
                "Cross-pod verification ensures consistency"
              ]}
              bestFor="SOC2 compliance, security reviews, policy enforcement, quality assurance, and risk management."
            />

            <FeatureCard
              icon={<Rocket className="h-5 w-5" />}
              title="Brainstorm Studio"
              description="Structured ideation sessions with AI-assisted organization."
              features={[
                "Collect ideas from team members in one place",
                "AI automatically clusters similar ideas",
                "Voting and scoring to prioritize",
                "Detect themes and patterns",
                "Export results for action planning"
              ]}
              bestFor="Product planning, problem-solving workshops, innovation sprints, and team retrospectives."
            />

            <FeatureCard
              icon={<Info className="h-5 w-5" />}
              title="Intake & Routing"
              description="Manage work items from request to completion."
              features={[
                "Centralized intake for all requests",
                "Smart routing to the right team or person",
                "Status tracking from New to Done",
                "Priority and SLA monitoring",
                "Workload balancing visibility"
              ]}
              bestFor="Managing support requests, feature requests, internal service requests, and fair work distribution."
            />

            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Universal Search (Cmd+K)"
              description="Lightning-fast search across your entire organization."
              features={[
                "Search brands, products, projects, agents, and pods",
                "Two-zone keyboard navigation (Quick Actions + Results)",
                "Recent searches memory (last 8 searches)",
                "Infinite scroll pagination for large result sets",
                "Quick action shortcuts for common tasks",
                "Relevance-based sorting"
              ]}
              bestFor="Finding anything quickly, navigating between features, accessing common actions, and discovering content across your organization."
            />

            <FeatureCard
              icon={<Rocket className="h-5 w-5" />}
              title="Work Orders & Playbooks"
              description="Automated task execution with reusable templates."
              features={[
                "Budget caps enforcement (runs/day and $/day limits)",
                "Reusable playbooks (handle-based references)",
                "Database-backed execution tracking",
                "Rate limiting with 429 status codes",
                "Complete audit trail via operations events",
                "Integration with AI agents for execution"
              ]}
              bestFor="Automating repetitive tasks, standardizing operational procedures, managing budget constraints, and tracking execution history."
            />

            <FeatureCard
              icon={<Target className="h-5 w-5" />}
              title="Coverage Analytics"
              description="Role staffing analysis and agent distribution insights."
              features={[
                "Unstaffed roles detection (no agents assigned)",
                "Over-replication analysis (configurable thresholds)",
                "Complete coverage table with agent counts",
                "Dynamic threshold adjustment",
                "Role drill-through for detailed agent lists",
                "Real-time staffing metrics"
              ]}
              bestFor="Workforce planning, identifying gaps in coverage, balancing agent distribution, and ensuring all roles are adequately staffed."
            />

            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Business Unit Analytics"
              description="Real-time operational metrics with visual trends."
              features={[
                "24-hour hourly sparkline charts",
                "Track publishes, draft uploads, and work order runs",
                "Interactive tooltips with exact counts and timestamps",
                "Brand portfolios and agent rosters",
                "Knowledge links with Google Drive integration",
                "Recent activity feeds"
              ]}
              bestFor="Monitoring operational health, identifying trends, tracking team productivity, and making data-driven decisions."
            />

            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Onboarding Wizard"
              description="Streamlined brand and product creation workflow."
              features={[
                "Multi-step wizard for brand creation",
                "Google Drive folder link integration",
                "Optional product creation with Drive setup",
                "URL format validation",
                "Complete brand/product hierarchy in one workflow",
                "Direct links to created entities"
              ]}
              bestFor="Onboarding new brands, setting up product portfolios, integrating with Google Drive, and ensuring consistent setup processes."
            />
          </div>
        </TabsContent>

        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-6" data-testid="content-agents">
          <Card>
            <CardHeader>
              <CardTitle>Understanding the Autonomy Ladder</CardTitle>
              <CardDescription>
                Dream Team Hub uses a 4-level governance system that controls what AI agents can do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AutonomyLevel
                level="L0"
                title="Advisor"
                count={2}
                color="bg-gray-500"
                description="Provide read-only guidance and recommendations"
                cannot="Make changes, create documents, or execute actions"
                examples="DrVagus (Medical Advisor), IntlCounsel (International Legal)"
                useWhen="You want expert opinion without any system changes"
              />
              
              <AutonomyLevel
                level="L1"
                title="Operator"
                count={23}
                color="bg-blue-500"
                description="Draft documents, transform data, create proposals"
                cannot="Finalize decisions or execute end-to-end workflows without approval"
                examples="Aegis (IP Counsel), CodeBlock (Developer Advocate), Echo (Content Writer)"
                useWhen="You need help creating something but want final approval"
              />
              
              <AutonomyLevel
                level="L2"
                title="Executor"
                count={11}
                color="bg-purple-500"
                description="Complete end-to-end workflows, make approved changes, execute processes"
                cannot="Coordinate other agents or spawn new workflows"
                examples="Archivist (Evidence Curator), Sentinel (Security Lead), Verifier (QA Lead)"
                useWhen="You want the agent to handle something start-to-finish within its domain"
              />
              
              <AutonomyLevel
                level="L3"
                title="Orchestrator"
                count={4}
                color="bg-green-500"
                description="Coordinate multiple agents, spawn workflows, manage complex projects"
                cannot=""
                examples="Helm (Delivery Manager), OS (Program Lead), Amani (Partnerships), AppDevGuru (App Architecture)"
                useWhen="You need a full project managed across multiple teams and functions"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Guardrails & Security</CardTitle>
              <CardDescription>Every AI agent operates within strict boundaries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Built-in Protections
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>• Approval requirements for critical actions</li>
                    <li>• Budget limits (tokens, time, cost)</li>
                    <li>• Tool restrictions by role</li>
                    <li>• Policy enforcement for compliance</li>
                    <li>• Complete audit logging</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Standard Run Caps
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>• 200,000 tokens per task</li>
                    <li>• 180 seconds max runtime</li>
                    <li>• $5 budget per execution</li>
                    <li>• Memory policy enforcement</li>
                    <li>• Telemetry tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6" data-testid="content-workflows">
          <Card>
            <CardHeader>
              <CardTitle>Common Workflows by Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <WorkflowSection
                role="Leadership & Program Managers"
                steps={[
                  "Start your day with the Control Tower Dashboard to see priorities and escalations",
                  "Use Decision Log to record strategic choices",
                  "Chat with Helm (L3 Orchestrator) to plan delivery schedules",
                  "Review Audit Engine results for compliance status"
                ]}
              />
              
              <WorkflowSection
                role="Individual Contributors"
                steps={[
                  "Check Intake & Routing for your assigned work",
                  "Chat with relevant AI agents for expert guidance (e.g., Aegis for legal questions)",
                  "Use Brainstorm Studio to explore solutions",
                  "Document outcomes in Decision Log when needed"
                ]}
              />
              
              <WorkflowSection
                role="Admins & System Managers"
                steps={[
                  "Use Roster Admin to configure roles and agents",
                  "Keep Role ⇄ Agent Specs synchronized",
                  "Monitor Pods & Teams structure",
                  "Set up Audit Engine checklists for compliance"
                ]}
              />
              
              <WorkflowSection
                role="New Team Members"
                steps={[
                  "Review Role Cards to understand team structure",
                  "Browse Pods & Teams to know who does what",
                  "Try Dream Team Chat to ask questions without bothering colleagues",
                  "Check Control Tower to see current priorities"
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6" data-testid="content-getting-started">
          <Card>
            <CardHeader>
              <CardTitle>Your 4-Week Onboarding Path</CardTitle>
              <CardDescription>Recommended steps to master Dream Team Hub</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <OnboardingWeek
                week={1}
                title="Explore"
                items={[
                  "Review the Control Tower Dashboard",
                  "Browse Pods & Teams to understand structure",
                  "Try Dream Team Chat with different agents",
                  "Check out Role Cards for your team"
                ]}
              />
              
              <OnboardingWeek
                week={2}
                title="Contribute"
                items={[
                  "Log a decision in Decision Log",
                  "Submit work through Intake & Routing",
                  "Join a Brainstorm Studio session",
                  "Review your pod's Audit Engine results"
                ]}
              />
              
              <OnboardingWeek
                week={3}
                title="Optimize"
                items={[
                  "Customize your frequent AI agents in Agent Specs",
                  "Set up your team's workflow in Intake & Routing",
                  "Create audit checklists in Audit Engine",
                  "Sync Role ⇄ Agent Specs for your pod"
                ]}
              />
              
              <OnboardingWeek
                week={4}
                title="Master"
                items={[
                  "Use L3 Orchestrator agents for complex projects",
                  "Build custom workflows combining multiple features",
                  "Leverage AI agents for routine tasks",
                  "Contribute to platform improvements"
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Maximum Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <TipItem
                  icon={<Target className="h-4 w-4" />}
                  text="Start Small: Don't try to use every feature at once. Pick 2-3 that solve your biggest pain points."
                />
                <TipItem
                  icon={<Zap className="h-4 w-4" />}
                  text="Trust the AI Agents: They're designed with guardrails - try delegating routine tasks to them."
                />
                <TipItem
                  icon={<BookOpen className="h-4 w-4" />}
                  text="Document Decisions: Future-you will thank present-you for logging important choices."
                />
                <TipItem
                  icon={<Shield className="h-4 w-4" />}
                  text="Use the Right Autonomy Level: Match agent authority to task importance."
                />
                <TipItem
                  icon={<Users className="h-4 w-4" />}
                  text="Keep Roles & Agents Synced: Regular synchronization ensures AI agents stay aligned with reality."
                />
                <TipItem
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  text="Leverage Cross-Pod Features: The real power comes from connecting work across teams."
                />
                <TipItem
                  icon={<AlertCircle className="h-4 w-4" />}
                  text="Ask Questions: Use Dream Team Chat liberally - agents never get tired of answering."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function FeatureCard({ 
  icon, 
  title, 
  description, 
  features, 
  bestFor 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  features: string[]; 
  bestFor: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Key Capabilities:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm">
            <strong className="text-foreground">Best used for:</strong>{" "}
            <span className="text-muted-foreground">{bestFor}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AutonomyLevel({
  level,
  title,
  count,
  color,
  description,
  cannot,
  examples,
  useWhen
}: {
  level: string;
  title: string;
  count: number;
  color: string;
  description: string;
  cannot: string;
  examples: string;
  useWhen: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Badge className={`${color} text-white`}>{level}</Badge>
        <h3 className="font-semibold text-lg">{title}</h3>
        <Badge variant="secondary">{count} agents</Badge>
      </div>
      <div className="space-y-2 text-sm">
        <p><strong>What they do:</strong> {description}</p>
        {cannot && <p><strong>Cannot:</strong> {cannot}</p>}
        <p><strong>Examples:</strong> {examples}</p>
        <p className="text-muted-foreground"><strong>Use when:</strong> {useWhen}</p>
      </div>
    </div>
  );
}

function WorkflowSection({ role, steps }: { role: string; steps: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{role}</h3>
      <ol className="space-y-2 text-sm text-muted-foreground">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-semibold text-foreground">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {role !== "New Team Members" && <Separator />}
    </div>
  );
}

function OnboardingWeek({ week, title, items }: { week: number; title: string; items: string[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-base px-3 py-1">Week {week}</Badge>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground ml-6">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {week < 4 && <Separator />}
    </div>
  );
}

function TipItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate">
      <div className="text-primary mt-0.5">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
