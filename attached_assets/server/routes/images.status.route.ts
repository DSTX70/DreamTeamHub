import express, { Request, Response } from "express";
import { s3List } from "../images/s3";

export const router = express.Router();

router.get("/api/ops/images/status", async (_req: Request, res: Response) => {
  const bucket = process.env.AWS_S3_BUCKET || "";
  const region = process.env.AWS_REGION || "us-east-1";
  const defaultCacheControl = process.env.IMG_DEFAULT_CACHE_CONTROL || "public, max-age=31536000, immutable";
  const hasBucketEnv = !!bucket;
  let probeOk = false;
  if (hasBucketEnv) {
    try {
      await s3List(""); // best-effort probe
      probeOk = true;
    } catch (_e) {
      probeOk = false;
    }
  }
  res.json({ bucket, region, defaultCacheControl, hasBucketEnv, probeOk });
});

export default router;
