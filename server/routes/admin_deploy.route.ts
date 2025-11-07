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

// Middleware to check API token for deploy mark endpoint
function requireDeployToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const validToken = process.env.DTH_API_TOKEN || process.env.DEPLOY_TOKEN;
  
  if (!validToken) {
    // If no token is configured, allow the request (for local dev)
    return next();
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  
  const token = authHeader.substring(7);
  if (token !== validToken) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  next();
}

// POST /api/admin/deploy/mark (requires API token)
router.post("/mark", requireDeployToken, (req: Request, res: Response) => {
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
