import { z } from "zod";

export const DthAgentLabBoundaryPackSchema = z.object({
  canonVersion: z.string(),
  generatedAt: z.string(),
  title: z.literal("Dream Team Hub — Agent Lab vs Dream Team Boundary Spec"),
  contentMd: z.string(),
});

export type DthAgentLabBoundaryPack = z.infer<typeof DthAgentLabBoundaryPackSchema>;
