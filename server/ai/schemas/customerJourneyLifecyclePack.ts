import { z } from "zod";

export const JourneyStageSchema = z.object({
  name: z.string(),
  description: z.string(),
  primary_touchpoints: z.array(z.string()),
  automation_ideas: z.array(z.string()).optional(),
  kpis: z.array(z.string()),
  pain_points: z.array(z.string()).optional(),
});

export const LifecyclePlaySchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.string(),
  channels: z.array(z.enum(["email", "sms", "push", "in_app", "direct_mail"])),
  cadence: z.string().optional(),
});

export const CustomerJourneyLifecyclePackSchema = z.object({
  persona_name: z.string(),
  journey_overview: z.string(),
  stages: z.array(JourneyStageSchema),
  moments_that_matter: z.array(z.string()),
  lifecycle_play_ideas: z.array(z.string()),
  crm_automation_notes: z.string().optional(),
  measurement_framework: z.string().optional(),
});

export type CustomerJourneyLifecyclePack = z.infer<typeof CustomerJourneyLifecyclePackSchema>;
