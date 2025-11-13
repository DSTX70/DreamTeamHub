import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  WebsiteAuditPackSchema,
  type WebsiteAuditPack,
} from "../../ai/schemas/websiteAuditPack";
import { saveWebsiteAuditPack } from "../../ai/persistence";

export const postGenerateWebsiteAuditPack = createWorkItemActionHandler<WebsiteAuditPack>({
  skillName: "generateWebsiteAuditPack",
  outputSchema: WebsiteAuditPackSchema,
  persist: saveWebsiteAuditPack,
});
