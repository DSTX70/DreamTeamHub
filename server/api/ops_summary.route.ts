import type { Request, Response } from "express";
import { db } from "../db";
import { opsEvent } from "@shared/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function opsSummaryHandler(req: Request, res: Response) {
  const ownerType = req.query.owner_type as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  
  // Get events from last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const whereConditions = [
      gte(opsEvent.createdAt, since),
      ownerType ? eq(opsEvent.ownerType, ownerType) : undefined,
      ownerId ? eq(opsEvent.ownerId, ownerId) : undefined,
    ].filter(Boolean);

    const rows = await db
      .select({
        kind: opsEvent.kind,
        count: sql<number>`count(*)`,
      })
      .from(opsEvent)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(opsEvent.kind);

    const byKind: Record<string, number> = {};
    rows.forEach((r) => {
      byKind[r.kind] = Number(r.count);
    });

    const out = {
      window: "24h",
      publish_count_24h: byKind["PUBLISH"] || 0,
      draft_count_24h: byKind["KNOWLEDGE_DRAFT"] || 0,
      wo_runs_24h: Object.keys(byKind)
        .filter((k) => k.startsWith("WO_"))
        .reduce((s, k) => s + byKind[k], 0),
    };

    res.json(out);
  } catch (error: any) {
    console.error("Ops summary error:", error);
    res.status(500).json({ error: "Failed to fetch ops summary" });
  }
}
