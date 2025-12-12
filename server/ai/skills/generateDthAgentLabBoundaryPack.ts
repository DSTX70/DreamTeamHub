import fs from "node:fs";
import path from "node:path";
import { DthAgentLabBoundaryPackSchema } from "../schemas/dthAgentLabBoundaryPack";

export async function generateDthAgentLabBoundaryPack(args?: { canonVersion?: string; mdPath?: string }) {
  const canonVersion = args?.canonVersion ?? "v1.0";
  const mdPath =
    args?.mdPath ?? path.join(process.cwd(), "data/dream-team/dth_agent-lab_boundary_v1-0.md");

  const contentMd = fs.readFileSync(mdPath, "utf8");

  return DthAgentLabBoundaryPackSchema.parse({
    canonVersion,
    generatedAt: new Date().toISOString(),
    title: "Dream Team Hub — Agent Lab vs Dream Team Boundary Spec" as const,
    contentMd,
  });
}
