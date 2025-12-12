import { generateDthPersonaRegistryPack } from "./skills/generateDthPersonaRegistryPack";
import { generateDthPodActivationRaciPack } from "./skills/generateDthPodActivationRaciPack";
import { generateDthAgentLabBoundaryPack } from "./skills/generateDthAgentLabBoundaryPack";
import { generateDthMonetizationPackagingPack } from "./skills/generateDthMonetizationPackagingPack";
import { generateDthGovernanceChangeLogPack } from "./skills/generateDthGovernanceChangeLogPack";

export const fileBasedSkillRunners: Record<string, (args?: any) => Promise<any>> = {
  generateDthPersonaRegistryPack,
  generateDthPodActivationRaciPack,
  generateDthAgentLabBoundaryPack,
  generateDthMonetizationPackagingPack,
  generateDthGovernanceChangeLogPack,
};

export function isFileBasedSkill(skillName: string): boolean {
  return skillName in fileBasedSkillRunners;
}

export async function runFileBasedSkill(skillName: string, args?: any): Promise<any> {
  const runner = fileBasedSkillRunners[skillName];
  if (!runner) {
    throw new Error(`File-based skill not found: ${skillName}`);
  }
  return runner(args);
}
