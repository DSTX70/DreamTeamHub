import { z } from "zod";

export const ExperimentSchema = z.object({
  id: z.string(),
  hypothesis: z.string(),
  metric: z.string(),
  variant_a_description: z.string(),
  variant_b_description: z.string(),
  guardrails: z.array(z.string()).optional(),
  sample_size_hint: z.string().optional(),
  duration_hint: z.string().optional(),
  success_criteria: z.string().optional(),
});

export const ExperimentOptimizationPackSchema = z.object({
  overview: z.string(),
  experiments: z.array(ExperimentSchema),
  logging_annotation_plan: z.string(),
  statistical_approach: z.string().optional(),
  rollout_plan: z.string().optional(),
  followup_work_item_ideas: z.array(z.string()).optional(),
});

export type ExperimentOptimizationPack = z.infer<typeof ExperimentOptimizationPackSchema>;
