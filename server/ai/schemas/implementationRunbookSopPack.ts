import { z } from "zod";

export const RunbookStepSchema = z.object({
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
  owner_role: z.string(),
  duration_estimate: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  validation_criteria: z.string().optional(),
});

export const SopItemSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "as_needed"]),
  steps: z.array(z.string()),
  owner_role: z.string(),
  estimated_time: z.string().optional(),
});

export const ImplementationRunbookSopPackSchema = z.object({
  overview: z.string(),
  runbook_steps: z.array(RunbookStepSchema),
  sop_items: z.array(SopItemSchema),
  raci_notes: z.string().optional(),
  risks_and_dependencies: z.array(z.string()),
  definition_of_done: z.array(z.string()),
  rollback_plan: z.string().optional(),
});

export type ImplementationRunbookSopPack = z.infer<typeof ImplementationRunbookSopPackSchema>;
