import { z } from "zod";

export const ShotBoardSchema = z.object({
  shot_id: z.string(),
  collection: z.string(),
  sku: z.string(),
  card_title: z.string(),
  scenario: z.string(),
  camera: z.string(),
  framing: z.string(),
  lighting: z.string(),
  casting: z.string(),
  color_palette: z.string(),
  notes: z.string().optional(),
});

export const ExportPlanRowSchema = z.object({
  shot_id: z.string(),
  sku: z.string(),
  base_key: z.string(),
  size_label: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  filename: z.string(),
  format: z.string(),
  is_primary: z.boolean().optional(),
});

export const AltTextRowSchema = z.object({
  filename: z.string(),
  sku: z.string(),
  alt_text: z.string(),
  en_title: z.string(),
});

export const SeoMetaRowSchema = z.object({
  filename: z.string(),
  sku: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  focus_keywords: z.array(z.string()).optional(),
});

export const LifestylePackSchema = z.object({
  shot_boards: z.array(ShotBoardSchema),
  export_plan: z.array(ExportPlanRowSchema),
  alt_text_rows: z.array(AltTextRowSchema),
  seo_meta_rows: z.array(SeoMetaRowSchema),
});

export type LifestylePack = z.infer<typeof LifestylePackSchema>;
export type ShotBoard = z.infer<typeof ShotBoardSchema>;
export type ExportPlanRow = z.infer<typeof ExportPlanRowSchema>;
export type AltTextRow = z.infer<typeof AltTextRowSchema>;
export type SeoMetaRow = z.infer<typeof SeoMetaRowSchema>;
