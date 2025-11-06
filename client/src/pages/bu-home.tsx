import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Link } from "wouter";
import type { Brand, KnowledgeLink } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BrandDetailsModal } from "@/components/brand-details-modal";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";
import AcademySidebar from "@/components/AcademySidebar";
import { KnowledgeModals } from "@/components/knowledge-modals";
import BuMiniAnalytics from "@/components/BuMiniAnalytics";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type BUConfig = {
  name: string;
  mission: string;
  owners: string[];
  cadence: string;
};

const buConfigs: Record<string, BUConfig> = {
  IMAGINATION: {
    name: "IMAGINATION",
    mission: "Create, publish, and amplify stories and experiences that move people.",
    owners: ["Lume (UX)", "AI Lab & Academy", "App Dev"],
    cadence: "Weekly reviews — Fridays",
  },
  INNOVATION: {
    name: "INNOVATION",
    mission: "Build intelligent systems that amplify human potential and creativity.",
    owners: ["Product Strategy", "Engineering", "AI Research"],
    cadence: "Sprint reviews — Bi-weekly",
  },
  IMPACT: {
    name: "IMPACT",
    mission: "Drive meaningful connections and positive change through thoughtful products.",
    owners: ["Creative Direction", "Marketing", "Community"],
    cadence: "Monthly reviews — First Monday",
  },
};

type AgentSummary = {
  name: string;
  display_name: string;
  autonomy_level: "L0" | "L1" | "L2" | "L3";
  status: "pilot" | "live" | "watch" | "rollback";
  next_gate: number | null;
  task_success: number;
  latency_p95_s: number;
  cost_per_task_usd: number;
};

