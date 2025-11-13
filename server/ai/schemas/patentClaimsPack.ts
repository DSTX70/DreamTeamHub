import { z } from "zod";

export const PatentClaimSchema = z.object({
  claim_number: z.number().int(),
  claim_type: z.enum(["independent", "dependent"]),
  text: z.string(),
  depends_on: z.array(z.number().int()).default([]),
  notes: z.string().optional(),
});

export const PatentClaimsPackSchema = z.object({
  invention_title: z.string(),
  short_summary: z.string(),
  independent_claims: z.array(PatentClaimSchema),
  dependent_claims: z.array(PatentClaimSchema),
  open_questions: z.array(z.string()).default([]),
});

export type PatentClaimsPack = z.infer<typeof PatentClaimsPackSchema>;
export type PatentClaim = z.infer<typeof PatentClaimSchema>;
