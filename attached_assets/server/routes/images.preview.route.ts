import express, { Request, Response } from "express";
import multer from "multer";
import { makeVariants, DEFAULT_PLAN } from "../images/transform";

export const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

router.post("/api/ops/images/preview", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer) return res.status(400).json({ error: "file is required" });

    const sizes = String(req.body?.sizes || "").trim();
    const widths = sizes
      ? sizes.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0)
      : DEFAULT_PLAN.sizes;

    const avifQ = req.body?.avifQ ? Number(req.body.avifQ) : DEFAULT_PLAN.quality.avif;
    const webpQ = req.body?.webpQ ? Number(req.body.webpQ) : DEFAULT_PLAN.quality.webp;
    const jpgQ  = req.body?.jpgQ  ? Number(req.body.jpgQ)  : DEFAULT_PLAN.quality.jpg;

    const plan = {
      sizes: widths,
      formats: ["avif","webp","jpg"] as const,
      quality: { avif: avifQ, webp: webpQ, jpg: jpgQ }
    };

    const variants = await makeVariants(file.buffer, plan as any);

    const items = variants.map(v => ({
      width: v.width,
      ext: v.ext,
      size: v.buffer.length,
    }));

    const totalsByExt: Record<string, number> = { avif: 0, webp: 0, jpg: 0 };
    let totalsBytes = 0;
    for (const it of items) {
      totalsByExt[it.ext] = (totalsByExt[it.ext] || 0) + it.size;
      totalsBytes += it.size;
    }

    res.json({ plan, items, totalsByExt, totalsBytes });
  } catch (e: any) {
    console.error("preview error:", e?.message);
    res.status(500).json({ error: "preview failed" });
  }
});

export default router;
