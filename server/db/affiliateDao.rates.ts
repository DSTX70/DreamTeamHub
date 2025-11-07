import { db } from "./client";
import { affiliates, affAttributions } from "./schema";
import { sql } from "drizzle-orm";

export const affiliateRatesDao = {
  async listAffiliates() {
    const rows = await db.execute(sql`SELECT code, COALESCE(name,'') as name, commission_rate, COALESCE(status,'active') as status FROM affiliates ORDER BY code`);
    return rows.rows.map((r:any)=>({
      code: r.code,
      name: r.name,
      commissionRate: r.commission_rate !== null ? Number(r.commission_rate) : null,
      status: r.status
    }));
  },

  async upsertAffiliate(input: { code: string; name?: string; commissionRate?: number|null; status?: string }) {
    const cr = input.commissionRate === null ? null : (typeof input.commissionRate === "number" ? input.commissionRate : null);
    await db.execute(sql`
      INSERT INTO affiliates (code, name, commission_rate, status)
      VALUES (${input.code}, ${input.name||null}, ${cr}, ${input.status||'active'})
      ON CONFLICT (code) DO UPDATE SET
        name=EXCLUDED.name,
        commission_rate=EXCLUDED.commission_rate,
        status=EXCLUDED.status
    `);
  },

  async setMany(updates: { code: string; name?: string; commissionRate?: number|null; status?: string }[]) {
    for (const u of updates) await this.upsertAffiliate(u);
  },

  async payouts({ fromISO, toISO, defaultRate }: { fromISO: string; toISO: string; defaultRate: number }) {
    // Sum revenue per affiliate within window
    const rows = await db.execute(sql`
      SELECT COALESCE(a.code,'UNATTRIBUTED') as code, SUM(a.order_total)::numeric AS revenue
      FROM aff_attributions a
      WHERE a.created_at >= ${fromISO} AND a.created_at <= ${toISO}
      GROUP BY COALESCE(a.code,'UNATTRIBUTED')
      ORDER BY 1
    `);
    // Join with affiliates to pick per-affiliate rate
    const aff = await db.execute(sql`SELECT code, commission_rate, COALESCE(status,'active') as status, COALESCE(name,'') as name FROM affiliates`);
    const rateMap = new Map<string, number|null>();
    const statusMap = new Map<string, string>();
    const nameMap = new Map<string, string>();
    for (const r of aff.rows as any[]) {
      rateMap.set(r.code, r.commission_rate !== null ? Number(r.commission_rate) : null);
      statusMap.set(r.code, r.status);
      nameMap.set(r.code, r.name);
    }

    const items = (rows.rows as any[]).map(r => {
      const code: string = r.code;
      const revenue = Number(r.revenue || 0);
      const rate = rateMap.has(code) && rateMap.get(code) !== null ? (rateMap.get(code) as number) : defaultRate;
      const commission = revenue * rate;
      const status = statusMap.get(code) || (code === "UNATTRIBUTED" ? "n/a" : "active");
      const name = nameMap.get(code) || "";
      return { code, name, revenue, rate, commission, status };
    });
    const totals = items.reduce((acc, it)=>{
      acc.revenue += it.revenue;
      acc.commission += it.commission;
      return acc;
    }, { revenue: 0, commission: 0 });
    return { items, totals };
  }
};
