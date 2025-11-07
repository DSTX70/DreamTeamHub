// server/routes/admin_deploy.route.ts
import type { Request, Response } from "express";
import { Router } from "express";

type LastDeploy = {
  ts: string;
  sha?: string;
  tag?: string;
  actor?: string;
};

let lastDeploy: LastDeploy | null = null;

const router = Router();

// POST /api/admin/deploy/mark
router.post("/mark", (req: Request, res: Response) => {
  const sha = process.env.GITHUB_SHA || process.env.RELEASE_SHA || req.body?.sha;
  const tag = process.env.RELEASE_TAG || req.body?.tag;
  const actor = process.env.GITHUB_ACTOR || req.body?.actor;
  lastDeploy = { ts: new Date().toISOString(), sha, tag, actor };
  res.json({ ok: true, lastDeploy });
});

// GET /api/admin/deploy/last
router.get("/last", (_req: Request, res: Response) => {
  res.json({ lastDeploy });
});

export default router;
