import { db } from "./client";
import { inventoryProducts } from "./schema";
import { sql } from "drizzle-orm";

export const inventoryNotifyDao = {
  async list() {
    const rows = await db.execute(sql`
      SELECT sku, COALESCE(notify_slack, true) as notify_slack, COALESCE(notify_email, false) as notify_email
      FROM inventory_products
      ORDER BY sku
    `);
    return rows.rows.map((r: any) => ({
      sku: r.sku,
      notifySlack: !!r.notify_slack,
      notifyEmail: !!r.notify_email
    }));
  },

  async updateNotifyFlags(sku: string, notifySlack: boolean, notifyEmail: boolean) {
    await db.execute(sql`
      UPDATE inventory_products
      SET notify_slack=${notifySlack}, notify_email=${notifyEmail}, updated_at=NOW()
      WHERE sku=${sku}
    `);
  },

  async updateMany(updates: { sku: string; notifySlack: boolean; notifyEmail: boolean }[]) {
    for (const u of updates) {
      await this.updateNotifyFlags(u.sku, u.notifySlack, u.notifyEmail);
    }
  }
};
