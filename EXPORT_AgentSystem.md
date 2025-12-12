# Dream Team Hub - Agent System & Agent Lab Academy
## Complete Export for ChatGPT Review

---

## PART 1: DATABASE SCHEMA (shared/schema.ts)

### Agents Table
```typescript
export const agents = pgTable("agents", {
  id: text("id").primaryKey(), // e.g., "agent_os", "agent_brand"
  title: text("title").notNull(),
  type: text("type").$type<"dream_team" | "pod_role">().default("dream_team"),
  podId: integer("pod_id").references(() => pods.id), // nullable - some agents span multiple pods
  podName: text("pod_name"), // Denormalized for easy display
  pillar: text("pillar"), // e.g., "IMAGINATION", "INNOVATION", "IMPACT"
  status: text("status").$type<"active" | "inactive" | "training">().default("active"),
  autonomyLevel: text("autonomy_level").$type<"L0" | "L1" | "L2" | "L3">().default("L2"),
  skillPackPath: text("skill_pack_path"), // agents/agent_os
  promptText: text("prompt_text"), // Mission statement / prompt
  toolsConfig: jsonb("tools_config").$type<{ tools: string[] }>(),
  goldensPath: text("goldens_path"), // agents/agent_os/goldens.csv
  lastEvalAt: timestamp("last_eval_at"),
  evalScore: real("eval_score"), // 0-1
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
```

