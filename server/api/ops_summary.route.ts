import type { Request, Response } from "express";
import { db } from "../db";
import { opsEvent } from "@shared/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function opsSummaryHandler(req: Request, res: Response) {
  const ownerType = req.query.owner_type as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const includeSeries = req.query.series === "1";
  
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

    const out: any = {
      window: "24h",
      publish_count_24h: byKind["PUBLISH"] || 0,
      draft_count_24h: byKind["KNOWLEDGE_DRAFT"] || 0,
      wo_runs_24h: Object.keys(byKind)
        .filter((k) => k.startsWith("WO_"))
        .reduce((s, k) => s + byKind[k], 0),
    };

    // Add hourly series if requested
    if (includeSeries) {
      let seriesQuery = sql`
        WITH hours AS (
          SELECT generate_series(
            date_trunc('hour', NOW() - INTERVAL '23 hours'),
            date_trunc('hour', NOW()),
            INTERVAL '1 hour'
          ) AS h
        )
        SELECT 
          h.h AS hour,
          COALESCE(SUM(CASE WHEN e.kind = 'PUBLISH' THEN 1 ELSE 0 END), 0)::int AS publish,
          COALESCE(SUM(CASE WHEN e.kind = 'KNOWLEDGE_DRAFT' THEN 1 ELSE 0 END), 0)::int AS draft,
          COALESCE(SUM(CASE WHEN e.kind LIKE 'WO_%' THEN 1 ELSE 0 END), 0)::int AS wo
        FROM hours h
        LEFT JOIN ops_event e ON date_trunc('hour', e.created_at) = h.h
      `;

      // Add WHERE clauses for filtering
      if (ownerType && ownerId) {
        seriesQuery = sql`${seriesQuery} AND e.owner_type = ${ownerType} AND e.owner_id = ${ownerId}`;
      } else if (ownerType) {
        seriesQuery = sql`${seriesQuery} AND e.owner_type = ${ownerType}`;
      }

      seriesQuery = sql`${seriesQuery} GROUP BY h.h ORDER BY h.h ASC`;

      const seriesRows = await db.execute(seriesQuery);

      const publish: number[] = [];
      const draft: number[] = [];
      const wo: number[] = [];

      (seriesRows.rows as any[]).forEach((r) => {
        publish.push(Number(r.publish));
        draft.push(Number(r.draft));
        wo.push(Number(r.wo));
      });

      out.series = { publish, draft, wo };
    }

    res.json(out);
  } catch (error: any) {
    console.error("Ops summary error:", error);
    res.status(500).json({ error: "Failed to fetch ops summary" });
  }
}
