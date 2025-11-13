import { z } from "zod";

export const PartnerTypeSchema = z.object({
  type_name: z.string(),
  description: z.string(),
  value_exchange: z.string(),
  examples: z.array(z.string()),
});

export const PartnerCandidateSchema = z.object({
  name: z.string(),
  type: z.string(),
  fit_rationale: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  next_steps: z.string(),
});

export const DealStructureSchema = z.object({
  structure_name: z.string(),
  type: z.enum([
    "revenue_share",
    "co_brand",
    "white_label",
    "affiliate",
    "integration",
    "joint_venture",
  ]),
  description: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  example_terms: z.string().optional(),
});

export const CollaborationPlaySchema = z.object({
  play_name: z.string(),
  description: z.string(),
  required_capabilities: z.array(z.string()),
  timeline_hint: z.string().optional(),
});

export const GlobalCollabsPartnershipPackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    strategic_rationale: z.string(),
    key_benefits: z.array(z.string()),
  }),
  partner_types: z.array(PartnerTypeSchema),
  candidates: z.array(PartnerCandidateSchema),
  deal_structures: z.array(DealStructureSchema),
  collaboration_plays: z.array(CollaborationPlaySchema),
  risks_and_dependencies: z.array(z.string()),
  open_questions: z.array(z.string()),
});

export type GlobalCollabsPartnershipPack = z.infer<typeof GlobalCollabsPartnershipPackSchema>;
