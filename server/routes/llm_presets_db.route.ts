// server/routes/llm_presets_db.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`SELECT id, family, label, tips, augment_lines AS "augmentLines", enabled, updated_at AS "updatedAt" FROM llm_presets ORDER BY updated_at DESC`);
  res.json({ presets: rows });
});

router.post("/", async (req: Request, res: Response) => {
  const b = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO llm_presets (family, label, tips, augment_lines, enabled) VALUES ($1,$2,$3,$4,$5) RETURNING id, family, label, tips, augment_lines AS "augmentLines", enabled, updated_at AS "updatedAt"`,
    [b.family || "gpt", b.label || "Untitled", JSON.stringify(b.tips || []), JSON.stringify(b.augmentLines || []), b.enabled ?? true]
  );
  res.json({ ok: true, preset: rows[0] });
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const { rows } = await pool.query(
    `UPDATE llm_presets SET family=$1, label=$2, tips=$3, augment_lines=$4, enabled=$5, updated_at=NOW() WHERE id=$6 RETURNING id, family, label, tips, augment_lines AS "augmentLines", enabled, updated_at AS "updatedAt"`,
    [b.family, b.label, JSON.stringify(b.tips || []), JSON.stringify(b.augmentLines || []), b.enabled ?? true, id]
  );
  if (!rows.length) return res.status(404).json({ ok: false, error: "not found" });
  res.json({ ok: true, preset: rows[0] });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await pool.query(`DELETE FROM llm_presets WHERE id=$1`, [id]);
  res.json({ ok: true });
});

export default router;
