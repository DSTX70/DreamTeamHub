import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  LifestylePackSchema,
  type LifestylePack,
} from "../../ai/schemas/lifestylePack";
import { saveLifestylePackArtifacts } from "../../ai/persistence";

export const postGenerateLifestylePack = createWorkItemActionHandler<LifestylePack>({
  skillName: "generateLifestyleBannerPack",
  outputSchema: LifestylePackSchema,
  persist: saveLifestylePackArtifacts,
});
