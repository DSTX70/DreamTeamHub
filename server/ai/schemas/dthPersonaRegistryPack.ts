import { z } from "zod";

export const DthPersonaRegistryPackSchema = z.object({
  canonVersion: z.string(),
  generatedAt: z.string(),
  title: z.literal("Dream Team Hub — Persona Registry"),
  format: z.enum(["json", "md", "both"]).default("both"),
  counts: z.object({
    total: z.number(),
    byType: z.record(z.string(), z.number()),
    byPillar: z.record(z.string(), z.number()),
  }),
  personas: z.array(
    z.object({
      slug: z.string(),
      displayName: z.string(),
      type: z.enum(["dream_team", "pod_role", "council", "system_capability"]),
      pillar: z.string(),
      pod: z.string(),
      role: z.string().optional(),
      toneVoice: z.string().optional(),
      autonomyMax: z.enum(["L0", "L1", "L2", "L3"]).optional(),
      scope: z.array(z.string()).optional(),
      outOfScope: z.array(z.string()).optional(),
      deliverables: z.array(z.string()).optional(),
      definitionOfDone: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })
  ),
});

export type DthPersonaRegistryPack = z.infer<typeof DthPersonaRegistryPackSchema>;
