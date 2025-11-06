import express, { Request, Response } from "express";
import { inventoryDao } from "../db/inventoryDao";

export const router = express.Router();

router.get("/api/ops/inventory/thresholds", async (_req: Request, res: Response) => {
  const items = (await inventoryDao.listProducts()).map(p => ({
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    threshold: p.threshold,
    status: p.stock <= p.threshold ? "LOW" : "OK",
    updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt
  }));
  res.json({ items });
});

router.post("/api/ops/inventory/thresholds", express.json(), async (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (const it of items) {
    if (!it || typeof it.sku !== "string") continue;
    const thr = Number(it.threshold);
    if (!Number.isFinite(thr) || thr < 0) continue;
    await inventoryDao.setThreshold(it.sku, Math.floor(thr));
  }
  res.json({ ok: true });
});

router.get("/api/ops/inventory/low-stock", async (_req: Request, res: Response) => {
  const list = await inventoryDao.getLowStock();
  res.json({ items: list });
});

router.post("/api/ops/inventory/recount", express.json(), async (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (const it of items) {
    if (!it || typeof it.sku !== "string") continue;
    const stock = Number(it.stock);
    if (!Number.isFinite(stock) || stock < 0) continue;
    await inventoryDao.setStock(it.sku, Math.floor(stock));
  }
  res.json({ ok: true });
});

router.get("/api/ops/inventory/events", async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json({ items: await inventoryDao.listEvents(limit) });
});

export default router;
