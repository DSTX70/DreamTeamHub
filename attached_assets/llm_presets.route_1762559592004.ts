// server/routes/llm_presets.route.ts
import type { Request, Response } from "express";
import { Router } from "express";

type Preset = {
  id: string;
  family: "gpt" | "claude" | "gemini";
  label: string;
  tips: string[];
  augmentLines: string[];
  enabled: boolean;
  updatedAt: string;
};

const router = Router();
const store: Record<string, Preset> = {};

function nid() { return Math.random().toString(36).slice(2); }

// GET /api/llm/presets
router.get("/", (_req: Request, res: Response) => {
  res.json({ presets: Object.values(store) });
});

// POST /api/llm/presets
router.post("/", (req: Request, res: Response) => {
  const body = req.body || {};
  const id = nid();
  const preset: Preset = {
    id,
    family: body.family || "gpt",
    label: body.label || "Untitled",
    tips: body.tips || [],
    augmentLines: body.augmentLines || [],
    enabled: body.enabled ?? true,
    updatedAt: new Date().toISOString(),
  };
  store[id] = preset;
  res.json({ ok: true, preset });
});

// PUT /api/llm/presets/:id
router.put("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  if (!store[id]) return res.status(404).json({ ok: false, error: "not found" });
  const body = req.body || {};
  store[id] = { ...store[id], ...body, updatedAt: new Date().toISOString() };
  res.json({ ok: true, preset: store[id] });
});

// DELETE /api/llm/presets/:id
router.delete("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  delete store[id];
  res.json({ ok: true });
});

export default router;
