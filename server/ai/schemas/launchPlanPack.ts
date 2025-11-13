import { z } from "zod";

export const TimelineItemSchema = z.object({
  phase_id: z.string(),
  label: z.string(),
  owner_role: z.string(),
  start_offset_days: z.number().int(),
  end_offset_days: z.number().int(),
});

export const ChannelPlanSchema = z.object({
  channel: z.string(),
  objective: z.string(),
  key_messages: z.array(z.string()),
  cadence: z.string(),
});

export const AssetPlanSchema = z.object({
  asset_id: z.string(),
  type: z.string(),
  description: z.string(),
  owner_role: z.string(),
  needed_by_offset_days: z.number().int(),
});

export const KpiSchema = z.object({
  metric: z.string(),
  target_value: z.string(),
  measurement_window_days: z.number().int(),
});

export const LaunchPlanPackSchema = z.object({
  campaign_name: z.string(),
  t0_event: z.string(),
  timeline: z.array(TimelineItemSchema),
  channels: z.array(ChannelPlanSchema),
  assets: z.array(AssetPlanSchema),
  kpis: z.array(KpiSchema),
});

export type LaunchPlanPack = z.infer<typeof LaunchPlanPackSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;
export type ChannelPlan = z.infer<typeof ChannelPlanSchema>;
export type AssetPlan = z.infer<typeof AssetPlanSchema>;
export type Kpi = z.infer<typeof KpiSchema>;
