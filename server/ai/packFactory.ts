import type { Request, Response, RequestHandler } from "express";
import type { DB } from "../db/types";
import type { PackConfig } from "./packRegistry";
import { runSkill } from "./runSkill";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { workItems, workItemPacks } from "@shared/schema";

/**
 * Factory function to create a pack generation action handler
 * Returns an Express-compatible RequestHandler that closes over the global db
 */
export function createPackActionHandler(config: PackConfig): RequestHandler {
  return async (req: Request, res: Response) => {
    try {
      const workItemId = req.params.id;
      
      // Fetch work item
      const workItem = await db
        .select()
        .from(workItems)
        .where(eq(workItems.id, workItemId))
        .limit(1);

      if (!workItem || workItem.length === 0) {
        return res.status(404).json({ error: "Work item not found" });
      }

      const wi = workItem[0];

      // Run LLM skill to generate pack
      const packData = await runSkill(config.skillName, {
        work_item_id: wi.id,
        work_item_title: wi.title,
        work_item_body: wi.body || "",
        work_item_notes: wi.notes || "",
      });

      // Validate against schema
      const validated = config.schema.parse(packData);

      // Save to database using generic saver (with transaction support)
      await saveWorkItemPackGeneric({
        workItemId: wi.id,
        packType: config.packType,
        packData: validated,
      });

      return res.json({
        success: true,
        packType: config.packType,
        data: validated,
      });
    } catch (error: any) {
      console.error(`[${config.packType}] Error generating pack:`, error);
      return res.status(500).json({
        error: "Failed to generate pack",
        message: error.message,
      });
    }
  };
}

/**
 * Generic pack saver that works with the work_item_packs table
 * Uses transaction to handle concurrent regenerations safely
 */
export async function saveWorkItemPackGeneric(input: {
  workItemId: string;
  packType: string;
  packData: unknown;
}) {
  const { workItemId, packType, packData } = input;

  return await db.transaction(async (tx) => {
    // Check if a pack of this type already exists for this work item
    const existing = await tx
      .select()
      .from(workItemPacks)
      .where(and(eq(workItemPacks.workItemId, workItemId), eq(workItemPacks.packType, packType)))
      .limit(1);

    const now = new Date();

    if (existing && existing.length > 0) {
      // Update existing pack (increment version)
      const currentVersion = existing[0].version || 1;
      const updated = await tx
        .update(workItemPacks)
        .set({
          packData: packData as any,
          version: currentVersion + 1,
          updatedAt: now,
        })
        .where(eq(workItemPacks.id, existing[0].id))
        .returning();

      return updated[0];
    } else {
      // Insert new pack
      const inserted = await tx
        .insert(workItemPacks)
        .values({
          workItemId,
          packType,
          packData: packData as any,
          version: 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return inserted[0];
    }
  });
}

/**
 * Factory function to create Express route handlers for all packs
 * Returns an array of route configurations
 */
export function createPackRoutes(configs: PackConfig[]) {
  return configs.map((config) => ({
    method: "post" as const,
    path: `/api/work-items/:id/actions/${config.endpointSuffix}`,
    handler: createPackActionHandler(config),
    packType: config.packType,
    skillName: config.skillName,
  }));
}
