import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  PatentClaimsPackSchema,
  type PatentClaimsPack,
} from "../../ai/schemas/patentClaimsPack";
import { savePatentClaimsPack } from "../../ai/persistence";

export const postGeneratePatentClaimsPack = createWorkItemActionHandler<PatentClaimsPack>({
  skillName: "generatePatentClaimsPack",
  outputSchema: PatentClaimsPackSchema,
  persist: savePatentClaimsPack,
});
