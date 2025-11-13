import { z } from "zod";

export const ProductVariantSchema = z.object({
  sku: z.string(),
  name: z.string(),
  attributes: z.record(z.string()),
  tier: z.string().optional(),
  msrp: z.number().optional(),
  wholesale: z.number().optional(),
  notes: z.string().optional(),
});

export const ProductSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  variants: z.array(ProductVariantSchema),
});

export const ProductSeriesSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  products: z.array(ProductSchema),
});

export const CollectionHierarchySchema = z.object({
  collection: z.string(),
  series: z.array(ProductSeriesSchema),
});

export const ProductTierSchema = z.object({
  name: z.string(),
  description: z.string(),
  price_band_hint: z.string().optional(),
  feature_differentiation: z.string().optional(),
});

export const RoadmapPhaseSchema = z.object({
  phase_name: z.string(),
  phase_order: z.number().int(),
  included_skus: z.array(z.string()),
  timeline_hint: z.string().optional(),
  notes: z.string().optional(),
});

export const ProductLineSkuTreePackSchema = z.object({
  line_name: z.string(),
  line_code_prefix: z.string().optional(),
  overview: z.string(),
  tiers: z.array(ProductTierSchema).optional(),
  hierarchy: z.array(CollectionHierarchySchema),
  roadmap_phases: z.array(RoadmapPhaseSchema).optional(),
  sku_naming_convention: z.string().optional(),
});

export type ProductLineSkuTreePack = z.infer<typeof ProductLineSkuTreePackSchema>;
