import { z } from "zod";

export const PackagingFormatSchema = z.object({
  name: z.string(),
  dieline_reference: z.string().nullable(),
  dimensions_mm: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number().optional(),
  }),
  orientation: z.enum(["portrait", "landscape", "square"]),
  notes: z.string(),
});

export const PrintSpecsSchema = z.object({
  color_mode: z.enum(["CMYK", "RGB", "Pantone", "Mixed"]),
  coatings: z.array(z.enum(["none", "gloss", "matte", "soft_touch", "spot_uv"])),
  special_finishes: z.array(z.string()).optional(),
  stock: z.object({
    weight_gsm: z.number().optional(),
    finish: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
});

export const ComplianceCheckItemSchema = z.object({
  label: z.string(),
  requirement: z.string(),
  status: z.enum(["required", "optional", "not_applicable"]),
});

export const PrePressCheckItemSchema = z.object({
  step: z.string(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

export const ReferenceAssetSchema = z.object({
  description: z.string(),
  file_reference: z.string().optional(),
  url: z.string().optional(),
});

export const PackagingPrePressPackSchema = z.object({
  summary: z.string(),
  packaging_story: z.string(),
  primary_formats: z.array(PackagingFormatSchema),
  print_specs: PrintSpecsSchema,
  compliance_checklist: z.array(ComplianceCheckItemSchema),
  prepress_checklist: z.array(PrePressCheckItemSchema),
  reference_assets: z.array(ReferenceAssetSchema).optional(),
  vendor_notes: z.string().optional(),
});

export type PackagingPrePressPack = z.infer<typeof PackagingPrePressPackSchema>;
