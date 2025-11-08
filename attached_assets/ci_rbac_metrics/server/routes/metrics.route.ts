// server/routes/metrics.route.ts
import type { Request, Response } from "express";
import { Router } from "express";
import { register } from "../metrics/prom";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export default router;
