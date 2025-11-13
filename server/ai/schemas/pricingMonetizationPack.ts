import { z } from "zod";

export const PricingModelSchema = z.object({
  model_name: z.string(),
  type: z.enum(["one_time", "subscription", "usage_based", "hybrid", "freemium"]),
  value_narrative: z.string(),
  target_segments: z.array(z.string()),
});

export const PricingTierSchema = z.object({
  tier_name: z.string(),
  position: z.enum(["good", "better", "best", "enterprise"]),
  price: z.number().optional(),
  price_hint: z.string().optional(),
  features: z.array(z.string()),
  target_persona: z.string(),
  rationale: z.string(),
});

export const PromotionSchema = z.object({
  name: z.string(),
  discount_type: z.enum(["percentage", "fixed_amount", "bundle", "trial"]),
  value: z.string(),
  duration: z.string().optional(),
  trigger: z.string(),
  rationale: z.string(),
});

export const AddOnSchema = z.object({
  name: z.string(),
  price: z.number().optional(),
  price_hint: z.string().optional(),
  description: z.string(),
  attach_rate_goal: z.string().optional(),
});

export const PricingMonetizationPackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    primary_model: z.string(),
    key_differentiators: z.array(z.string()),
  }),
  models: z.array(PricingModelSchema),
  tiers: z.array(PricingTierSchema),
  promotions: z.array(PromotionSchema),
  add_ons: z.array(AddOnSchema),
  competitive_positioning: z.string(),
  pricing_rationale: z.string(),
  open_questions: z.array(z.string()),
});

export type PricingMonetizationPack = z.infer<typeof PricingMonetizationPackSchema>;
