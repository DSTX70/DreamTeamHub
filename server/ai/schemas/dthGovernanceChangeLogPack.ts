import { z } from "zod";

export const DthGovernanceChangeLogPackSchema = z.object({
  canonVersion: z.string(),
  generatedAt: z.string(),
  title: z.literal("Dream Team Hub — Governance Change Log"),
  contentMd: z.string(),
});

export type DthGovernanceChangeLogPack = z.infer<typeof DthGovernanceChangeLogPackSchema>;
