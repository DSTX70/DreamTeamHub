import express, { Request, Response } from "express";
import { affiliateRatesDao } from "../db/affiliateDao.rates";

export const router = express.Router();

router.get("/api/ops/aff/affiliates", async (_req: Request, res: Response) => {
  const items = await affiliateRatesDao.listAffiliates();
  res.json({ items });
});

router.post("/api/ops/aff/affiliates", express.json(), async (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await affiliateRatesDao.setMany(items.map((x:any)=> ({
    code: String(x.code).toUpperCase(),
    name: x.name ? String(x.name) : undefined,
    commissionRate: (x.commissionRate === null || x.commissionRate === "") ? null : Number(x.commissionRate),
    status: x.status ? String(x.status) : undefined
  })));
  const out = await affiliateRatesDao.listAffiliates();
  res.json({ ok: true, items: out });
});

export default router;
