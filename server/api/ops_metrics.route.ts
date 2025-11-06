import { Request, Response } from "express";
import { db } from "../db";
import { opsEvent } from "@shared/schema";
import { sql, and, gte, lte, eq } from "drizzle-orm";

/**
 * Ops Metrics API
 * Provides aggregated metrics for observability dashboards and alerts
 */

// Get 24h metrics: PUBLISH, DRAFT, WO runs, errors, 429s
export async function get24hMetrics(req: Request, res: Response) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count PUBLISH events in last 24h
    const publishCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        eq(opsEvent.kind, "PUBLISH"),
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    // Count KNOWLEDGE_DRAFT events in last 24h
    const draftCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        eq(opsEvent.kind, "KNOWLEDGE_DRAFT"),
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    // Count WORK_ORDER_START events in last 24h
    const woRunsCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        eq(opsEvent.kind, "WORK_ORDER_START"),
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    // Count errors on /api/knowledge/* and /api/work-orders/* 
    // (events with kind containing ERROR and meta.path matching)
    const knowledgeErrors = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        sql`kind LIKE '%ERROR%'`,
        sql`meta->>'path' LIKE '/api/knowledge%'`,
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    const workOrderErrors = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        sql`kind LIKE '%ERROR%'`,
        sql`meta->>'path' LIKE '/api/work-orders%'`,
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    // Count 429 rate limit events
    const rateLimitCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        eq(opsEvent.kind, "RATE_LIMIT_429"),
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    // Total requests on knowledge and work-orders for error rate calculation
    const knowledgeTotal = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        sql`meta->>'path' LIKE '/api/knowledge%'`,
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    const workOrderTotal = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        sql`meta->>'path' LIKE '/api/work-orders%'`,
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    res.json({
      period: "24h",
      metrics: {
        publishCount: publishCount[0]?.count || 0,
        draftCount: draftCount[0]?.count || 0,
        woRunsCount: woRunsCount[0]?.count || 0,
        knowledgeErrors: knowledgeErrors[0]?.count || 0,
        workOrderErrors: workOrderErrors[0]?.count || 0,
        rateLimitCount: rateLimitCount[0]?.count || 0,
        knowledgeTotal: knowledgeTotal[0]?.count || 0,
        workOrderTotal: workOrderTotal[0]?.count || 0,
        knowledgeErrorRate: knowledgeTotal[0]?.count 
          ? ((knowledgeErrors[0]?.count || 0) / knowledgeTotal[0].count) * 100
          : 0,
        workOrderErrorRate: workOrderTotal[0]?.count
          ? ((workOrderErrors[0]?.count || 0) / workOrderTotal[0].count) * 100
          : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("get24hMetrics error:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
}

// Get alert triggers (lightweight rule checks)
export async function getAlertStatus(req: Request, res: Response) {
  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Alert 1: PUBLISH errors > 2 in last 10 minutes
    const publishErrorCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        eq(opsEvent.kind, "PUBLISH_ERROR"),
        gte(opsEvent.createdAt, tenMinutesAgo)
      ));

    const publishErrorAlert = {
      name: "PUBLISH_ERROR_SPIKE",
      triggered: (publishErrorCount[0]?.count || 0) > 2,
      count: publishErrorCount[0]?.count || 0,
      threshold: 2,
      window: "10m",
      severity: "high",
      message: `${publishErrorCount[0]?.count || 0} PUBLISH errors in last 10 minutes (threshold: 2)`,
    };

    // Alert 2: 5xx errors on knowledge/work-orders > 1% in last 24h
    const knowledgeErrors = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        sql`kind LIKE '%5XX%' OR kind LIKE '%ERROR%'`,
        sql`meta->>'path' LIKE '/api/knowledge%'`,
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    const knowledgeTotal = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        sql`meta->>'path' LIKE '/api/knowledge%'`,
        gte(opsEvent.createdAt, oneDayAgo)
      ));

    const knowledgeErrorRate = knowledgeTotal[0]?.count
      ? ((knowledgeErrors[0]?.count || 0) / knowledgeTotal[0].count) * 100
      : 0;

    const knowledgeErrorRateAlert = {
      name: "KNOWLEDGE_ERROR_RATE",
      triggered: knowledgeErrorRate > 1,
      errorRate: knowledgeErrorRate.toFixed(2) + "%",
      threshold: "1%",
      window: "24h",
      severity: "medium",
      message: `Knowledge API error rate: ${knowledgeErrorRate.toFixed(2)}% (threshold: 1%)`,
    };

    // Alert 3: 429 rate limit spikes > 10 in last 10 minutes
    const rateLimitCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opsEvent)
      .where(and(
        eq(opsEvent.kind, "RATE_LIMIT_429"),
        gte(opsEvent.createdAt, tenMinutesAgo)
      ));

    const rateLimitAlert = {
      name: "RATE_LIMIT_SPIKE",
      triggered: (rateLimitCount[0]?.count || 0) > 10,
      count: rateLimitCount[0]?.count || 0,
      threshold: 10,
      window: "10m",
      severity: "low",
      message: `${rateLimitCount[0]?.count || 0} rate limit hits in last 10 minutes (threshold: 10)`,
    };

    const alerts = [publishErrorAlert, knowledgeErrorRateAlert, rateLimitAlert];
    const activeAlerts = alerts.filter(a => a.triggered);

    res.json({
      alerts,
      activeCount: activeAlerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getAlertStatus error:", error);
    res.status(500).json({ error: "Failed to fetch alert status" });
  }
}

// Get recent event timeline for specific kinds
export async function getEventTimeline(req: Request, res: Response) {
  try {
    const { kinds, hours = 24 } = req.query;
    const kindList = typeof kinds === "string" ? kinds.split(",") : ["PUBLISH", "KNOWLEDGE_DRAFT", "WORK_ORDER_START"];
    const hoursAgo = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

    const events = await db
      .select({
        kind: opsEvent.kind,
        count: sql<number>`count(*)::int`,
        hour: sql<string>`date_trunc('hour', created_at)::text`,
      })
      .from(opsEvent)
      .where(and(
        sql`kind = ANY(${sql.raw(`ARRAY[${kindList.map(k => `'${k}'`).join(",")}]`)})`,
        gte(opsEvent.createdAt, hoursAgo)
      ))
      .groupBy(sql`date_trunc('hour', created_at)`, opsEvent.kind)
      .orderBy(sql`date_trunc('hour', created_at) DESC`);

    res.json({
      timeline: events,
      kinds: kindList,
      hours: Number(hours),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getEventTimeline error:", error);
    res.status(500).json({ error: "Failed to fetch event timeline" });
  }
}
