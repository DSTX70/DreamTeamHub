import { z } from "zod";
import { LifestylePackSchema } from "./schemas/lifestylePack";
import { PatentClaimsPackSchema } from "./schemas/patentClaimsPack";
import { LaunchPlanPackSchema } from "./schemas/launchPlanPack";
import { WebsiteAuditPackSchema } from "./schemas/websiteAuditPack";
import { RiskCompliancePackSchema } from "./schemas/riskCompliancePack";
import { AgentLabAcademyPackSchema } from "./schemas/agentLabAcademyPack";
import { AgentGovernancePackSchema } from "./schemas/agentGovernancePack";
import { PricingMonetizationPackSchema } from "./schemas/pricingMonetizationPack";
import { DataStewardshipMetricsPackSchema } from "./schemas/dataStewardshipMetricsPack";
import { GlobalCollabsPartnershipPackSchema } from "./schemas/globalCollabsPartnershipPack";
import { PackagingPrePressPackSchema } from "./schemas/packagingPrePressPack";
import { ProductLineSkuTreePackSchema } from "./schemas/productLineSkuTreePack";
import { EcomPdpAplusContentPackSchema } from "./schemas/ecomPdpAplusContentPack";
import { SocialCampaignContentCalendarPackSchema } from "./schemas/socialCampaignContentCalendarPack";
import { ImplementationRunbookSopPackSchema } from "./schemas/implementationRunbookSopPack";
import { SupportPlaybookKnowledgeBasePackSchema } from "./schemas/supportPlaybookKnowledgeBasePack";
import { RetailWholesaleReadinessPackSchema } from "./schemas/retailWholesaleReadinessPack";
import { ExperimentOptimizationPackSchema } from "./schemas/experimentOptimizationPack";
import { LocalizationMarketExpansionPackSchema } from "./schemas/localizationMarketExpansionPack";
import { CustomerJourneyLifecyclePackSchema } from "./schemas/customerJourneyLifecyclePack";
import type { LucideIcon } from "lucide-react";

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
    packType: "lifestyle_banner",
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
    packType: "patent_claims",
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
    packType: "launch_plan",
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
  
  // New Governance/Ops Packs
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
  
  // Brand/Creative Lane Packs
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
  
  // Ops Lane Packs
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
    icon: "Headphones",
    driveFolder: "DRIVE_SUPPORT_PLAYBOOK_KNOWLEDGE_BASE_PACKS_FOLDER",
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
  
  // Data Lane Pack
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
  
  // Market Expansion Lane Packs
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
    icon: "Users",
    driveFolder: "DRIVE_CUSTOMER_JOURNEY_LIFECYCLE_PACKS_FOLDER",
    exportEnabled: true,
    category: "expansion",
  },
];

// Helper to find pack config by various identifiers
export function getPackConfig(identifier: string): PackConfig | undefined {
  return PACK_REGISTRY.find(
    (p) => p.id === identifier || p.packType === identifier || p.skillName === identifier
  );
}

// Extract all pack types for type unions
export const PACK_TYPES = PACK_REGISTRY.map((p) => p.packType) as [string, ...string[]];

// Type-safe pack type union
export type PackType = (typeof PACK_TYPES)[number];
