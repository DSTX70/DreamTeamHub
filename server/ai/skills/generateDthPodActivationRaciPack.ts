import fs from "node:fs";
import path from "node:path";
import { DthPodActivationRaciPackSchema } from "../schemas/dthPodActivationRaciPack";

export async function generateDthPodActivationRaciPack(args?: { canonVersion?: string; mdPath?: string }) {
  const canonVersion = args?.canonVersion ?? "v1.0";
  const mdPath =
    args?.mdPath ?? path.join(process.cwd(), "data/dream-team/dth_pod-activation_raci_v1-0.md");

  const contentMd = fs.readFileSync(mdPath, "utf8");

  return DthPodActivationRaciPackSchema.parse({
    canonVersion,
    generatedAt: new Date().toISOString(),
    title: "Dream Team Hub — Pod Activation Rules + RACI" as const,
    contentMd,
  });
}
