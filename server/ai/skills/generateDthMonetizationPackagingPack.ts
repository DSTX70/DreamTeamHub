import fs from "node:fs";
import path from "node:path";
import { DthMonetizationPackagingPackSchema } from "../schemas/dthMonetizationPackagingPack";

export async function generateDthMonetizationPackagingPack(args?: { canonVersion?: string; mdPath?: string }) {
  const canonVersion = args?.canonVersion ?? "v1.0";
  const mdPath =
    args?.mdPath ?? path.join(process.cwd(), "data/dream-team/dth_monetization_packaging_v1-0.md");

  const contentMd = fs.readFileSync(mdPath, "utf8");

  return DthMonetizationPackagingPackSchema.parse({
    canonVersion,
    generatedAt: new Date().toISOString(),
    title: "Dream Team Hub — Monetization & Packaging Map" as const,
    contentMd,
  });
}
