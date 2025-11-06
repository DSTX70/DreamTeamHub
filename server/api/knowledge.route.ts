import type { Request, Response } from "express";
import { db } from "../db";
import { opsEvent } from "@shared/schema";
import { and, eq } from "drizzle-orm";

type PublishFilePayload = {
  fileId: string;
  fileName: string;
  fileUrl: string;
  ownerType: string;
  ownerId: string;
  meta?: Record<string, any>;
};

export async function publishFile(req: Request, res: Response) {
  try {
    const body = (req.body || {}) as PublishFilePayload;
    
    if (!body.fileId || !body.fileName || !body.fileUrl) {
      return res.status(400).json({ 
        error: "Missing required fields: fileId, fileName, fileUrl" 
      });
    }
    
    if (!body.ownerType || !body.ownerId) {
      return res.status(400).json({
        error: "Missing required fields: ownerType, ownerId"
      });
    }
    
    const actor = req.user?.username || "anon";
    const kind = "PUBLISH";
    
    try {
      // Create new PUBLISH event
      // Database unique index ensures idempotency at DB level
      const [event] = await db
        .insert(opsEvent)
        .values({
          kind,
          actor,
          ownerType: body.ownerType,
          ownerId: body.ownerId,
          message: `Published file: ${body.fileName}`,
          meta: {
            fileId: body.fileId,
            fileName: body.fileName,
            fileUrl: body.fileUrl,
            ...body.meta,
          },
        })
        .returning();
      
      return res.json({
        success: true,
        alreadyPublished: false,
        eventId: event.id,
        message: `File "${body.fileName}" published successfully`
      });
      
    } catch (insertError: any) {
      // Handle unique constraint violation (duplicate PUBLISH event)
      if (insertError.code === '23505') {
        // Find the existing event
        const existing = await db
          .select()
          .from(opsEvent)
          .where(
            and(
              eq(opsEvent.kind, kind),
              eq(opsEvent.ownerType, body.ownerType),
              eq(opsEvent.ownerId, body.ownerId)
            )
          )
          .limit(1);
        
        return res.json({ 
          success: true, 
          alreadyPublished: true,
          eventId: existing[0]?.id,
          message: `File "${body.fileName}" was already published`
        });
      }
      
      // Re-throw if not a duplicate key error
      throw insertError;
    }
    
  } catch (e) {
    console.error("publishFile error:", e);
    return res.status(500).json({ error: "Failed to publish file" });
  }
}

export async function getPublishedFiles(req: Request, res: Response) {
  try {
    const { owner_type, owner_id } = req.query;
    
    const filters = [eq(opsEvent.kind, "PUBLISH")];
    
    if (owner_type && typeof owner_type === "string") {
      filters.push(eq(opsEvent.ownerType, owner_type));
    }
    
    if (owner_id && typeof owner_id === "string") {
      filters.push(eq(opsEvent.ownerId, owner_id));
    }
    
    const events = await db
      .select()
      .from(opsEvent)
      .where(and(...filters))
      .orderBy(opsEvent.createdAt);
    
    const files = events.map((event) => ({
      id: event.id,
      fileId: event.meta?.fileId || null,
      fileName: event.meta?.fileName || null,
      fileUrl: event.meta?.fileUrl || null,
      ownerType: event.ownerType,
      ownerId: event.ownerId,
      publishedBy: event.actor,
      publishedAt: event.createdAt,
      meta: event.meta,
    }));
    
    return res.json(files);
    
  } catch (e) {
    console.error("getPublishedFiles error:", e);
    return res.status(500).json({ error: "Failed to fetch published files" });
  }
}
