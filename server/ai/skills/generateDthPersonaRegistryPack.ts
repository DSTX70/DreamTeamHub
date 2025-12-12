import fs from "node:fs";
import path from "node:path";
import { DthPersonaRegistryPackSchema } from "../schemas/dthPersonaRegistryPack";

function isoNow() {
  return new Date().toISOString();
}

export async function generateDthPersonaRegistryPack(args?: { canonPath?: string; format?: "json" | "md" | "both" }) {
  const canonPath =
    args?.canonPath ?? path.join(process.cwd(), "data/dream-team/dth_persona_registry_v1-0.json");

  const raw = fs.readFileSync(canonPath, "utf8");
  const canon = JSON.parse(raw) as { canonVersion: string; personas: any[] };

  const byType: Record<string, number> = {};
  const byPillar: Record<string, number> = {};
  for (const p of canon.personas ?? []) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
    byPillar[p.pillar] = (byPillar[p.pillar] ?? 0) + 1;
  }

  const pack = {
    canonVersion: canon.canonVersion ?? "v1.0",
    generatedAt: isoNow(),
    title: "Dream Team Hub — Persona Registry" as const,
    format: args?.format ?? "both",
    counts: {
      total: (canon.personas ?? []).length,
      byType,
      byPillar,
    },
    personas: canon.personas ?? [],
  };

  return DthPersonaRegistryPackSchema.parse(pack);
}
