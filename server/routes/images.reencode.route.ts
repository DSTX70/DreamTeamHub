import express, { Request, Response } from "express";
import multer from "multer";
import { makeVariants, DEFAULT_PLAN } from "../images/transform";
import { getUserRoles } from "../security/roles";
import { s3Put } from "../images/s3";

export const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

// Require ops_admin for re-encode & replace (destructive operation)
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || !user.claims) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = user.claims.sub;
  const email = user.claims.email || "";
  const roles = getUserRoles(userId, email);
  
  if (!roles.includes("ops_admin")) {
    return res.status(403).json({ error: "Requires ops_admin role" });
  }
  
  next();
};

router.post(
  "/api/ops/images/reencode",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file?.buffer) return res.status(400).json({ error: "file is required" });

      const targetPrefix = String(req.body?.targetPrefix || "").trim();
      if (!targetPrefix) return res.status(400).json({ error: "targetPrefix is required" });

      const sizes = String(req.body?.sizes || "").trim();
      const widths = sizes
        ? sizes.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0)
        : DEFAULT_PLAN.sizes;

      const avifQ = req.body?.avifQ ? Number(req.body.avifQ) : DEFAULT_PLAN.quality.avif;
      const webpQ = req.body?.webpQ ? Number(req.body.webpQ) : DEFAULT_PLAN.quality.webp;
      const jpgQ = req.body?.jpgQ ? Number(req.body.jpgQ) : DEFAULT_PLAN.quality.jpg;

      const plan = {
        sizes: widths,
        formats: ["avif", "webp", "jpg"] as const,
        quality: { avif: avifQ, webp: webpQ, jpg: jpgQ }
      };

      const variants = await makeVariants(file.buffer, plan as any);

      const items: Array<{ key: string; width: number; ext: string; size: number }> = [];
      const totalsByExt: Record<string, number> = { avif: 0, webp: 0, jpg: 0 };
      let totalsBytes = 0;

      for (const v of variants) {
        const key = `${targetPrefix}-${v.width}.${v.ext}`;
        await s3Put(key, v.buffer, v.contentType);
        
        const size = v.buffer.length;
        items.push({ key, width: v.width, ext: v.ext, size });
        totalsByExt[v.ext] = (totalsByExt[v.ext] || 0) + size;
        totalsBytes += size;
      }

      console.log(`[ImagesReencode] Replaced ${items.length} variants at ${targetPrefix}`);
      res.json({ plan, items, totalsByExt, totalsBytes });
    } catch (e: any) {
      console.error("[ImagesReencode] error:", e?.message);
      res.status(500).json({ error: "reencode failed" });
    }
  }
);

export default router;
