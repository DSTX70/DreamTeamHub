import { z } from "zod";

export const UUID = z.string().uuid("invalid UUID");

export const AgentPromoteBody = z.object({
  advance: z.number().int().min(1).max(3).optional().default(1),
  note: z.string().max(2000, "note too long (max 2000 chars)").optional(),
});

export type AgentPromoteBody = z.infer<typeof AgentPromoteBody>;
