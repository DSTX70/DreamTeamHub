import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  LaunchPlanPackSchema,
  type LaunchPlanPack,
} from "../../ai/schemas/launchPlanPack";
import { saveLaunchPlanPack } from "../../ai/persistence";

export const postGenerateLaunchPlanPack = createWorkItemActionHandler<LaunchPlanPack>({
  skillName: "generateLaunchPlanPack",
  outputSchema: LaunchPlanPackSchema,
  persist: saveLaunchPlanPack,
});
