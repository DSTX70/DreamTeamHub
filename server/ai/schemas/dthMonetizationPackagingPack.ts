import { z } from "zod";

export const DthMonetizationPackagingPackSchema = z.object({
  canonVersion: z.string(),
  generatedAt: z.string(),
  title: z.literal("Dream Team Hub — Monetization & Packaging Map"),
  contentMd: z.string(),
});

export type DthMonetizationPackagingPack = z.infer<typeof DthMonetizationPackagingPackSchema>;
