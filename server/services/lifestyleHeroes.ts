import OpenAI from "openai";
import sharp from "sharp";
import { storage } from "../storage";
import { s3Put } from "../images/s3";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../images/s3";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const bucket = process.env.AWS_S3_BUCKET!;

interface GenerateOptions {
  shotIds?: string[];
  dryRun?: boolean;
  overwrite?: boolean;
}

interface GeneratedImage {
  shot_id: string;
  filename: string;
  width: number;
  height: number;
}

interface SkippedImage {
  shot_id: string;
  filename: string;
  reason: "EXISTS";
}

export interface GenerateLifestyleHeroesResult {
  ok: true;
  workItemId: number;
  dryRun: boolean;
  overwrite: boolean;
  generated: GeneratedImage[];
  skippedExisting: SkippedImage[];
  missingShots: string[];
}

export interface GenerateLifestyleHeroesError {
  ok: false;
  error: "LIFESTYLE_PACK_NOT_FOUND" | "INTERNAL_ERROR";
  message?: string;
}

export type GenerateLifestyleHeroesResponse =
  | GenerateLifestyleHeroesResult
  | GenerateLifestyleHeroesError;

async function checkObjectExists(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

function sanitizeInstructions(instructions: string | null | undefined): string | null {
  if (!instructions) return null;
  
  // Trim and collapse whitespace
  const cleaned = instructions.trim().replace(/\s+/g, ' ');
  
  // Enforce max length (600 chars)
  if (cleaned.length === 0) return null;
  if (cleaned.length > 600) {
    return cleaned.substring(0, 600);
  }
  
  return cleaned;
}

function buildPromptFromShotBoard(board: any, userInstructions?: string | null): string {
  const {
    scenario,
    camera,
    framing,
    lighting,
    color_palette,
    notes,
    card_title,
    collection,
    sku,
  } = board;

  const parts = [
    `Photorealistic lifestyle hero image for greeting card "${card_title}" (SKU: ${sku}) from the FabCardCo "${collection}" collection.`,
    ``,
    `SCENARIO: ${scenario}`,
    `CAMERA: ${camera}`,
    `FRAMING: ${framing}`,
    `LIGHTING: ${lighting}`,
    `COLOR PALETTE: ${color_palette}`,
  ];

  if (notes) {
    parts.push(`NOTES: ${notes}`);
  }

  parts.push(
    ``,
    `Style: Modern editorial photography, shallow depth of field, high resolution, professional commercial quality.`,
    `The greeting card should be prominently featured and clearly visible in the scene.`,
    `No additional text overlays. Natural, authentic lifestyle composition.`
  );

  // Add user refinement block if instructions exist
  const sanitized = sanitizeInstructions(userInstructions);
  if (sanitized) {
    parts.push(
      ``,
      `USER REFINEMENT:`,
      sanitized,
      ``,
      `Important: Respect all base scenario details above and keep the greeting card hero prominent. User refinement should enhance, not replace, the core composition.`
    );
  }

  return parts.join("\n");
}

export async function generateLifestyleHeroesForWorkItem(
  workItemId: number,
  options: GenerateOptions = {}
): Promise<GenerateLifestyleHeroesResponse> {
  const { shotIds, dryRun = false, overwrite = false } = options;

  try {
    const packs = await storage.getWorkItemPacksByType(
      workItemId,
      "lifestyle"
    );

    if (!packs || packs.length === 0) {
      return {
        ok: false,
        error: "LIFESTYLE_PACK_NOT_FOUND",
      };
    }

    // Packs are already sorted by version descending from storage query
    const latestPack = packs[0];
    const packData = latestPack.packData as any;

    const exportPlan = packData.export_plan as any[];
    const shotBoards = packData.shot_boards as any[];

    if (!exportPlan || !shotBoards) {
      return {
        ok: false,
        error: "LIFESTYLE_PACK_NOT_FOUND",
        message: "Pack missing required export_plan or shot_boards data",
      };
    }

    // Fetch all shot settings for this work item (once)
    const shotSettings = await storage.getLifestyleHeroShotSettingsForWorkItem(workItemId);
    const instructionsMap: Record<string, string | null> = {};
    shotSettings.forEach(setting => {
      instructionsMap[setting.shotId] = setting.promptInstructions;
    });

    const filteredPlan =
      shotIds && shotIds.length > 0
        ? exportPlan.filter((row) => shotIds.includes(row.shot_id))
        : exportPlan;

    const byShot = new Map<string, any[]>();
    for (const row of filteredPlan) {
      if (!byShot.has(row.shot_id)) byShot.set(row.shot_id, []);
      byShot.get(row.shot_id)!.push(row);
    }

    const generated: GeneratedImage[] = [];
    const skippedExisting: SkippedImage[] = [];
    const missingShots: string[] = [];

    for (const [shotId, rows] of Array.from(byShot.entries())) {
      const board = shotBoards.find((b: any) => b.shot_id === shotId);
      if (!board) {
        missingShots.push(shotId);
        continue;
      }

      const targets: typeof rows = [];
      for (const row of rows) {
        if (!overwrite) {
          const exists = await checkObjectExists(row.filename);
          if (exists) {
            skippedExisting.push({
              shot_id: shotId,
              filename: row.filename,
              reason: "EXISTS",
            });
            continue;
          }
        }
        targets.push(row);
      }

      if (targets.length === 0) continue;

      if (dryRun) {
        for (const t of targets) {
          generated.push({
            shot_id: shotId,
            filename: t.filename,
            width: t.width,
            height: t.height,
          });
        }
        continue;
      }

      console.log(
        `[LifestyleHeroes] Generating master image for shot ${shotId}...`
      );
      const userInstructions = instructionsMap[shotId] || null;
      const prompt = buildPromptFromShotBoard(board, userInstructions);

      const imgResp = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1792x1024",
        quality: "hd",
        n: 1,
        response_format: "b64_json",
      });

      if (!imgResp.data || imgResp.data.length === 0 || !imgResp.data[0].b64_json) {
        throw new Error("OpenAI returned no image data");
      }
      const b64 = imgResp.data[0].b64_json;
      const masterBuffer = Buffer.from(b64, "base64");

      // Get next version number
      const versionNumber = await storage.getNextVersionNumber(workItemId, shotId);
      const versionPath = `fcc/lifestyle_heroes/${workItemId}/${shotId}/v${versionNumber}`;

      // Upload master image
      const masterS3Key = `${versionPath}/master.webp`;
      await s3Put(masterS3Key, masterBuffer, "image/webp");
      console.log(`[LifestyleHeroes] Uploaded master image to ${masterS3Key}`);

      // Upload cropped versions
      const s3Keys: { [key: string]: string } = { master: masterS3Key };

      for (const t of targets) {
        console.log(
          `[LifestyleHeroes] Cropping and uploading ${t.size_label} (${t.width}x${t.height}) for shot ${shotId}...`
        );

        const resized = await sharp(masterBuffer)
          .resize(t.width, t.height, {
            fit: "cover",
            position: "centre",
          })
          .webp({ quality: 90 })
          .toBuffer();

        const versionedKey = `${versionPath}/${t.size_label.toLowerCase()}.webp`;
        await s3Put(versionedKey, resized, "image/webp");
        s3Keys[t.size_label.toLowerCase()] = versionedKey;

        // Also upload to original path for backward compatibility
        await s3Put(t.filename, resized, "image/webp");

        generated.push({
          shot_id: shotId,
          filename: t.filename,
          width: t.width,
          height: t.height,
        });
      }

      // Save version to database
      const isFirstVersion = versionNumber === 1;
      await storage.createLifestyleHeroVersion({
        workItemId,
        shotId,
        versionNumber,
        masterS3Key: s3Keys.master,
        desktopS3Key: s3Keys.desktop || s3Keys.master,
        tabletS3Key: s3Keys.tablet || s3Keys.master,
        mobileS3Key: s3Keys.mobile || s3Keys.master,
        promptUsed: prompt,
        isActive: isFirstVersion,
      });

      console.log(`[LifestyleHeroes] Saved version ${versionNumber} for shot ${shotId} (active: ${isFirstVersion})`);
    }

    console.log(
      `[LifestyleHeroes] Completed: ${generated.length} images generated, ${skippedExisting.length} skipped`
    );

    return {
      ok: true,
      workItemId,
      dryRun,
      overwrite,
      generated,
      skippedExisting,
      missingShots,
    };
  } catch (err: any) {
    console.error("[LifestyleHeroes] Error:", err);
    return {
      ok: false,
      error: "INTERNAL_ERROR",
      message: err.message,
    };
  }
}
