// server/routes/affiliate.route.ts
import express, { Request, Response } from "express";
import crypto from "crypto";

export const router = express.Router();

type ID = string;
type AffiliateCode = { code: string; ownerUserId: ID; pct: number; active: boolean; createdAt: string };
type OrderAttribution = {
  orderId: ID;
  affiliateCode?: string | null;
  ownerUserId?: ID | null;
  referrer?: string | null;
  ipHash?: string | null;
  emailHash?: string | null;
  uaHash?: string | null;
  createdAt: string;
  amount?: number; // optional: order subtotal for reporting
};

const codes = new Map<string, AffiliateCode>();
const attributions: OrderAttribution[] = [];

const now = () => new Date().toISOString();
const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0,16);

// --- Code management ---

// Create/update code
router.post("/api/affiliates/code", (req: Request, res: Response) => {
  const { code, ownerUserId, pct = 10, active = true } = req.body || {};
  if (!code || !ownerUserId) return res.status(400).json({ error: "Missing fields" });
  const key = String(code).toUpperCase();
  const ac: AffiliateCode = { code: key, ownerUserId, pct: Number(pct) || 0, active: !!active, createdAt: now() };
  codes.set(key, ac);
  res.json(ac);
});

// Resolve short link -> cookie then redirect
router.get("/r/:code", (req: Request, res: Response) => {
  const code = String(req.params.code || "").toUpperCase();
  const exists = codes.get(code);
  if (!exists || !exists.active) return res.status(404).send("Invalid code");
  res.cookie("aff_code", code, { httpOnly: true, sameSite: "lax", maxAge: 1000*60*60*24*30 });
  res.redirect("/");
});

// --- Attribution ---

// Attribute an order (call during/after checkout)
router.post("/api/affiliates/attribute", (req: Request, res: Response) => {
  const { orderId, email, referrer, amount } = req.body || {};
  if (!orderId || !email) return res.status(400).json({ error: "Missing fields" });
  const affCode = String(req.cookies?.aff_code || req.body?.affCode || "").toUpperCase();
  const codeMeta = affCode ? codes.get(affCode) : undefined;

  const rec: OrderAttribution = {
    orderId,
    affiliateCode: affCode || null,
    ownerUserId: codeMeta?.ownerUserId || null,
    referrer: referrer || req.get("referer") || null,
    ipHash: req.ip ? hash(req.ip) : null,
    emailHash: hash(String(email).toLowerCase()),
    uaHash: req.get("user-agent") ? hash(String(req.get("user-agent"))) : null,
    createdAt: now(),
    amount: typeof amount === "number" ? amount : undefined,
  };
  attributions.push(rec);
  res.json(rec);
});

// --- Reporting ---

function filterAttributions(q: any) {
  const from = q.from ? new Date(q.from as string) : null;
  const to = q.to ? new Date(q.to as string) : null;
  const code = q.code ? String(q.code).toUpperCase() : null;
  const owner = q.ownerUserId ? String(q.ownerUserId) : null;

  return attributions.filter(a => {
    if (from && new Date(a.createdAt) < from) return false;
    if (to && new Date(a.createdAt) > to) return false;
    if (code && (a.affiliateCode || "") !== code) return false;
    if (owner && (a.ownerUserId || "") !== owner) return false;
    return true;
  });
}

function summarize(rows: OrderAttribution[]) {
  const byCode: Record<string, { orders: number; amount: number }> = {};
  let totalOrders = 0, totalAmount = 0;
  for (const r of rows) {
    const key = r.affiliateCode || "—";
    byCode[key] = byCode[key] || { orders: 0, amount: 0 };
    byCode[key].orders += 1;
    if (typeof r.amount === "number") { byCode[key].amount += r.amount; totalAmount += r.amount; }
    totalOrders += 1;
  }
  return { totalOrders, totalAmount, byCode };
}

// JSON report with aggregates
router.get("/api/affiliates/report", (req: Request, res: Response) => {
  const rows = filterAttributions(req.query);
  const totals = summarize(rows);
  res.json({ rows, totals });
});

// CSV export of filtered rows
router.get("/api/affiliates/report.csv", (req: Request, res: Response) => {
  const rows = filterAttributions(req.query);
  const csvRows = [["orderId","affiliateCode","ownerUserId","referrer","ipHash","emailHash","uaHash","amount","createdAt"]];
  for (const r of rows) {
    csvRows.push([
      r.orderId,
      r.affiliateCode || "",
      r.ownerUserId || "",
      r.referrer || "",
      r.ipHash || "",
      r.emailHash || "",
      r.uaHash || "",
      typeof r.amount === "number" ? String(r.amount) : "",
      r.createdAt
    ]);
  }
  const csv = csvRows.map(r => r.join(",")).join("\n");
  res.type("text/csv").send(csv);
});

// List codes (simple admin)
router.get("/api/affiliates/codes", (_req: Request, res: Response) => {
  res.json(Array.from(codes.values()));
});

// Seed helper (DEV): creates a couple of codes
router.post("/api/affiliates/seed", (_req: Request, res: Response) => {
  codes.clear();
  codes.set("PRISM10", { code:"PRISM10", ownerUserId:"user_prism", pct:10, active:true, createdAt:now() });
  codes.set("NOVA15", { code:"NOVA15", ownerUserId:"user_nova", pct:15, active:true, createdAt:now() });
  res.json({ ok: true, count: codes.size });
});
