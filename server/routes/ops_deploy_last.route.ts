// server/routes/ops_deploy_last.route.ts
import type { Request, Response } from "express";
import { Router } from "express";

const router = Router();

// Shared state with admin_deploy.route.ts
type LastDeploy = {
  ts: string;
  sha?: string;
  tag?: string;
  actor?: string;
};

// Export for use by admin route
export let lastDeployState: LastDeploy | null = null;

export function setLastDeploy(deploy: LastDeploy) {
  lastDeployState = deploy;
}

// GET /api/ops/deploy/last (session-authenticated, read-only)
router.get("/last", (_req: Request, res: Response) => {
  res.json({ lastDeploy: lastDeployState });
});

export default router;
