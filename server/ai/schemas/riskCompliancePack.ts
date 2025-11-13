import { z } from "zod";

export const RiskSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const RiskLikelihoodSchema = z.enum(["low", "medium", "high"]);

export const RiskAreaSchema = z.enum([
  "Security",
  "Privacy",
  "IP",
  "Compliance",
  "Brand/Safety",
  "Ops",
  "Legal/Contract",
]);

export const RiskItemSchema = z.object({
  id: z.string(),
  area: RiskAreaSchema,
  severity: RiskSeveritySchema,
  likelihood: RiskLikelihoodSchema,
  description: z.string(),
  impact: z.string(),
  recommendation: z.string(),
  owner_role: z.string(),
  time_horizon: z.enum(["now", "near_term", "later"]),
});

export const ControlItemSchema = z.object({
  id: z.string(),
  category: z.enum(["Policy", "Product", "Infra", "Process", "Legal"]),
  description: z.string(),
  owner_role: z.string(),
  required: z.boolean().optional(),
});

export const ComplianceNoteSchema = z.object({
  regime: z.string(),
  status: z.enum(["ok", "watch", "risk"]),
  note: z.string(),
});

export const RiskCompliancePackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    overall_risk: RiskSeveritySchema,
    key_concerns: z.array(z.string()),
    key_mitigations: z.array(z.string()),
  }),
  risks: z.array(RiskItemSchema),
  controls: z.array(ControlItemSchema),
  compliance_notes: z.array(ComplianceNoteSchema),
  open_questions: z.array(z.string()),
});

export type RiskCompliancePack = z.infer<typeof RiskCompliancePackSchema>;
