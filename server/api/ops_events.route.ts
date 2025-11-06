import type { Request, Response } from "express";
import { db } from "../db";
import { opsEvent, insertOpsEventSchema } from "@shared/schema";
import { desc, and, eq, sql, gte, lte } from "drizzle-orm";

type OpsPayload = {
  kind: string;
  actor?: string;
  ownerType?: string;
  ownerId?: string;
  message?: string;
  meta?: Record<string, any>;
};

export async function getOpsEvents(req: Request, res: Response) {
  try {
    const { kind, owner_type, owner_id, from, to, limit = "100", offset = "0" } = req.query;
    
    const filters = [];
    
    if (kind && typeof kind === "string") {
      filters.push(eq(opsEvent.kind, kind));
    }
    
    if (owner_type && typeof owner_type === "string") {
      filters.push(eq(opsEvent.ownerType, owner_type));
    }
    
    if (owner_id && typeof owner_id === "string") {
      filters.push(eq(opsEvent.ownerId, owner_id));
    }
    
    if (from && typeof from === "string") {
      filters.push(gte(opsEvent.createdAt, new Date(from)));
    }
    
    if (to && typeof to === "string") {
      filters.push(lte(opsEvent.createdAt, new Date(to)));
    }
    
    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(opsEvent)
      .where(whereClause);
    
    // Get paginated events
    const events = await db
      .select()
      .from(opsEvent)
      .where(whereClause)
      .orderBy(desc(opsEvent.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.setHeader("X-Total-Count", String(count));
    res.json(events);
  } catch (e) {
    console.error("getOpsEvents error:", e);
    res.status(500).json({ error: "failed to fetch events" });
  }
}

export async function postOpsEvent(req: Request, res: Response) {
  try {
    const body = (req.body || {}) as OpsPayload;
    
    if (!body.kind) {
      return res.status(422).json({ error: "kind required" });
    }

    // Infer actor from session if not provided
    const actor = body.actor || (req as any).user?.email || (req as any).user?.id || "anon";

    // Add request correlation ID and user agent to meta
    const reqId = req.headers["x-request-id"] || crypto.randomUUID();
    const enhancedMeta = {
      ...(body.meta || {}),
      reqId: String(reqId),
      ua: req.headers["user-agent"] || "unknown",
    };

    // Insert the event
    const [row] = await db
      .insert(opsEvent)
      .values({
        actor,
        kind: body.kind,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        message: body.message,
        meta: enhancedMeta,
      })
      .returning();

    res.setHeader("X-Request-Id", String(reqId));
    res.status(201).json({ ok: true, id: row.id });
  } catch (e) {
    console.error("postOpsEvent error:", e);
    res.status(500).json({ error: "failed to log event" });
  }
}
