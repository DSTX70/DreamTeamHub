// server/routes/llm_augment.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { db } from "../db";

const router = Router();

/**
 * POST /api/llm/augment
 * body: { family: "gpt"|"claude"|"gemini", prompt: string }
 * Returns { augmented: string, tips: string[] }
 */
router.post("/", async (req: Request, res: Response) => {
  const { family = "gpt", prompt = "" } = req.body || {};
  const { rows } = await db.query(
    `SELECT augment_lines AS "augmentLines", tips FROM llm_presets WHERE family=$1 AND enabled=true ORDER BY updated_at DESC LIMIT 1`,
    [family]
  );
  const preset = rows[0] || { augmentLines: [], tips: [] };
  const lines: string[] = Array.isArray(preset.augmentLines) ? preset.augmentLines : [];
  const augmented = [prompt, ...lines].join("\n");
  res.json({ augmented, tips: preset.tips || [] });
});

export default router;
