import type { Request, Response, RequestHandler } from "express";
import type { DB } from "../db/types";
import type { PackConfig } from "./packRegistry";
import { runSkill } from "./runSkill";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { workItems, workItemPacks } from "@shared/schema";

/**
 * Factory function to create a pack generation action handler
 * Returns an Express-compatible RequestHandler that closes over the global db
 */
export function createPackActionHandler(config: PackConfig): RequestHandler {
  return async (req: Request, res: Response) => {
    try {
      const workItemId = parseInt(req.params.id, 10);
      
      if (isNaN(workItemId)) {
        return res.status(400).json({ error: "Invalid work item ID" });
      }
      
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
      const packData = await runSkill({
        skillName: config.skillName,
        input: {
          work_item_id: wi.id,
          work_item_title: wi.title,
          work_item_body: wi.body || "",
          work_item_notes: wi.notes || "",
        },
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
      
      // Distinguish validation errors (400) from server errors (500)
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "Validation failed",
          message: "Generated pack data did not match expected schema",
          details: error.errors,
        });
      }
      
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
 * Always inserts a new row with incremented version (never updates)
 */
export async function saveWorkItemPackGeneric(input: {
  workItemId: number;
  packType: string;
  packData: unknown;
}) {
  const { workItemId, packType, packData } = input;

  return await db.transaction(async (tx) => {
    // Find the highest version for this work item + pack type combination
    const existingPacks = await tx
      .select()
      .from(workItemPacks)
      .where(and(eq(workItemPacks.workItemId, workItemId), eq(workItemPacks.packType, packType)))
      .orderBy(desc(workItemPacks.version));

    // Calculate next version (1 if no existing packs, otherwise max version + 1)
    const nextVersion = existingPacks.length > 0 ? existingPacks[0].version + 1 : 1;

    const now = new Date();

    // Always insert a new row with the next version
    const inserted = await tx
      .insert(workItemPacks)
      .values({
        workItemId,
        packType,
        packData: packData as any,
        version: nextVersion,
        createdAt: now,
      })
      .returning();

    console.log(`[saveWorkItemPackGeneric] Saved ${packType} pack for work item ${workItemId}, version ${nextVersion}`);
    return inserted[0];
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
