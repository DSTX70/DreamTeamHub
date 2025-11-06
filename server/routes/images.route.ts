import express, { Request, Response } from "express";
import multer from "multer";
import { ensureAllowedSku, listAllowlist, upsertAllowlist, removeAllowlist, listVariants, uploadTransformedSet } from "../images/uploader";
import { sniffMimeOrThrow } from "../images/mime";

export const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

// ---- Allowlist CRUD ----
router.get("/api/ops/images/allowlist", (_req: Request, res: Response) => {
  res.json({ items: listAllowlist() });
});

router.post("/api/ops/images/allowlist", express.json(), (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (const it of items) {
    if (!it?.sku || !it?.baseKey) continue;
    upsertAllowlist(it.sku, it.baseKey);
  }
  res.json({ ok: true });
});

router.delete("/api/ops/images/allowlist/:sku", (req: Request, res: Response) => {
  removeAllowlist(String(req.params.sku));
  res.json({ ok: true });
});

// ---- Upload & transform ----
router.post("/api/ops/images/upload", upload.array("files", 20), async (req: Request, res: Response) => {
  try {
    const sku = String(req.body?.sku || "");
    const baseKey = String(req.body?.baseKey || "");
    const cacheControl = String(req.body?.cacheControl || process.env.IMG_DEFAULT_CACHE_CONTROL || "public, max-age=31536000, immutable");
    if (!sku || !baseKey) return res.status(400).json({ error: "sku and baseKey required" });

    ensureAllowedSku(sku, baseKey);

    const results: any[] = [];
    for (const f of (req.files as Express.Multer.File[] || [])) {
      // MIME sniff — reject svg/xml by content
      const mime = sniffMimeOrThrow(f.buffer);
      if (!/^image\/(png|jpeg|jpg|webp|avif)$/.test(mime)) {
        return res.status(415).json({ error: `Unsupported image type: ${mime}` });
      }
      const r = await uploadTransformedSet({ sku, baseKey, filename: f.originalname, bytes: f.buffer, cacheControl });
      results.push(r);
    }
    res.json({ ok: true, items: results });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "upload failed" });
  }
});

// ---- List variants ----
router.get("/api/ops/images/variants/:baseKey", async (req: Request, res: Response) => {
  const baseKey = String(req.params.baseKey);
  const list = await listVariants(baseKey);
  res.json({ items: list });
});

export default router;
