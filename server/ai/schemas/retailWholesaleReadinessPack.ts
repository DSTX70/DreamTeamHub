import { z } from "zod";

export const LineSheetItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  msrp: z.number().optional(),
  wholesale_price: z.number().optional(),
  case_pack: z.number().int().optional(),
  min_order_qty: z.number().int().optional(),
  notes: z.string().optional(),
});

export const MerchandisingConceptSchema = z.object({
  name: z.string(),
  type: z.enum(["endcap", "inline", "counter", "window", "freestanding"]),
  description: z.string(),
  asset_ideas: z.array(z.string()),
  space_requirements: z.string().optional(),
});

export const RetailerPitchAngleSchema = z.object({
  retailer_type: z.enum(["indie", "specialty_chain", "big_box", "department_store", "online"]),
  angle: z.string(),
  key_talking_points: z.array(z.string()).optional(),
});

export const RetailWholesaleReadinessPackSchema = z.object({
  summary: z.string(),
  line_sheet_items: z.array(LineSheetItemSchema),
  merchandising_concepts: z.array(MerchandisingConceptSchema),
  retailer_pitch_angles: z.array(RetailerPitchAngleSchema),
  trade_show_checklist: z.array(z.string()),
  terms_notes: z.string().optional(),
  fulfillment_notes: z.string().optional(),
});

export type RetailWholesaleReadinessPack = z.infer<typeof RetailWholesaleReadinessPackSchema>;
