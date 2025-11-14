import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, ExternalLink } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

type PackType = 
  | "lifestyle" 
  | "patent" 
  | "launch" 
  | "website_audit" 
  | "risk_compliance" 
  | "agent_lab_academy"
  | "agent_governance"
  | "pricing_monetization"
  | "data_stewardship_metrics"
  | "globalcollabs_partnership"
  | "packaging_prepress"
  | "product_line_sku_tree"
  | "ecom_pdp_aplus_content"
  | "social_campaign_content_calendar"
  | "implementation_runbook_sop"
  | "support_playbook_knowledge_base"
  | "retail_wholesale_readiness"
  | "experiment_optimization"
  | "localization_market_expansion"
  | "customer_journey_lifecycle";

interface SavePackToDriveButtonProps {
  workItemId: number;
  packType: PackType;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const packTypeLabels: Record<PackType, string> = {
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

export function SavePackToDriveButton({
  workItemId,
  packType,
  disabled = false,
  variant = "outline",
  size = "sm",
}: SavePackToDriveButtonProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    driveFileId: string;
    fileName: string;
    webViewLink: string;
  }> | null>(null);

  const handleSaveToDrive = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/work-items/${workItemId}/packs/${packType}/save-to-drive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save to Drive");
      }

      const data = await response.json();
      setUploadedFiles(data.files);

      // Invalidate queries to refresh Drive files list
      await queryClient.invalidateQueries({
        queryKey: [`/api/work-items/${workItemId}/drive-files`],
      });

      toast({
        title: "Saved to Drive",
        description: `${packTypeLabels[packType]} v${data.packVersion} uploaded (${data.filesUploaded} file${data.filesUploaded > 1 ? "s" : ""})`,
      });
    } catch (error: any) {
      console.error("Error saving to Drive:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save pack to Google Drive",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleSaveToDrive}
        disabled={disabled || isSaving}
        data-testid={`button-save-${packType}-to-drive`}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Save to Drive
          </>
        )}
      </Button>

      {uploadedFiles && uploadedFiles.length > 0 && (
        <div className="flex flex-col gap-1 text-sm">
          {uploadedFiles.map((file) => (
            <a
              key={file.driveFileId}
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
              data-testid={`link-drive-file-${file.driveFileId}`}
            >
              <ExternalLink className="w-3 h-3" />
              {file.fileName}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
