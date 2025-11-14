import type { Request, Response, RequestHandler } from "express";
import type { DB } from "../db/types";
import type { PackConfig } from "./packRegistry";
import { runSkill } from "./runSkill";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { workItems, workItemPacks } from "@shared/schema";
import { getProductsForLine, getAllProducts, type CatalogProduct } from "../services/productCatalog";

/**
 * Helper to infer product line from work item title/body
 * Looks for keywords: ColorCue, Out Loud, Midnight Express
 */
function inferProductLine(workItem: { title: string; body: string | null }): string | null {
  const text = `${workItem.title} ${workItem.body || ""}`.toLowerCase();
  
  if (text.includes("colorcue") || text.includes("color cue")) {
    return "ColorCue";
  }
  if (text.includes("out loud") || text.includes("outloud")) {
    return "Out Loud";
  }
  if (text.includes("midnight express")) {
    return "Midnight Express";
  }
  
  return null;
}

/**
 * Convert catalog product to serializable format for LLM
 */
function serializeProduct(p: CatalogProduct) {
  return {
    sku: p.sku,
    line: p.line,
    collection: p.collection,
    series: p.series,
    product_name: p.productName,
    variant_name: p.variantName,
    brand_slug: p.brandSlug,
    url_slug: p.urlSlug,
  };
}

/**
 * Extract and validate all SKUs from a generated pack
 * Supports different pack types with different structures
 * Throws error if required SKU fields are missing or empty
 * For Lifestyle packs, also validates inter-section SKU consistency
 */
function extractSKUsFromPack(packData: any, packType: string): string[] {
  const skus = new Set<string>();

  if (packType === "lifestyle") {
    // Lifestyle packs MUST have SKUs in shot_boards, export_plan, alt_text_rows, seo_meta_rows
    const sections = [
      { name: "shot_boards", data: packData.shot_boards },
      { name: "export_plan", data: packData.export_plan },
      { name: "alt_text_rows", data: packData.alt_text_rows },
      { name: "seo_meta_rows", data: packData.seo_meta_rows },
    ];

    // Track SKUs per section for inter-section consistency validation
    const sectionSKUs = new Map<string, Set<string>>();

    for (const section of sections) {
      if (!section.data || !Array.isArray(section.data) || section.data.length === 0) {
        throw new Error(`Lifestyle pack missing required section: ${section.name}`);
      }

      const sectionSkuSet = new Set<string>();

      section.data.forEach((item: any, index: number) => {
        if (!item.sku || typeof item.sku !== "string" || item.sku.trim() === "") {
          throw new Error(
            `Missing or empty SKU in ${section.name}[${index}]. All ${section.name} items must have valid SKU fields.`
          );
        }
        const normalizedSKU = item.sku.trim();
        skus.add(normalizedSKU);
        sectionSkuSet.add(normalizedSKU);
      });

      sectionSKUs.set(section.name, sectionSkuSet);
    }

    // Validate that we have at least one SKU
    if (skus.size === 0) {
      throw new Error("Lifestyle pack contains no valid SKUs");
    }

    // Validate inter-section consistency:
    // All SKUs used in export_plan, alt_text_rows, and seo_meta_rows must be from shot_boards
    const shotBoardSKUs = sectionSKUs.get("shot_boards")!;
    
    for (const [sectionName, sectionSkuSet] of sectionSKUs.entries()) {
      if (sectionName === "shot_boards") continue;
      
      for (const sku of sectionSkuSet) {
        if (!shotBoardSKUs.has(sku)) {
          throw new Error(
            `SKU consistency violation: ${sectionName} contains SKU "${sku}" which is not defined in shot_boards. All SKUs must originate from shot_boards.`
          );
        }
      }
    }
  } else if (packType === "ecom_pdp_aplus_content") {
    // PDP packs may have optional SKUs in cross_sell_suggestions.sku_hint
    // These are optional, so we don't enforce them, but if present they must be valid
    if (packData.cross_sell_suggestions && Array.isArray(packData.cross_sell_suggestions)) {
      packData.cross_sell_suggestions.forEach((cs: any, index: number) => {
        // sku_hint is optional, so only validate if present
        if (cs.sku_hint) {
          if (typeof cs.sku_hint !== "string" || cs.sku_hint.trim() === "") {
            throw new Error(
              `Invalid SKU in cross_sell_suggestions[${index}]. If sku_hint is provided, it must be a non-empty string.`
            );
          }
          skus.add(cs.sku_hint.trim());
        }
      });
    }
  }

  return Array.from(skus);
}

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

      // Build input for LLM skill
      const baseInput = {
        work_item_id: wi.id,
        work_item_title: wi.title,
        work_item_body: wi.body || "",
        work_item_notes: wi.notes || "",
      };

      // For catalog-aware packs, inject product catalog
      const catalogAwarePacks = ["lifestyle", "ecom_pdp_aplus_content"];
      let skillInput: any = baseInput;

      if (catalogAwarePacks.includes(config.packType)) {
        const inferredLine = inferProductLine(wi);
        let catalogProducts: CatalogProduct[] = [];

        if (inferredLine) {
          catalogProducts = await getProductsForLine(inferredLine);
          console.log(`[${config.packType}] Fetched ${catalogProducts.length} products for line: ${inferredLine}`);
        } else {
          catalogProducts = await getAllProducts();
          console.log(`[${config.packType}] Fetched ${catalogProducts.length} products (all lines)`);
        }

        skillInput = {
          ...baseInput,
          products: catalogProducts.map(serializeProduct),
        };
      }

      // Run LLM skill to generate pack
      const packData = await runSkill({
        skillName: config.skillName,
        input: skillInput,
      });

      // Validate against schema
      const validated = config.schema.parse(packData);

      // For catalog-aware packs, validate SKUs against catalog
      if (catalogAwarePacks.includes(config.packType) && skillInput.products) {
        try {
          const catalogSKUs = new Set(skillInput.products.map((p: any) => p.sku));
          const extractedSKUs = extractSKUsFromPack(validated, config.packType);
          
          // Check for SKUs not in catalog
          const invalidSKUs = extractedSKUs.filter(sku => !catalogSKUs.has(sku));
          
          if (invalidSKUs.length > 0) {
            console.error(`[${config.packType}] Invalid SKUs detected: ${invalidSKUs.join(", ")}`);
            return res.status(400).json({
              error: "Catalog validation failed",
              message: "Generated pack contains SKUs not found in product catalog",
              invalidSKUs,
              validSKUs: Array.from(catalogSKUs),
            });
          }
          
          console.log(`[${config.packType}] ✅ All ${extractedSKUs.length} SKU(s) validated against catalog`);
        } catch (extractionError: any) {
          // Handle SKU extraction/validation errors (missing/empty SKU fields)
          console.error(`[${config.packType}] SKU extraction failed:`, extractionError.message);
          return res.status(400).json({
            error: "SKU validation failed",
            message: extractionError.message,
          });
        }
      }

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
