import { z } from "zod";

export const DthPodActivationRaciPackSchema = z.object({
  canonVersion: z.string(),
  generatedAt: z.string(),
  title: z.literal("Dream Team Hub — Pod Activation Rules + RACI"),
  contentMd: z.string(),
});

export type DthPodActivationRaciPack = z.infer<typeof DthPodActivationRaciPackSchema>;
