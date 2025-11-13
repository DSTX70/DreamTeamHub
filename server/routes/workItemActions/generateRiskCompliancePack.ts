import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  RiskCompliancePackSchema,
  type RiskCompliancePack,
} from "../../ai/schemas/riskCompliancePack";
import { saveRiskCompliancePackArtifacts } from "../../ai/persistence";

export const postGenerateRiskCompliancePack =
  createWorkItemActionHandler<RiskCompliancePack>({
    skillName: "generateRiskCompliancePack",
    outputSchema: RiskCompliancePackSchema,
    persist: saveRiskCompliancePackArtifacts,
  });
