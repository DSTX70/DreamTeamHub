import { z } from "zod";

export const WeeklyThemeSchema = z.object({
  week_index: z.number().int(),
  theme: z.string(),
  focus: z.string(),
});

export const SocialPostSchema = z.object({
  day_offset: z.number().int(),
  platform: z.enum(["instagram", "tiktok", "facebook", "twitter", "linkedin", "threads"]),
  content_type: z.enum(["post", "story", "reel", "carousel", "live"]),
  working_title: z.string(),
  hook: z.string(),
  core_message: z.string(),
  cta: z.string().optional(),
  asset_needs: z.array(z.string()),
  hashtags: z.array(z.string()).optional(),
});

export const PerformanceObjectiveSchema = z.object({
  metric: z.string(),
  target_hint: z.string(),
});

export const SocialCampaignContentCalendarPackSchema = z.object({
  campaign_name: z.string(),
  campaign_window_description: z.string(),
  core_narrative: z.string(),
  primary_hashtags: z.array(z.string()),
  secondary_hashtags: z.array(z.string()).optional(),
  weekly_themes: z.array(WeeklyThemeSchema),
  posts: z.array(SocialPostSchema),
  influencer_prompts: z.array(z.string()).optional(),
  performance_objectives: z.array(PerformanceObjectiveSchema).optional(),
});

export type SocialCampaignContentCalendarPack = z.infer<
  typeof SocialCampaignContentCalendarPackSchema
>;
