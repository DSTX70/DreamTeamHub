import express, { Request, Response } from "express";
import cookie from "cookie";
import { affiliateDao } from "../db/affiliateDao";
import { DEFAULT_COMMISSION_RATE, AFF_COOKIE_NAME } from "../../shared/affiliates/config";
import { toCsv } from "../../shared/utils/csv";

export const router = express.Router();

function getCookie(req: Request, name: string): string | undefined {
  const anyReq = req as any;
  if (anyReq.cookies && name in anyReq.cookies) return anyReq.cookies[name];
  const raw = req.headers["cookie"];
  if (!raw) return undefined;
  const parsed = cookie.parse(raw);
  return parsed[name];
}

router.get("/api/aff/click", async (req: Request, res: Response) => {
  const code = ((req.query.code as string) || "").trim().toUpperCase();
  const source = ((req.query.source as string) || "").trim() || undefined;
  if (!code) return res.status(400).json({ error: "Missing ?code" });

  const ua = req.headers["user-agent"] || "";
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  await affiliateDao.recordClick({ code, source, ua: String(ua), ip: String(ip) });

  res.cookie(AFF_COOKIE_NAME, code, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "lax" });
  const pixel = Buffer.from("R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
  res.setHeader("Content-Type", "image/gif");
  res.send(pixel);
});

router.post("/api/aff/attribute", express.json(), async (req: Request, res: Response) => {
  const { orderId, orderTotal, aff } = req.body || {};
  if (!orderId || typeof orderTotal !== "number") {
    return res.status(400).json({ error: "orderId (string) and orderTotal (number) required" });
  }
  const cookieCode = getCookie(req, AFF_COOKIE_NAME);
  const code = ((aff || cookieCode || "") as string).toUpperCase();
  await affiliateDao.recordAttribution({ orderId: String(orderId), orderTotal: Number(orderTotal), code: code || null });
  return res.json({ ok: true, code: code || null });
});

router.get("/api/ops/aff/report", async (req: Request, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const rate = req.query.rate ? Number(req.query.rate) : DEFAULT_COMMISSION_RATE;

  const data = await affiliateDao.getReport({ fromISO: from, toISO: to, commissionRate: rate });
  res.json({ items: data.items, totals: data.totals, window: data.window, commissionRate: rate });
});

router.get("/api/ops/aff/report.csv", async (req: Request, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const rate = req.query.rate ? Number(req.query.rate) : DEFAULT_COMMISSION_RATE;

  const data = await affiliateDao.getReport({ fromISO: from, toISO: to, commissionRate: rate });
  const rows: (string | number)[][] = [
    ["affiliate", "clicks", "uniqueVisitors", "orders", "revenue", "commission", "conversionRate", "windowFrom", "windowTo"],
    ...data.items.map(it => [
      it.code, it.clicks, it.uniqueVisitors, it.orders,
      it.revenue.toFixed(2), it.commission.toFixed(2), (it.conversionRate * 100).toFixed(2) + "%",
      data.window.fromISO, data.window.toISO
    ])
  ];
  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="affiliate_report_${Date.now()}.csv"`);
  res.send(csv);
});

router.get("/api/ops/aff/events", async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const items = await affiliateDao.listEvents(limit);
  res.json({ items });
});

export default router;
