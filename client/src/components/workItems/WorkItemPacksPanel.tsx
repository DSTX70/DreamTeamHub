import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

type WorkItemPackRow = {
  id: number;
  workItemId: number;
  packType: string;
  version: number;
  packData: any;
  createdAt: string;
};

const PACK_LABELS: Record<string, string> = {
  lifestyle: "Lifestyle Pack",
  patent: "Patent Claims Pack",
  launch: "Launch Plan Pack",
  website_audit: "Website Audit Pack",
  risk_compliance: "Risk & Compliance Pack",
  agent_lab_academy: "Agent Lab Academy Pack",
  agent_governance: "Agent Governance Pack",
  pricing_monetization: "Pricing & Monetization Pack",
  data_stewardship_metrics: "Data Stewardship & Metrics Pack",
  globalcollabs_partnership: "GlobalCollabs Partnership Pack",
  packaging_prepress: "Packaging & Pre-Press Pack",
  product_line_sku_tree: "Product Line & SKU Tree Pack",
  ecom_pdp_aplus_content: "E-Com PDP & A+ Content Pack",
  social_campaign_content_calendar: "Social Campaign & Content Calendar Pack",
  implementation_runbook_sop: "Implementation Runbook & SOP Pack",
  support_playbook_knowledge_base: "Support Playbook & Knowledge Base Pack",
  retail_wholesale_readiness: "Retail & Wholesale Readiness Pack",
  experiment_optimization: "Experiment & Optimization Pack",
  localization_market_expansion: "Localization & Market Expansion Pack",
  customer_journey_lifecycle: "Customer Journey & Lifecycle Pack",
};

type Props = {
  workItemId: number;
};

export function WorkItemPacksPanel({ workItemId }: Props) {
  const { data: packs = [], isLoading, refetch } = useQuery<WorkItemPackRow[]>({
    queryKey: [`/api/work-items/${workItemId}/packs`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Work Item Packs</h2>
        </div>
        <p className="text-xs text-muted-foreground">Loading packs...</p>
      </div>
    );
  }

  if (!packs || packs.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Work Item Packs</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh-packs"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No packs generated yet for this work item. Use the AI Actions above to generate packs.
        </p>
      </div>
    );
  }

  // Group packs by pack type to show all versions
  const packsByType = packs.reduce((acc, pack) => {
    if (!acc[pack.packType]) {
      acc[pack.packType] = [];
    }
    acc[pack.packType].push(pack);
    return acc;
  }, {} as Record<string, WorkItemPackRow[]>);

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Work Item Packs ({packs.length})</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          data-testid="button-refresh-packs"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(packsByType).map(([packType, packVersions]) => {
          const label = PACK_LABELS[packType] ?? packType;
          // Sort versions descending (newest first)
          const sortedVersions = [...packVersions].sort((a, b) => b.version - a.version);
          const latestPack = sortedVersions[0];

          return (
            <details
              key={packType}
              className="rounded-lg border border-border bg-background p-3 hover-elevate"
              open={packType === "lifestyle"} // Auto-open Lifestyle if present
              data-testid={`pack-details-${packType}`}
            >
              <summary className="cursor-pointer text-sm font-medium">
                {label}
                <span className="ml-2 text-xs text-muted-foreground">
                  (v{latestPack.version})
                  {sortedVersions.length > 1 && ` • ${sortedVersions.length} versions`}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(latestPack.createdAt).toLocaleString()}
                </span>
              </summary>

              <div className="mt-3 space-y-3">
                {sortedVersions.map((pack) => (
                  <div key={pack.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Version {pack.version}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pack.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <pre
                      className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs"
                      data-testid={`pack-json-${packType}-v${pack.version}`}
                    >
                      {JSON.stringify(pack.packData, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
