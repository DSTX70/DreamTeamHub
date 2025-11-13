import { z } from "zod";

export const GovernanceRuleSchema = z.object({
  id: z.string(),
  category: z.enum([
    "Authorization",
    "Data_Access",
    "Action_Scope",
    "Approval_Required",
    "Logging_Required",
    "Rate_Limit",
  ]),
  rule: z.string(),
  enforcement: z.enum(["hard", "soft", "advisory"]),
  rationale: z.string(),
});

export const PolicyReferenceSchema = z.object({
  policy_name: z.string(),
  version: z.string().optional(),
  relevant_sections: z.array(z.string()),
  link: z.string().optional(),
});

export const AuditRequirementSchema = z.object({
  event_type: z.string(),
  required_fields: z.array(z.string()),
  retention_days: z.number().int(),
  destination: z.enum(["db", "external_log", "both"]),
});

export const GuardrailSchema = z.object({
  id: z.string(),
  type: z.enum(["input_validation", "output_filter", "capability_fence", "human_loop"]),
  description: z.string(),
  trigger_condition: z.string(),
  response: z.string(),
});

export const AgentGovernancePackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    governance_tier: z.enum(["low", "medium", "high", "critical"]),
    key_constraints: z.array(z.string()),
  }),
  rules: z.array(GovernanceRuleSchema),
  policies: z.array(PolicyReferenceSchema),
  audit_requirements: z.array(AuditRequirementSchema),
  guardrails: z.array(GuardrailSchema),
  escalation_paths: z.array(z.string()),
  open_questions: z.array(z.string()),
});

export type AgentGovernancePack = z.infer<typeof AgentGovernancePackSchema>;
