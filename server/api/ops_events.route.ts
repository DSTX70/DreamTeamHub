import type { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { opsEvent } from "@shared/schema";
import { desc, and, eq, sql, gte, lte } from "drizzle-orm";
import { GetOpsQuery, PostOpsBody } from "../../lib/validators/ops";

export async function getOpsEvents(req: Request, res: Response) {
  try {
    // Validate query parameters
    const parsed = GetOpsQuery.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    const { kind, owner_type, owner_id, from, to, limit, offset } = parsed.data;
    
    const filters = [];
    
    if (kind) {
      filters.push(eq(opsEvent.kind, kind));
    }
    
    if (owner_type) {
      filters.push(eq(opsEvent.ownerType, owner_type));
    }
    
    if (owner_id) {
      filters.push(eq(opsEvent.ownerId, owner_id));
    }
    
    if (from) {
      filters.push(gte(opsEvent.createdAt, new Date(from)));
    }
    
    if (to) {
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
      .limit(limit)
      .offset(offset);
    
    res.setHeader("X-Total-Count", String(count));
    res.json(events);
  } catch (e) {
    console.error("getOpsEvents error:", e);
    res.status(500).json({ error: "failed to fetch events" });
  }
}

export async function postOpsEvent(req: Request, res: Response) {
  try {
    // Validate body
    const parsed = PostOpsBody.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    const body = parsed.data;

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
