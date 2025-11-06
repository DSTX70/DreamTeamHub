import express, { Request, Response } from "express";

export const router = express.Router();

// Optional passthrough if you serve via app rather than direct S3/CloudFront
router.get("/img/*", (req: Request, res: Response) => {
  const key = String(req.params[0] || "");
  // In a real deployment you'd proxy from S3 or redirect to CDN URL.
  // This is just a placeholder response.
  res.setHeader("Cache-Control", process.env.IMG_DEFAULT_CACHE_CONTROL || "public, max-age=31536000, immutable");
  res.status(200).end(`Image proxy placeholder for key: ${key}`);
});

export default router;
