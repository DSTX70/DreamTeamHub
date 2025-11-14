import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ChevronDown, ChevronUp, PuzzleIcon, MegaphoneIcon, SearchIcon, ShieldIcon, GraduationCapIcon, ScaleIcon, DollarSignIcon, BarChartIcon, HandshakeIcon, PackageIcon, NetworkIcon, ShoppingCartIcon, CalendarIcon, BookOpenIcon, HeadphonesIcon, StoreIcon, FlaskConicalIcon, GlobeIcon, UsersIcon, ImageIcon } from "lucide-react";
import { SavePackToDriveButton } from "../SavePackToDriveButton";

type ActionKey = "lifestyle" | "patent" | "launch" | "audit" | "riskCompliance" | "agentAcademy" | "agentGovernance" | "pricingMonetization" | "dataMetrics" | "globalCollabs" | "packagingPrePress" | "productLineSkuTree" | "ecomPdpAplus" | "socialCampaign" | "implementationRunbook" | "supportPlaybook" | "retailWholesale" | "experimentOptimization" | "localizationMarket" | "customerJourney";
type PackType = "lifestyle" | "patent" | "launch" | "website_audit" | "risk_compliance" | "agent_lab_academy" | "agent_governance" | "pricing_monetization" | "data_stewardship_metrics" | "globalcollabs_partnership" | "packaging_prepress" | "product_line_sku_tree" | "ecom_pdp_aplus_content" | "social_campaign_content_calendar" | "implementation_runbook_sop" | "support_playbook_knowledge_base" | "retail_wholesale_readiness" | "experiment_optimization" | "localization_market_expansion" | "customer_journey_lifecycle";

type ActionStateStatus = "idle" | "running" | "ok" | "error";

interface ActionState {
  status: ActionStateStatus;
  lastRunAt?: string;
}

interface WorkItemActionsPanelProps {
  workItemId: number;
}

const ACTION_CONFIG: Record<
  ActionKey,
  {
    label: string;
    Icon: typeof Sparkles;
    endpointSuffix: string;
    packType: PackType;
  }
> = {
  lifestyle: {
    label: "Generate Lifestyle Pack",
    Icon: Sparkles,
    endpointSuffix: "generate-lifestyle-pack",
    packType: "lifestyle",
  },
  patent: {
    label: "Generate Patent Claims Pack",
    Icon: PuzzleIcon,
    endpointSuffix: "generate-patent-claims-pack",
    packType: "patent",
  },
  launch: {
    label: "Generate Launch Plan Pack",
    Icon: MegaphoneIcon,
    endpointSuffix: "generate-launch-plan-pack",
    packType: "launch",
  },
  audit: {
    label: "Generate Website Audit Pack",
    Icon: SearchIcon,
    endpointSuffix: "generate-website-audit-pack",
    packType: "website_audit",
  },
  riskCompliance: {
    label: "Generate Risk & Compliance Pack",
    Icon: ShieldIcon,
    endpointSuffix: "generate-risk-compliance-pack",
    packType: "risk_compliance",
  },
  agentAcademy: {
    label: "Generate Agent Lab Academy Pack",
    Icon: GraduationCapIcon,
    endpointSuffix: "generate-agent-lab-academy-pack",
    packType: "agent_lab_academy",
  },
  agentGovernance: {
    label: "Generate Agent Governance Pack",
    Icon: ScaleIcon,
    endpointSuffix: "generate-agent-governance-pack",
    packType: "agent_governance",
  },
  pricingMonetization: {
    label: "Generate Pricing & Monetization Pack",
    Icon: DollarSignIcon,
    endpointSuffix: "generate-pricing-monetization-pack",
    packType: "pricing_monetization",
  },
  dataMetrics: {
    label: "Generate Data Stewardship & Metrics Pack",
    Icon: BarChartIcon,
    endpointSuffix: "generate-data-stewardship-metrics-pack",
    packType: "data_stewardship_metrics",
  },
  globalCollabs: {
    label: "Generate GlobalCollabs Partnerships Pack",
    Icon: HandshakeIcon,
    endpointSuffix: "generate-globalcollabs-partnership-pack",
    packType: "globalcollabs_partnership",
  },
  packagingPrePress: {
    label: "Generate Packaging & Pre-Press Pack",
    Icon: PackageIcon,
    endpointSuffix: "generate-packaging-pre-press-pack",
    packType: "packaging_prepress",
  },
  productLineSkuTree: {
    label: "Generate Product Line Architecture & SKU Tree Pack",
    Icon: NetworkIcon,
    endpointSuffix: "generate-product-line-sku-tree-pack",
    packType: "product_line_sku_tree",
  },
  ecomPdpAplus: {
    label: "Generate E-Com PDP & A+ Content Pack",
    Icon: ShoppingCartIcon,
    endpointSuffix: "generate-ecom-pdp-aplus-content-pack",
    packType: "ecom_pdp_aplus_content",
  },
  socialCampaign: {
    label: "Generate Social Campaign & Content Calendar Pack",
    Icon: CalendarIcon,
    endpointSuffix: "generate-social-campaign-content-calendar-pack",
    packType: "social_campaign_content_calendar",
  },
  implementationRunbook: {
    label: "Generate Implementation Runbook & SOP Pack",
    Icon: BookOpenIcon,
    endpointSuffix: "generate-implementation-runbook-sop-pack",
    packType: "implementation_runbook_sop",
  },
  supportPlaybook: {
    label: "Generate Support Playbook & Knowledge Base Pack",
    Icon: HeadphonesIcon,
    endpointSuffix: "generate-support-playbook-knowledge-base-pack",
    packType: "support_playbook_knowledge_base",
  },
  retailWholesale: {
    label: "Generate Retail & Wholesale Readiness Pack",
    Icon: StoreIcon,
    endpointSuffix: "generate-retail-wholesale-readiness-pack",
    packType: "retail_wholesale_readiness",
  },
  experimentOptimization: {
    label: "Generate Experiment & Optimization Pack",
    Icon: FlaskConicalIcon,
    endpointSuffix: "generate-experiment-optimization-pack",
    packType: "experiment_optimization",
  },
  localizationMarket: {
    label: "Generate Localization & Market Expansion Pack",
    Icon: GlobeIcon,
    endpointSuffix: "generate-localization-market-expansion-pack",
    packType: "localization_market_expansion",
  },
  customerJourney: {
    label: "Generate Customer Journey & Lifecycle Pack",
    Icon: UsersIcon,
    endpointSuffix: "generate-customer-journey-lifecycle-pack",
    packType: "customer_journey_lifecycle",
  },
};