### Agent Specs Table (Legacy - 40 Dream Team Specs)
```typescript
export const agentSpecs = pgTable("agent_specs", {
  id: serial("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  pod: text("pod").notNull(),
  toneVoice: text("tone_voice"),
  category: text("category"),
  definitionOfDone: text("definition_of_done").array(),
  strengths: text("strengths").array(),
  raciR: text("raci_r").array(), // Responsible
  raciA: text("raci_a").array(), // Accountable
  raciC: text("raci_c").array(), // Consulted
  raciI: text("raci_i").array(), // Informed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Pod Agents Table (Deprecated - migrating to unified agents)
```typescript
export const podAgents = pgTable("pod_agents", {
  id: serial("id").primaryKey(),
  podId: integer("pod_id").references(() => pods.id).notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  skills: text("skills").array(),
  autonomyLevel: text("autonomy_level").$type<"L0" | "L1" | "L2" | "L3">().default("L2"),
  status: text("status").$type<"active" | "inactive">().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Project Agents Junction Table
```typescript
export const projectAgents = pgTable("project_agents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  agentId: text("agent_id").notNull().references(() => agents.id),
  role: text("role"),
  addedAt: timestamp("added_at").defaultNow(),
});
```

---

## PART 2: PACK REGISTRY (server/ai/packRegistry.ts)

The Pack Registry defines 20+ AI-powered specification pack types:

```typescript
import { z } from "zod";
import { LifestylePackSchema } from "./schemas/lifestylePack";
import { AgentLabAcademyPackSchema } from "./schemas/agentLabAcademyPack";
import { AgentGovernancePackSchema } from "./schemas/agentGovernancePack";
// ... more imports

export interface PackConfig {
  id: string;
  packType: string;
  label: string;
  skillName: string;
  endpointSuffix: string;
  schema: z.ZodType;
  icon?: string; // Lucide icon name for frontend
  driveFolder?: string; // Environment variable name for Drive folder
  exportEnabled: boolean;
  category: "brand_creative" | "legal_ip" | "ops" | "governance" | "partnerships" | "data" | "expansion";
}

export const PACK_REGISTRY: PackConfig[] = [
  // Core/Existing Packs
  {
    id: "lifestyle",
    packType: "lifestyle",
    label: "Generate Lifestyle Banner Pack",
    skillName: "generateLifestyleBannerPack",
    endpointSuffix: "generate-lifestyle-pack",
    schema: LifestylePackSchema,
    icon: "Sparkles",
    driveFolder: "DRIVE_LIFESTYLE_PACKS_FOLDER",
    exportEnabled: true,
    category: "brand_creative",
  },
  {
    id: "patent",
    packType: "patent",
    label: "Generate Patent Claims Pack",
    skillName: "generatePatentClaimsPack",
    endpointSuffix: "generate-patent-claims-pack",
    schema: PatentClaimsPackSchema,
    icon: "FileText",
    driveFolder: "DRIVE_PATENT_PACKS_FOLDER",
    exportEnabled: true,
    category: "legal_ip",
  },
  {
    id: "launch",
    packType: "launch",
    label: "Generate Launch Plan Pack",
    skillName: "generateLaunchPlanPack",
    endpointSuffix: "generate-launch-plan-pack",
    schema: LaunchPlanPackSchema,
    icon: "Rocket",
    driveFolder: "DRIVE_LAUNCH_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "audit",
    packType: "website_audit",
    label: "Generate Website Audit Pack",
    skillName: "generateWebsiteAuditPack",
    endpointSuffix: "generate-website-audit-pack",
    schema: WebsiteAuditPackSchema,
    icon: "Search",
    driveFolder: "DRIVE_WEBSITE_AUDIT_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "riskCompliance",
    packType: "risk_compliance",
    label: "Generate Risk & Compliance Pack",
    skillName: "generateRiskCompliancePack",
    endpointSuffix: "generate-risk-compliance-pack",
    schema: RiskCompliancePackSchema,
    icon: "Shield",
    driveFolder: "DRIVE_RISK_COMPLIANCE_PACKS_FOLDER",
    exportEnabled: true,
    category: "governance",
  },
  {
    id: "agentAcademy",
    packType: "agent_lab_academy",
    label: "Generate Agent Lab Academy Pack",
    skillName: "generateAgentLabAcademyPack",
    endpointSuffix: "generate-agent-lab-academy-pack",
    schema: AgentLabAcademyPackSchema,
    icon: "GraduationCap",
    driveFolder: "DRIVE_AGENT_LAB_ACADEMY_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "agentGovernance",
    packType: "agent_governance",
    label: "Generate Agent Governance Pack",
    skillName: "generateAgentGovernancePack",
    endpointSuffix: "generate-agent-governance-pack",
    schema: AgentGovernancePackSchema,
    icon: "ShieldCheck",
    driveFolder: "DRIVE_AGENT_GOVERNANCE_PACKS_FOLDER",
    exportEnabled: true,
    category: "governance",
  },
  {
    id: "pricingMonetization",
    packType: "pricing_monetization",
    label: "Generate Pricing & Monetization Pack",
    skillName: "generatePricingMonetizationPack",
    endpointSuffix: "generate-pricing-monetization-pack",
    schema: PricingMonetizationPackSchema,
    icon: "DollarSign",
    driveFolder: "DRIVE_PRICING_MONETIZATION_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "dataMetrics",
    packType: "data_stewardship_metrics",
    label: "Generate Data Stewardship & Metrics Pack",
    skillName: "generateDataStewardshipMetricsPack",
    endpointSuffix: "generate-data-stewardship-metrics-pack",
    schema: DataStewardshipMetricsPackSchema,
    icon: "BarChart",
    driveFolder: "DRIVE_DATA_STEWARDSHIP_METRICS_PACKS_FOLDER",
    exportEnabled: true,
    category: "data",
  },
  {
    id: "globalCollabs",
    packType: "globalcollabs_partnership",
    label: "Generate GlobalCollabs Partnerships Pack",
    skillName: "generateGlobalCollabsPartnershipPack",
    endpointSuffix: "generate-globalcollabs-partnership-pack",
    schema: GlobalCollabsPartnershipPackSchema,
    icon: "Handshake",
    driveFolder: "DRIVE_GLOBALCOLLABS_PARTNERSHIP_PACKS_FOLDER",
    exportEnabled: true,
    category: "partnerships",
  },
  {
    id: "packagingPrePress",
    packType: "packaging_prepress",
    label: "Generate Packaging & Pre-Press Pack",
    skillName: "generatePackagingPrePressPack",
    endpointSuffix: "generate-packaging-pre-press-pack",
    schema: PackagingPrePressPackSchema,
    icon: "Package",
    driveFolder: "DRIVE_PACKAGING_PREPRESS_PACKS_FOLDER",
    exportEnabled: true,
    category: "brand_creative",
  },
  {
    id: "productLineSkuTree",
    packType: "product_line_sku_tree",
    label: "Generate Product Line Architecture & SKU Tree Pack",
    skillName: "generateProductLineSkuTreePack",
    endpointSuffix: "generate-product-line-sku-tree-pack",
    schema: ProductLineSkuTreePackSchema,
    icon: "Network",
    driveFolder: "DRIVE_PRODUCT_LINE_SKU_TREE_PACKS_FOLDER",
    exportEnabled: true,
    category: "brand_creative",
  },
  {
    id: "ecomPdpAplus",
    packType: "ecom_pdp_aplus_content",
    label: "Generate E-Com PDP & A+ Content Pack",
    skillName: "generateEcomPdpAplusContentPack",
    endpointSuffix: "generate-ecom-pdp-aplus-content-pack",
    schema: EcomPdpAplusContentPackSchema,
    icon: "ShoppingCart",
    driveFolder: "DRIVE_ECOM_PDP_APLUS_CONTENT_PACKS_FOLDER",
    exportEnabled: true,
    category: "brand_creative",
  },
  {
    id: "socialCampaign",
    packType: "social_campaign_content_calendar",
    label: "Generate Social Campaign & Content Calendar Pack",
    skillName: "generateSocialCampaignContentCalendarPack",
    endpointSuffix: "generate-social-campaign-content-calendar-pack",
    schema: SocialCampaignContentCalendarPackSchema,
    icon: "Calendar",
    driveFolder: "DRIVE_SOCIAL_CAMPAIGN_CONTENT_CALENDAR_PACKS_FOLDER",
    exportEnabled: true,
    category: "brand_creative",
  },
  {
    id: "implementationRunbook",
    packType: "implementation_runbook_sop",
    label: "Generate Implementation Runbook & SOP Pack",
    skillName: "generateImplementationRunbookSopPack",
    endpointSuffix: "generate-implementation-runbook-sop-pack",
    schema: ImplementationRunbookSopPackSchema,
    icon: "BookOpen",
    driveFolder: "DRIVE_IMPLEMENTATION_RUNBOOK_SOP_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "supportPlaybook",
    packType: "support_playbook_knowledge_base",
    label: "Generate Support Playbook & Knowledge Base Pack",
    skillName: "generateSupportPlaybookKnowledgeBasePack",
    endpointSuffix: "generate-support-playbook-knowledge-base-pack",
    schema: SupportPlaybookKnowledgeBasePackSchema,
    icon: "LifeBuoy",
    driveFolder: "DRIVE_SUPPORT_PLAYBOOK_KB_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "retailWholesale",
    packType: "retail_wholesale_readiness",
    label: "Generate Retail & Wholesale Readiness Pack",
    skillName: "generateRetailWholesaleReadinessPack",
    endpointSuffix: "generate-retail-wholesale-readiness-pack",
    schema: RetailWholesaleReadinessPackSchema,
    icon: "Store",
    driveFolder: "DRIVE_RETAIL_WHOLESALE_READINESS_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
  {
    id: "experimentOptimization",
    packType: "experiment_optimization",
    label: "Generate Experiment & Optimization Pack",
    skillName: "generateExperimentOptimizationPack",
    endpointSuffix: "generate-experiment-optimization-pack",
    schema: ExperimentOptimizationPackSchema,
    icon: "FlaskConical",
    driveFolder: "DRIVE_EXPERIMENT_OPTIMIZATION_PACKS_FOLDER",
    exportEnabled: true,
    category: "data",
  },
  {
    id: "localizationMarket",
    packType: "localization_market_expansion",
    label: "Generate Localization & Market Expansion Pack",
    skillName: "generateLocalizationMarketExpansionPack",
    endpointSuffix: "generate-localization-market-expansion-pack",
    schema: LocalizationMarketExpansionPackSchema,
    icon: "Globe",
    driveFolder: "DRIVE_LOCALIZATION_MARKET_EXPANSION_PACKS_FOLDER",
    exportEnabled: true,
    category: "expansion",
  },
  {
    id: "customerJourney",
    packType: "customer_journey_lifecycle",
    label: "Generate Customer Journey & Lifecycle Pack",
    skillName: "generateCustomerJourneyLifecyclePack",
    endpointSuffix: "generate-customer-journey-lifecycle-pack",
    schema: CustomerJourneyLifecyclePackSchema,
    icon: "Route",
    driveFolder: "DRIVE_CUSTOMER_JOURNEY_LIFECYCLE_PACKS_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
];

// Helper functions
export function getPackById(id: string): PackConfig | undefined {
  return PACK_REGISTRY.find(p => p.id === id);
}

export function getPackByType(packType: string): PackConfig | undefined {
  return PACK_REGISTRY.find(p => p.packType === packType);
}

export function getPacksByCategory(category: PackConfig["category"]): PackConfig[] {
  return PACK_REGISTRY.filter(p => p.category === category);
}
```

---

## PART 3: AGENT LAB ACADEMY PACK SCHEMA (server/ai/schemas/agentLabAcademyPack.ts)

```typescript
import { z } from "zod";

export const AcademyModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration_minutes: z.number().int(),
  format: z.enum(["video", "workshop", "lab", "reading", "office_hours"]),
  description: z.string(),
  outcomes: z.array(z.string()),
  required_assets: z.array(z.string()),
});

export const AcademyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  objectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  modules: z.array(AcademyModuleSchema),
});

export const CertificationPathSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["L1", "L2", "L3"]),
  target_role: z.string(),
  required_tracks: z.array(z.string()),
  exam_format: z.string(),
  criteria: z.array(z.string()),
});

export const AcademyLogisticsSchema = z.object({
  cohort_length_weeks: z.number().int(),
  cadence: z.string(),
  max_seats: z.number().int(),
  delivery_model: z.string(),
});

export const AgentLabAcademyPackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    primary_audience: z.string(),
    key_outcomes: z.array(z.string()),
  }),
  tracks: z.array(AcademyTrackSchema),
  certifications: z.array(CertificationPathSchema),
  logistics: AcademyLogisticsSchema,
  open_questions: z.array(z.string()),
});

export type AgentLabAcademyPack = z.infer<typeof AgentLabAcademyPackSchema>;
```

---

## PART 4: ACADEMY PAGE (client/src/pages/academy.tsx)

```tsx
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, TrendingUp, Award, Target } from "lucide-react";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";

interface AgentLabRole {
  id: number;
  handle: string;
  title: string;
  pod: string;
  toneVoice: string;
  category: string;
  definitionOfDone: string[];
  strengths: string[];
}

export default function AcademyPage() {
  const { data: roles = [], isLoading } = useQuery<AgentLabRole[]>({
    queryKey: ["/api/roles"],
  });

  // Filter Agent Lab roles
  const agentLabRoles = roles.filter(role => 
    role.category === "Agent Lab / Senior Advisers + Added Specialists"
  );

  // Group by tone/voice (used as autonomy level proxy)
  const groupedByLevel = agentLabRoles.reduce((acc, role) => {
    const level = role.toneVoice || "Advisory";
    if (!acc[level]) acc[level] = [];
    acc[level].push(role);
    return acc;
  }, {} as Record<string, AgentLabRole[]>);

  const levelCounts = {
    "Advisory": groupedByLevel["Advisory"]?.length || 0,
    "Collaborative": groupedByLevel["Collaborative"]?.length || 0,
    "Autonomous": groupedByLevel["Autonomous"]?.length || 0,
    "Strategic": groupedByLevel["Strategic"]?.length || 0,
  };

  const breadcrumbs = buildBreadcrumbs({ page: "Agent Lab Academy" });

  return (
    <div className="space-y-6">
      <PageBreadcrumb segments={breadcrumbs} />
      
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-academy">
              Agentic AI Lab & Training Academy
            </h1>
            <p className="text-sm text-muted-foreground">
              At-a-glance status of agents - training - promotions
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <GraduationCap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-advisory">
                {levelCounts["Advisory"]}
              </div>
              <div className="text-sm text-muted-foreground">Advisory</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-collaborative">
                {levelCounts["Collaborative"]}
              </div>
              <div className="text-sm text-muted-foreground">Collaborative</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Target className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-autonomous">
                {levelCounts["Autonomous"]}
              </div>
              <div className="text-sm text-muted-foreground">Autonomous</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-strategic">
                {levelCounts["Strategic"]}
              </div>
              <div className="text-sm text-muted-foreground">Strategic</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedByLevel).map(([level, levelRoles]) => (
          <Card key={level} className="p-4">
            <h3 className="font-semibold mb-3">{level} Level</h3>
            <div className="space-y-2">
              {levelRoles.map(role => (
                <div key={role.id} className="p-2 bg-muted/50 rounded-md">
                  <div className="font-medium text-sm">{role.title}</div>
                  <div className="text-xs text-muted-foreground">{role.pod}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## PART 5: ROLES PAGE (client/src/pages/roles.tsx)

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Users, Plus, ChevronDown, Brain, Wrench, Target, TrendingUp, Shield } from "lucide-react";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";
import type { Agent, Pod } from "@shared/schema";

export default function Roles() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const { data: pods, isLoading: podsLoading } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const isLoading = agentsLoading || podsLoading;

  const filteredAgents = agents?.filter(agent => {
    const matchesSearch = !searchQuery || 
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.promptText && agent.promptText.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPod = !selectedPod || agent.podName === selectedPod;
    const matchesType = !selectedType || agent.type === selectedType;
    
    return matchesSearch && matchesPod && matchesType;
  });

  // Get unique pod names from agents
  const agentPods = Array.from(new Set(agents?.map(a => a.podName).filter((name): name is string => Boolean(name)) || [])).sort();

  // Calculate counts from actual data
  const dreamTeamCount = agents?.filter(a => a.type === 'dream_team').length || 0;
  const podRoleCount = agents?.filter(a => a.type === 'pod_role').length || 0;
  const totalCount = agents?.length || 0;

  const autonomyLevelLabels: Record<string, string> = {
    'L0': 'L0 - Fully Autonomous',
    'L1': 'L1 - High Autonomy',
    'L2': 'L2 - Medium Autonomy',
    'L3': 'L3 - Human-in-Loop',
  };

  const breadcrumbs = buildBreadcrumbs({ page: "Agents" });

  return (
    <div className="space-y-6">
      <PageBreadcrumb segments={breadcrumbs} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Dream Team Agents</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading agents...' : `${totalCount} AI agents with complete Skill Pack specifications`}
          </p>
        </div>
        <Button onClick={() => setLocation("/agents/new")} data-testid="button-create-agent">
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, title, or mission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <div className="flex flex-col gap-3">
              {/* Type Filter */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type:</span>
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  data-testid="filter-all-types"
                >
                  All Types
                </Button>
                <Button
                  variant={selectedType === 'dream_team' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('dream_team')}
                  data-testid="filter-type-dream-team"
                >
                  Dream Team ({dreamTeamCount})
                </Button>
                <Button
                  variant={selectedType === 'pod_role' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('pod_role')}
                  data-testid="filter-type-pod-role"
                >
                  Pod Roles ({podRoleCount})
                </Button>
              </div>

              {/* Pod Filter */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pod:</span>
                <Button
                  variant={selectedPod === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPod(null)}
                  data-testid="filter-all-pods"
                >
                  All Pods
                </Button>
                {agentPods.map(podName => (
                  <Button
                    key={podName}
                    variant={selectedPod === podName ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPod(podName)}
                    data-testid={`filter-pod-${podName.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {podName}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Collapsible key={agent.id} defaultOpen={false}>
              <div className="role-card" data-pod={agent.podName || undefined} data-testid={`agent-card-${agent.id}`}>
                <div className="pod-rail" />
                <div className="inner">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="title font-bold text-lg flex-1">
                      {agent.id.replace('agent_', '')}
                    </p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <p className="subtitle text-muted-foreground">{agent.title}</p>
                  
                  <div className="chips flex gap-1 mt-2 mb-2">
                    {agent.podName && <span className="pod-chip text-xs px-2 py-0.5 rounded">{agent.podName}</span>}
                    <span className="chip text-xs px-2 py-0.5 rounded">{agent.type === 'dream_team' ? 'Dream Team' : 'Pod Role'}</span>
                    {agent.pillar && <span className="chip text-xs px-2 py-0.5 rounded">{agent.pillar}</span>}
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {autonomyLevelLabels[agent.autonomyLevel] || agent.autonomyLevel}
                    </Badge>
                    {agent.status === 'active' && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                        Active
                      </Badge>
                    )}
                  </div>

                  {agent.promptText && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {agent.promptText}
                    </p>
                  )}

                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {agent.toolsConfig?.tools && agent.toolsConfig.tools.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="h-4 w-4" />
                            <span className="font-medium text-sm">Tools</span>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {agent.toolsConfig.tools.map((tool, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setLocation(`/agents/${agent.id}`)}
                      >
                        View Full Spec
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </div>
            </Collapsible>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No agents found"
          description={searchQuery ? "Try adjusting your search or filters" : "Start by adding your first AI agent"}
        />
      )}
    </div>
  );
}
```

---

## PART 6: DIRECTORY STRUCTURE

```
server/ai/
  actions/
    createWorkItemActionHandler.ts
  schemas/
    agentGovernancePack.ts
    agentLabAcademyPack.ts
    customerJourneyLifecyclePack.ts
    dataStewardshipMetricsPack.ts
    ecomPdpAplusContentPack.ts
    experimentOptimizationPack.ts
    globalCollabsPartnershipPack.ts
    implementationRunbookSopPack.ts
    launchPlanPack.ts
    lifestylePack.ts
    localizationMarketExpansionPack.ts
    packagingPrePressPack.ts
    patentClaimsPack.ts
    pricingMonetizationPack.ts
    productLineSkuTreePack.ts
    retailWholesaleReadinessPack.ts
    riskCompliancePack.ts
    socialCampaignContentCalendarPack.ts
    supportPlaybookKnowledgeBasePack.ts
    websiteAuditPack.ts
  skills/
    generateAgentGovernancePack.json
    generateAgentLabAcademyPack.json
    ... (20 skill JSON files)
  packFactory.ts
  packRegistry.ts
  persistence.ts
  runSkill.ts
  README.md

client/src/pages/
  academy.tsx        # Agent Lab Academy dashboard
  roles.tsx          # Dream Team Agents listing page

shared/
  schema.ts          # Database schema with agents, agent_specs, pods, etc.
```

---

## SUMMARY

### Key Architecture Features:

1. **Unified Agents Table** - Single table for all AI agents (Dream Team + Pod Roles)
2. **Autonomy Levels** - L0 (Fully Autonomous) to L3 (Human-in-Loop)
3. **Pack Registry** - Config-driven system for 20+ AI pack types
4. **Agent Lab Academy** - Training and certification system for agents
5. **Role Cards System** - Visual display of agents with RACI matrix integration

### Technologies:
- **Frontend**: React 18, TypeScript, TanStack Query v5, Wouter, Shadcn UI
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon-backed)
- **AI**: OpenAI GPT-4 for pack generation
