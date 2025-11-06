import { z } from "zod";

// Agent IDs are text handles like 'agent_os', 'agent_helm', NOT UUIDs
export const AgentId = z.string().min(1, "agent ID required").max(255, "agent ID too long");

export const AgentPromoteBody = z.object({
  advance: z.number().int().min(1).max(3).optional().default(1),
  note: z.string().max(2000, "note too long (max 2000 chars)").optional(),
});

export type AgentPromoteBody = z.infer<typeof AgentPromoteBody>;
