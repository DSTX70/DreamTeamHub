// server/routes/admin_deploy.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { setLastDeploy, lastDeployState } from "./ops_deploy_last.route";

const router = Router();

// POST /api/admin/deploy/mark (protected by requireAdmin middleware at mount point)
router.post("/mark", (req: Request, res: Response) => {
  const sha = process.env.GITHUB_SHA || process.env.RELEASE_SHA || req.body?.sha;
  const tag = process.env.RELEASE_TAG || req.body?.tag;
  const actor = process.env.GITHUB_ACTOR || req.body?.actor;
  const deploy = { ts: new Date().toISOString(), sha, tag, actor };
  setLastDeploy(deploy);
  res.json({ ok: true, lastDeploy: deploy });
});

// GET /api/admin/deploy/last
router.get("/last", (_req: Request, res: Response) => {
  res.json({ lastDeploy: lastDeployState });
});

export default router;
