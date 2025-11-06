import type { Request, Response } from "express";
import { db } from "../db";
import { opsEvent, insertOpsEventSchema } from "@shared/schema";

type OpsPayload = {
  kind: string;
  actor?: string;
  ownerType?: string;
  ownerId?: string;
  message?: string;
  meta?: Record<string, any>;
};

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
