import { z } from "zod";

export const FeatureBulletSchema = z.object({
  label: z.string().optional(),
  body: z.string(),
  pillar: z.enum(["feature", "benefit", "emotion"]),
});

export const APlusSectionSchema = z.object({
  section_type: z.enum(["hero", "feature_grid", "comparison", "story", "faq", "cta"]),
  heading: z.string(),
  body: z.string(),
  image_ideas: z.array(z.string()),
  layout_hint: z.string().optional(),
});

export const FaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const CrossSellSchema = z.object({
  label: z.string(),
  rationale: z.string(),
  sku_hint: z.string().optional(),
});

export const EcomPdpAplusContentPackSchema = z.object({
  seo_title: z.string(),
  seo_slug_hint: z.string(),
  short_subtitle: z.string(),
  feature_bullets: z.array(FeatureBulletSchema),
  long_description: z.string(),
  aplus_sections: z.array(APlusSectionSchema),
  faqs: z.array(FaqItemSchema),
  cross_sell_suggestions: z.array(CrossSellSchema).optional(),
  keywords: z.array(z.string()).optional(),
});

export type EcomPdpAplusContentPack = z.infer<typeof EcomPdpAplusContentPackSchema>;