export function WorkItemActionsPanel({ workItemId }: WorkItemActionsPanelProps) {
  const [open, setOpen] = useState(false);
  const [actionState, setActionState] = useState<Record<ActionKey, ActionState>>({
    lifestyle: { status: "idle" },
    patent: { status: "idle" },
    launch: { status: "idle" },
    audit: { status: "idle" },
    riskCompliance: { status: "idle" },
    agentAcademy: { status: "idle" },
    agentGovernance: { status: "idle" },
    pricingMonetization: { status: "idle" },
    dataMetrics: { status: "idle" },
    globalCollabs: { status: "idle" },
    packagingPrePress: { status: "idle" },
    productLineSkuTree: { status: "idle" },
    ecomPdpAplus: { status: "idle" },
    socialCampaign: { status: "idle" },
    implementationRunbook: { status: "idle" },
    supportPlaybook: { status: "idle" },
    retailWholesale: { status: "idle" },
    experimentOptimization: { status: "idle" },
    localizationMarket: { status: "idle" },
    customerJourney: { status: "idle" },
  });
  const [isGeneratingHeroes, setIsGeneratingHeroes] = useState(false);
  const { toast } = useToast();

  async function runAction(key: ActionKey) {
    const cfg = ACTION_CONFIG[key];
    const now = new Date().toISOString();

    setActionState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: "running" },
    }));

    try {
      const res = await fetch(
        `/api/work-items/${workItemId}/actions/${cfg.endpointSuffix}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.message || error.error || `Status ${res.status}`);
      }

      setActionState((prev) => ({
        ...prev,
        [key]: { status: "ok", lastRunAt: now },
      }));

      toast({
        title: "Action completed",
        description: `${cfg.label} completed successfully`,
      });
    } catch (err: any) {
      console.error("Failed to run WI action", key, err);
      setActionState((prev) => ({
        ...prev,
        [key]: { status: "error", lastRunAt: now },
      }));

      toast({
        title: "Action failed",
        description: err.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  }

  function formatLastRun(lastRunAt?: string): string {
    if (!lastRunAt) return "Never run";
    const d = new Date(lastRunAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusBadgeVariant(status: ActionStateStatus) {
    switch (status) {
      case "ok":
        return "default";
      case "error":
        return "destructive";
      case "running":
        return "secondary";
      default:
        return "outline";
    }
  }

  function getStatusLabel(status: ActionStateStatus): string {
    const labelMap: Record<ActionStateStatus, string> = {
      idle: "Idle",
      running: "Running…",
      ok: "Last run OK",
      error: "Last run failed",
    };
    return labelMap[status];
  }

  async function handleGenerateLifestyleHeroes() {
    try {
      setIsGeneratingHeroes(true);

      const res = await fetch(
        `/api/work-items/${workItemId}/generate-lifestyle-heroes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dryRun: false,
            overwrite: false,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.error === "LIFESTYLE_PACK_NOT_FOUND") {
          toast({
            title: "Lifestyle Pack not found",
            description:
              "Run Lifestyle Pack v2 for this Work Item before generating hero images.",
            variant: "destructive",
          });
          return;
        }

        if (data.error === "INVALID_REQUEST") {
          toast({
            title: "Invalid request",
            description:
              "Check shot selection or options and try again. See console for details.",
            variant: "destructive",
          });
          console.error("generate-lifestyle-heroes INVALID_REQUEST", data);
          return;
        }

        toast({
          title: "Couldn't generate lifestyle images",
          description:
            "Something went wrong on the server. Try again or contact the dev pod.",
          variant: "destructive",
        });
        console.error("generate-lifestyle-heroes error", data);
        return;
      }

      const result = data;
      const created = result.generated ?? [];
      const skipped = result.skippedExisting ?? [];

      const allShotIds = Array.from(
        new Set([
          ...created.map((g: any) => g.shot_id),
          ...skipped.map((s: any) => s.shot_id),
        ])
      );
      const shotList = allShotIds.join(", ");
      const createdCount = created.length;
      const skippedCount = skipped.length;

      let description: string;
      if (createdCount > 0 && skippedCount === 0) {
        description = `Created ${createdCount} images across ${allShotIds.length} shots (${shotList}). Validate them in SKU Switcher.`;
      } else if (createdCount > 0 && skippedCount > 0) {
        description = `Created ${createdCount} images and skipped ${skippedCount} existing images across ${allShotIds.length} shots (${shotList}). Validate them in SKU Switcher.`;
      } else if (skippedCount > 0) {
        description = `All ${skippedCount} images already exist across ${allShotIds.length} shots (${shotList}). Validate them in SKU Switcher.`;
      } else {
        description = `No new images created. All targets already exist.`;
      }

      toast({
        title: "Lifestyle heroes generated",
        description,
      });
    } catch (err) {
      console.error("generate-lifestyle-heroes exception", err);
      toast({
        title: "Couldn't generate lifestyle images",
        description:
          "Unexpected error. Try again or contact the dev pod with console details.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingHeroes(false);
    }
  }

  return (
    <div className="wi-actions-panel" data-testid="work-item-actions-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Actions
        </span>
        <Button
          type="button"
          onClick={() => setOpen((v) => !v)}
          variant="outline"
          size="sm"
          data-testid="button-toggle-actions"
        >
          <span>Run</span>
          {open ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      </div>

      {open && (
        <div className="mt-2 rounded-md border bg-card p-2 text-sm space-y-4">
          <div className="space-y-0">
            {(Object.keys(ACTION_CONFIG) as ActionKey[]).map((key) => {
              const cfg = ACTION_CONFIG[key];
              const state = actionState[key];
              const isRunning = state.status === "running";
              const Icon = cfg.Icon;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0"
                  data-testid={`action-row-${key}`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{cfg.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(state.status)} className="text-xs">
                        {getStatusLabel(state.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatLastRun(state.lastRunAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => runAction(key)}
                      disabled={isRunning}
                      variant="outline"
                      size="sm"
                      data-testid={`button-run-${key}`}
                    >
                      {isRunning ? "Running…" : "Run"}
                    </Button>
                    {state.status === "ok" && (
                      <SavePackToDriveButton
                        workItemId={workItemId}
                        packType={cfg.packType}
                        variant="outline"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <ImageIcon className="h-4 w-4 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">Generate Lifestyle Hero Images</div>
                <p className="text-xs text-muted-foreground mb-3">
                  Uses Lifestyle Pack v2 to create Desktop, Tablet, and Mobile heroes for this Work Item.
                </p>
                <Button
                  type="button"
                  onClick={handleGenerateLifestyleHeroes}
                  disabled={isGeneratingHeroes}
                  variant="secondary"
                  size="sm"
                  data-testid="button-generate-lifestyle-heroes"
                >
                  {isGeneratingHeroes ? "Generating…" : "Generate Lifestyle Hero Images"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
