import express, { Request, Response } from "express";
import { InventoryStore } from "../storage/inventoryStore";

export const router = express.Router();
const store = InventoryStore.get();

router.get("/api/ops/inventory/thresholds", (_req: Request, res: Response) => {
  const items = store.listProducts().map(p => ({
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    threshold: p.threshold,
    status: p.stock <= p.threshold ? "LOW" : "OK",
    updatedAt: p.updatedAt,
  }));
  res.json({ items });
});

router.post("/api/ops/inventory/thresholds", express.json(), (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (const it of items) {
    if (!it || typeof it.sku !== "string") continue;
    const thr = Number(it.threshold);
    if (!Number.isFinite(thr) || thr < 0) continue;
    store.setThreshold(it.sku, Math.floor(thr));
  }
  res.json({ ok: true });
});

router.get("/api/ops/inventory/low-stock", (_req: Request, res: Response) => {
  const list = store.getLowStock();
  res.json({ items: list });
});

router.post("/api/ops/inventory/recount", express.json(), (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (const it of items) {
    if (!it || typeof it.sku !== "string") continue;
    const stock = Number(it.stock);
    if (!Number.isFinite(stock) || stock < 0) continue;
    store.setStock(it.sku, Math.floor(stock));
  }
  res.json({ ok: true });
});

router.get("/api/ops/inventory/events", (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json({ items: store.listEvents(limit) });
});

export default router;
