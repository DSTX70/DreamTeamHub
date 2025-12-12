import fs from "node:fs";
import path from "node:path";
import { DthGovernanceChangeLogPackSchema } from "../schemas/dthGovernanceChangeLogPack";

export async function generateDthGovernanceChangeLogPack(args?: { canonVersion?: string; mdPath?: string }) {
  const canonVersion = args?.canonVersion ?? "v1.0";
  const mdPath =
    args?.mdPath ?? path.join(process.cwd(), "data/dream-team/dth_change-log_v1-0.md");

  const contentMd = fs.readFileSync(mdPath, "utf8");

  return DthGovernanceChangeLogPackSchema.parse({
    canonVersion,
    generatedAt: new Date().toISOString(),
    title: "Dream Team Hub — Governance Change Log" as const,
    contentMd,
  });
}
