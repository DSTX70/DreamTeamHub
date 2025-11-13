import { z } from "zod";

export const MetricDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(["counter", "gauge", "rate", "ratio", "distribution"]),
  unit: z.string().optional(),
  business_goal: z.string(),
  target_value: z.string().optional(),
});

export const EventSchema = z.object({
  event_name: z.string(),
  trigger: z.string(),
  properties: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
  })),
  purpose: z.string(),
});

export const EntitySchema = z.object({
  entity_name: z.string(),
  description: z.string(),
  key_attributes: z.array(z.string()),
  relationships: z.array(z.string()).optional(),
});

export const DataQualityRuleSchema = z.object({
  rule: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  check_frequency: z.string(),
});

export const OwnershipSchema = z.object({
  data_domain: z.string(),
  owner_role: z.string(),
  backup_role: z.string().optional(),
  responsibilities: z.array(z.string()),
});

export const DataStewardshipMetricsPackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    primary_goals: z.array(z.string()),
  }),
  metrics: z.array(MetricDefinitionSchema),
  events: z.array(EventSchema),
  entities: z.array(EntitySchema),
  data_quality_rules: z.array(DataQualityRuleSchema),
  ownership: z.array(OwnershipSchema),
  privacy_notes: z.string().optional(),
  open_questions: z.array(z.string()),
});

export type DataStewardshipMetricsPack = z.infer<typeof DataStewardshipMetricsPackSchema>;
