import { z } from "zod";

export const TargetMarketSchema = z.object({
  code: z.string(),
  name: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  rationale: z.string(),
  market_size_hint: z.string().optional(),
});

export const ContentScopeSchema = z.object({
  must_translate: z.array(z.string()),
  nice_to_translate: z.array(z.string()).optional(),
  never_translate: z.array(z.string()).optional(),
});

export const LegalCheckItemSchema = z.object({
  market_code: z.string(),
  requirement: z.string(),
  status: z.enum(["required", "recommended", "not_applicable"]),
  notes: z.string().optional(),
});

export const LocalizationMarketExpansionPackSchema = z.object({
  primary_markets: z.array(TargetMarketSchema),
  content_scope: ContentScopeSchema,
  cultural_notes: z.string(),
  legal_checklist: z.array(LegalCheckItemSchema),
  recommended_workflow: z.string(),
  budget_hints: z.string().optional(),
});

export type LocalizationMarketExpansionPack = z.infer<
  typeof LocalizationMarketExpansionPackSchema
>;
