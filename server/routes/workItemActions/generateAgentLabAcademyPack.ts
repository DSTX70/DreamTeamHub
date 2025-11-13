import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  AgentLabAcademyPackSchema,
  type AgentLabAcademyPack,
} from "../../ai/schemas/agentLabAcademyPack";
import { saveAgentLabAcademyPackArtifacts } from "../../ai/persistence";

export const postGenerateAgentLabAcademyPack =
  createWorkItemActionHandler<AgentLabAcademyPack>({
    skillName: "generateAgentLabAcademyPack",
    outputSchema: AgentLabAcademyPackSchema,
    persist: saveAgentLabAcademyPackArtifacts,
  });
