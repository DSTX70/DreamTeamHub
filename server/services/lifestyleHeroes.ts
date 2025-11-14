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

function buildPromptFromShotBoard(board: any): string {
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

    const latestPack = packs.sort((a, b) => b.version - a.version)[0];
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

    for (const [shotId, rows] of byShot.entries()) {
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
      const prompt = buildPromptFromShotBoard(board);

      const imgResp = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1792x1024",
        quality: "hd",
        n: 1,
        response_format: "b64_json",
      });

      const b64 = imgResp.data[0].b64_json!;
      const masterBuffer = Buffer.from(b64, "base64");

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

        await s3Put(t.filename, resized, "image/webp");

        generated.push({
          shot_id: shotId,
          filename: t.filename,
          width: t.width,
          height: t.height,
        });
      }
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
