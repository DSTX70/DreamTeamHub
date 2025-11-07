import express, { Request, Response } from "express";
import { affiliateRatesDao } from "../db/affiliateDao.rates";
import { DEFAULT_COMMISSION_RATE } from "../../shared/affiliates/config";
import { toCsv } from "../../shared/utils/csv";

export const router = express.Router();

router.get("/api/ops/aff/payouts", async (req: Request, res: Response) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  const def = req.query.defaultRate ? Number(req.query.defaultRate) : DEFAULT_COMMISSION_RATE;
  if (!from || !to) return res.status(400).json({ error: "from & to (ISO) required" });
  const data = await affiliateRatesDao.payouts({ fromISO: from, toISO: to, defaultRate: def });
  res.json({ ...data, window: { from, to }, defaultRate: def });
});

router.get("/api/ops/aff/payouts.csv", async (req: Request, res: Response) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  const def = req.query.defaultRate ? Number(req.query.defaultRate) : DEFAULT_COMMISSION_RATE;
  const data = await affiliateRatesDao.payouts({ fromISO: from, toISO: to, defaultRate: def });
  const rows: (string|number)[][] = [
    ["code","name","status","revenue","rate","commission","from","to"],
    ...data.items.map(it => [it.code, it.name, it.status, it.revenue.toFixed(2), (it.rate*100).toFixed(2)+"%", it.commission.toFixed(2), from, to])
  ];
  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="affiliate_payouts_${Date.now()}.csv"`);
  res.send(csv);
});

export default router;
