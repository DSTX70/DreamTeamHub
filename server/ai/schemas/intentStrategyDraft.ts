import { z } from "zod";

export const IntentStrategyDraftSchema = z.object({
  repo: z.string().min(1),
  intentBlock: z.string().min(1),
  strategyBlock: z.string().min(1),
  evidenceRequest: z.string().min(1),

  fileFetchPaths: z.array(z.string().min(1)).max(20).default([]),

  meta: z
    .object({
      confidence: z.number().min(0).max(1).default(0.5),
      assumptions: z.array(z.string()).default([]),
      blockers: z.array(z.string()).default([]),
    })
    .default({ confidence: 0.5, assumptions: [], blockers: [] }),
});

export type IntentStrategyDraft = z.infer<typeof IntentStrategyDraftSchema>;
