import { db } from "./client";
import { affiliates, affClicks, affAttributions } from "./schema";
import { sql } from "drizzle-orm";

function vkey(ip?: string|null, ua?: string|null) {
  return `${ip||""}|${ua||""}`.slice(0,256);
}

export const affiliateDao = {
  async recordClick(input: { code: string; source?: string; ua?: string; ip?: string }) {
    const code = (input.code||"").toUpperCase();
    if (!code) return;
    await db.insert(affClicks).values({
      code, source: input.source, ua: input.ua, ip: input.ip, visitorKey: vkey(input.ip, input.ua)
    });
    // ensure affiliate code exists
    await db.execute(sql`INSERT INTO affiliates (code) VALUES (${code}) ON CONFLICT (code) DO NOTHING;`);
  },

  async recordAttribution(input: { orderId: string; orderTotal: number; code?: string|null }) {
    const code = (input.code||"").toUpperCase() || null;
    await db.insert(affAttributions).values({
      code, orderId: String(input.orderId), orderTotal: input.orderTotal
    }).onConflictDoNothing();
  },

  async listEvents(limit = 100) {
    const clicks = await db.execute(sql`
      SELECT 'click' as type, id, created_at as ts, code, source, NULL::text as order_id, NULL::numeric as order_total
      FROM aff_clicks ORDER BY id DESC LIMIT ${limit}
    `);
    const attrs = await db.execute(sql`
      SELECT 'attribution' as type, id, created_at as ts, code, NULL::text as source, order_id, order_total
      FROM aff_attributions ORDER BY id DESC LIMIT ${limit}
    `);
    // merge & sort by ts desc
    const combined = [...clicks.rows, ...attrs.rows].sort((a:any,b:any)=> new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return combined.slice(0, limit);
  },

  async getReport(input: { fromISO?: string; toISO?: string; commissionRate: number }) {
    const from = input.fromISO ? new Date(input.fromISO) : new Date(Date.now() - 30*86400000);
    const to = input.toISO ? new Date(input.toISO) : new Date();

    // clicks per code + unique visitor count
    const clicks = await db.execute(sql`
      SELECT code, COUNT(*)::int AS clicks, COUNT(DISTINCT visitor_key)::int AS unique_visitors
      FROM aff_clicks
      WHERE created_at >= ${from.toISOString()} AND created_at <= ${to.toISOString()}
      GROUP BY code
    `);

    // attributions per code + revenue
    const attrs = await db.execute(sql`
      SELECT COALESCE(code,'UNATTRIBUTED') AS code, COUNT(*)::int AS orders, COALESCE(SUM(order_total),0)::numeric AS revenue
      FROM aff_attributions
      WHERE created_at >= ${from.toISOString()} AND created_at <= ${to.toISOString()}
      GROUP BY COALESCE(code,'UNATTRIBUTED')
    `);

    const map:any = {};
    for (const r of clicks.rows as any[]) {
      map[r.code] = { code: r.code, clicks: Number(r.clicks), uniqueVisitors: Number(r.unique_visitors), orders: 0, revenue: 0, commission: 0, conversionRate: 0 };
    }
    for (const r of attrs.rows as any[]) {
      const code = r.code as string;
      const row = map[code] || (map[code] = { code, clicks: 0, uniqueVisitors: 0, orders: 0, revenue: 0, commission: 0, conversionRate: 0 });
      row.orders = Number(r.orders);
      row.revenue = Number(r.revenue);
    }
    const items = Object.values(map).map((it:any) => {
      it.commission = it.revenue * input.commissionRate;
      it.conversionRate = it.clicks ? it.orders / it.clicks : 0;
      return it;
    }).sort((a:any,b:any)=> a.code.localeCompare(b.code));

    const totals = items.reduce((acc:any, it:any) => {
      acc.clicks += it.clicks;
      acc.uniqueVisitors += it.uniqueVisitors;
      acc.orders += it.orders;
      acc.revenue += it.revenue;
      acc.commission += it.commission;
      return acc;
    }, { clicks:0, uniqueVisitors:0, orders:0, revenue:0, commission:0 });

    return { items, totals, window: { fromISO: from.toISOString(), toISO: to.toISOString() } };
  }
};
