import { makeProvider } from "../../shared/llm/providers";
import type { LLMConfig } from "../../shared/llm/types";
import { maybeAugmentUserPromptWithPilotCContext } from "./context/pilotC_gigsterGarageContext";

import draftIntentStrategySkill from "./skills/draftIntentStrategy.json";
import generateAgentGovernancePackSkill from "./skills/generateAgentGovernancePack.json";
import generateAgentLabAcademyPackSkill from "./skills/generateAgentLabAcademyPack.json";
import generateCustomerJourneyLifecyclePackSkill from "./skills/generateCustomerJourneyLifecyclePack.json";
import generateDataStewardshipMetricsPackSkill from "./skills/generateDataStewardshipMetricsPack.json";
import generateEcomPdpAplusContentPackSkill from "./skills/generateEcomPdpAplusContentPack.json";
import generateExperimentOptimizationPackSkill from "./skills/generateExperimentOptimizationPack.json";
import generateGlobalCollabsPartnershipPackSkill from "./skills/generateGlobalCollabsPartnershipPack.json";
import generateImplementationRunbookSopPackSkill from "./skills/generateImplementationRunbookSopPack.json";
import generateLaunchPlanPackSkill from "./skills/generateLaunchPlanPack.json";
import generateLifestyleBannerPackSkill from "./skills/generateLifestyleBannerPack.json";
import generateLocalizationMarketExpansionPackSkill from "./skills/generateLocalizationMarketExpansionPack.json";
import generatePackagingPrePressPackSkill from "./skills/generatePackagingPrePressPack.json";
import generatePatchDropSkill from "./skills/generatePatchDrop.json";
import generatePatentClaimsPackSkill from "./skills/generatePatentClaimsPack.json";
import generatePricingMonetizationPackSkill from "./skills/generatePricingMonetizationPack.json";
import generateProductLineSkuTreePackSkill from "./skills/generateProductLineSkuTreePack.json";
import generateRetailWholesaleReadinessPackSkill from "./skills/generateRetailWholesaleReadinessPack.json";
import generateRiskCompliancePackSkill from "./skills/generateRiskCompliancePack.json";
import generateSocialCampaignContentCalendarPackSkill from "./skills/generateSocialCampaignContentCalendarPack.json";
import generateSupportPlaybookKnowledgeBasePackSkill from "./skills/generateSupportPlaybookKnowledgeBasePack.json";
import generateWebsiteAuditPackSkill from "./skills/generateWebsiteAuditPack.json";

const SKILL_REGISTRY: Record<string, SkillDefinition> = {
  draftIntentStrategy: draftIntentStrategySkill as SkillDefinition,
  generateAgentGovernancePack: generateAgentGovernancePackSkill as SkillDefinition,
  generateAgentLabAcademyPack: generateAgentLabAcademyPackSkill as SkillDefinition,
  generateCustomerJourneyLifecyclePack: generateCustomerJourneyLifecyclePackSkill as SkillDefinition,
  generateDataStewardshipMetricsPack: generateDataStewardshipMetricsPackSkill as SkillDefinition,
  generateEcomPdpAplusContentPack: generateEcomPdpAplusContentPackSkill as SkillDefinition,
  generateExperimentOptimizationPack: generateExperimentOptimizationPackSkill as SkillDefinition,
  generateGlobalCollabsPartnershipPack: generateGlobalCollabsPartnershipPackSkill as SkillDefinition,
  generateImplementationRunbookSopPack: generateImplementationRunbookSopPackSkill as SkillDefinition,
  generateLaunchPlanPack: generateLaunchPlanPackSkill as SkillDefinition,
  generateLifestyleBannerPack: generateLifestyleBannerPackSkill as SkillDefinition,
  generateLocalizationMarketExpansionPack: generateLocalizationMarketExpansionPackSkill as SkillDefinition,
  generatePackagingPrePressPack: generatePackagingPrePressPackSkill as SkillDefinition,
  generatePatchDrop: generatePatchDropSkill as SkillDefinition,
  generatePatentClaimsPack: generatePatentClaimsPackSkill as SkillDefinition,
  generatePricingMonetizationPack: generatePricingMonetizationPackSkill as SkillDefinition,
  generateProductLineSkuTreePack: generateProductLineSkuTreePackSkill as SkillDefinition,
  generateRetailWholesaleReadinessPack: generateRetailWholesaleReadinessPackSkill as SkillDefinition,
  generateRiskCompliancePack: generateRiskCompliancePackSkill as SkillDefinition,
  generateSocialCampaignContentCalendarPack: generateSocialCampaignContentCalendarPackSkill as SkillDefinition,
  generateSupportPlaybookKnowledgeBasePack: generateSupportPlaybookKnowledgeBasePackSkill as SkillDefinition,
  generateWebsiteAuditPack: generateWebsiteAuditPackSkill as SkillDefinition,
};

interface SkillDefinition {
  name: string;
  description: string;
  system_prompt: string;
  input_schema: any;
  output_schema?: any;
}

interface RunSkillOptions {
  skillName: string;
  input: Record<string, any>;
  provider?: string;
  model?: string;
}

function loadSkillDefinition(skillName: string): SkillDefinition {
  const skill = SKILL_REGISTRY[skillName];
  if (!skill) {
    throw new Error(`Failed to load skill "${skillName}": not found in registry. Available: ${Object.keys(SKILL_REGISTRY).join(", ")}`);
  }
  return skill;
}

export async function runSkill(options: RunSkillOptions): Promise<any> {
  const { skillName, input, provider = "openai", model } = options;

  const skill = loadSkillDefinition(skillName);

  const llmConfig: LLMConfig = {
    provider: provider as any,
    model: model || (provider === "openai" ? "gpt-4o" : "gpt-4o-mini"),
  };

  const llmProvider = makeProvider(llmConfig);

  const baseUserPrompt = `Work Item Input:\n${JSON.stringify(input, null, 2)}\n\nRespond with JSON ONLY matching the output schema.`;

  const userPrompt = await maybeAugmentUserPromptWithPilotCContext(baseUserPrompt, {
    skillName,
    input,
  });

  const fullPrompt = `${skill.system_prompt}\n\n${userPrompt}`;

  const response = await llmProvider.infer({
    prompt: fullPrompt,
    temperature: 0.7,
    max_tokens: 8000,
  });

  const jsonMatch = response.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}