export default function BUHomePage() {
  const [, params] = useRoute("/bu/:slug");
  const [, setLocation] = useLocation();
  const buSlug = params?.slug?.toUpperCase() || "IMAGINATION";
  const config = buConfigs[buSlug] || buConfigs.IMAGINATION;
  const [brandFilter, setBrandFilter] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch brands for this BU
  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands", buSlug],
    queryFn: async () => {
      const res = await fetch(`/api/brands?bu=${buSlug}`);
      if (!res.ok) throw new Error("Failed to fetch brands");
      return res.json();
    },
  });

  // Fetch agents for this BU
  const { data: agents = [], isLoading: agentsLoading } = useQuery<AgentSummary[]>({
    queryKey: ["/api/agents/summary", buSlug],
    queryFn: async () => {
      const res = await fetch(`/api/agents/summary?bu=${buSlug}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  // Fetch knowledge links for this BU
  const { data: knowledgeLinks = [], isLoading: knowledgeLoading } = useQuery<KnowledgeLink[]>({
    queryKey: ["/api/knowledge/links", buSlug],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/links?owner=BU&id=${buSlug}`);
      if (!res.ok) throw new Error("Failed to fetch knowledge links");
      return res.json();
    },
  });

  // Calculate dashboard stats from agents
  const avgSuccess = agents.length > 0
    ? Math.round(agents.reduce((sum, a) => sum + (a.task_success || 0), 0) / agents.length)
    : 0;
  const avgP95 = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a.latency_p95_s || 0), 0) / agents.length).toFixed(2)
    : "0.00";
  const medianCost = agents.length > 0
    ? agents.map(a => a.cost_per_task_usd || 0).sort((a, b) => a - b)[Math.floor(agents.length / 2)]?.toFixed(3) || "0.000"
    : "0.000";

  // Filter brands
  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandFilter.toLowerCase())
  );

  const getStatusBadgeTone = (status: string): "default" | "green" | "amber" | "red" => {
    if (status === "live") return "green";
    if (status === "pilot" || status === "watch") return "amber";
    if (status === "rollback") return "red";
    return "default";
  };

  const getRoleBadgeTone = (role: string): "default" | "green" | "amber" | "blue" => {
    if (role === "publish") return "green";
    if (role === "draft") return "amber";
    if (role === "read") return "blue";
    return "default";
  };

  const breadcrumbs = buildBreadcrumbs({
    businessUnit: { slug: buSlug, name: config.name },
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
      await queryClient.invalidateQueries({ queryKey: ["/api/agents/summary", buSlug] });
      
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

  // Pick first agent for sidebar (or null if no agents)
  const featuredAgent = agents.length > 0 ? agents[0] : null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <PageBreadcrumb segments={breadcrumbs} />
      </div>

      {/* Two-column layout: Main content + Academy Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-bu-name">{config.name}</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-bu-mission">{config.mission}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>
                  <b>Owners:</b> {config.owners.join(", ")}
                </span>
                <span>•</span>
                <span>
                  <b>Cadence:</b> {config.cadence}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" data-testid="button-new-work-order">
                <Link href="/work-orders/new">+ New Work Order</Link>
              </Button>
              <Button asChild variant="outline" size="sm" data-testid="button-new-project">
                <Link href="/projects/new">+ New Project</Link>
              </Button>
              <Button asChild variant="outline" size="sm" data-testid="button-open-copilot">
                <Link href="/copilot">Open Copilot</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
          </Card>

          {/* Brands grid */}
          <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Brands</h2>
          <Input
            className="max-w-xs"
            placeholder="Filter brands…"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            data-testid="input-filter-brands"
          />
        </div>
        {brandsLoading ? (
          <div className="text-sm text-muted-foreground">Loading brands...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBrands.map((brand) => (
              <Card
                key={brand.id}
                className="hover-elevate transition-all cursor-pointer"
                data-testid={`card-brand-${brand.slug}`}
                onClick={() => {
                  setSelectedBrand(brand);
                  setIsBrandModalOpen(true);
                }}
              >
                <CardHeader>
                  <div className="font-medium" data-testid={`text-brand-name-${brand.slug}`}>
                    {brand.name}
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div>
                    Products: <b data-testid={`text-products-${brand.slug}`}>{brand.products}</b>
                  </div>
                  <div>
                    Active projects: <b data-testid={`text-projects-${brand.slug}`}>{brand.projects}</b>
                  </div>
                  <div>
                    Due this week: <b data-testid={`text-due-${brand.slug}`}>{brand.dueThisWeek}</b>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </section>

          <div className="grid lg:grid-cols-3 gap-6">
        {/* Roster & Pods */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Roster & Pods</h2>
              <Button asChild variant="ghost" size="sm" data-testid="button-open-academy">
                <Link href="/academy">Open Academy</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading agents...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {agents.slice(0, 5).map((agent, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card"
                    data-testid={`agent-chip-${i}`}
                  >
                    <span className="text-sm">{agent.display_name}</span>
                    <Badge variant="outline" data-testid={`badge-level-${i}`}>
                      {agent.autonomy_level}
                    </Badge>
                    <Badge
                      variant={getStatusBadgeTone(agent.status) as any}
                      data-testid={`badge-status-${i}`}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" data-testid="button-promotion-board">
                <Link href="/academy/promotions">Promotion Board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge */}
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">Knowledge</h2>
            <p className="text-sm text-muted-foreground">
              Google Drive: <b>Read • Draft • Publish (gated)</b>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {knowledgeLoading ? (
              <div className="text-sm text-muted-foreground">Loading links...</div>
            ) : (
              <div className="space-y-2">
                {knowledgeLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    data-testid={`knowledge-link-${link.id}`}
                  >
                    <div>
                      <div className="font-medium text-sm">{link.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Folder ID: {link.driveFolderId}
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeTone(link.role) as any}>{link.role}</Badge>
                  </div>
                ))}
              </div>
            )}
            <KnowledgeModals
              ownerType="bu"
              ownerId={buSlug}
              scope={buSlug}
            />
          </CardContent>
        </Card>
          </div>

          {/* Dashboards */}
          <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Dashboards</h2>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Avg success%</div>
                <div className="text-2xl font-semibold" data-testid="text-avg-success">
                  {avgSuccess}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">p95 (s)</div>
                <div className="text-2xl font-semibold" data-testid="text-p95">
                  {avgP95}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Median cost ($)</div>
                <div className="text-2xl font-semibold" data-testid="text-median-cost">
                  ${medianCost}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Attention</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="green" data-testid="badge-attention-low">
                    Low 0
                  </Badge>
                  <Badge variant="amber" data-testid="badge-attention-medium">
                    Medium 0
                  </Badge>
                  <Badge variant="red" data-testid="badge-attention-high">
                    High 0
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Operations Mini Analytics */}
          <div className="mt-4">
            <BuMiniAnalytics buId={buSlug.toUpperCase()} />
          </div>
        </CardContent>
          </Card>

          {/* Activity */}
          <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Button asChild variant="ghost" size="sm" data-testid="button-view-logs">
              <Link href="/ops/logs">View all logs</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Recent activity will appear here as Work Orders run and agents are promoted.
          </div>
        </CardContent>
          </Card>
        </div>
        {/* End Main content */}

        {/* Academy Sidebar */}
        {featuredAgent && (
          <aside className="lg:w-80 flex-shrink-0">
            <AcademySidebar
              agent={{
                id: featuredAgent.name,
                name: featuredAgent.display_name,
                autonomy: featuredAgent.autonomy_level,
                status: featuredAgent.status,
                nextGate: featuredAgent.next_gate,
              }}
              onTrainClick={handleTrainClick}
              onPromote={handlePromote}
            />
          </aside>
        )}
      </div>

      {/* Brand Details Modal */}
      <BrandDetailsModal 
        brand={selectedBrand}
        open={isBrandModalOpen}
        onOpenChange={setIsBrandModalOpen}
      />
    </div>
  );
}
