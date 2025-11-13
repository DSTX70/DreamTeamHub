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
  independent_claims: z.array(PatentClaimSchema).refine(
    (claims) => claims.every(c => c.claim_type === "independent"),
    { message: "All claims in independent_claims must have claim_type='independent'" }
  ),
  dependent_claims: z.array(PatentClaimSchema).refine(
    (claims) => claims.every(c => c.claim_type === "dependent"),
    { message: "All claims in dependent_claims must have claim_type='dependent'" }
  ),
  open_questions: z.array(z.string()).default([]),
});

export type PatentClaimsPack = z.infer<typeof PatentClaimsPackSchema>;
export type PatentClaim = z.infer<typeof PatentClaimSchema>;
