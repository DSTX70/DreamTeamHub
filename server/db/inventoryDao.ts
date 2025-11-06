import { db } from "./client";
import { inventoryProducts, inventoryEvents } from "./schema";
import { sql, eq } from "drizzle-orm";

export const inventoryDao = {
  async listProducts() {
    const res = await db.select().from(inventoryProducts).orderBy(inventoryProducts.sku);
    return res;
  },

  async setThreshold(sku: string, threshold: number) {
    await db.execute(sql`UPDATE inventory_products SET threshold=${threshold}, updated_at=NOW() WHERE sku=${sku}`);
  },

  async setStock(sku: string, stock: number) {
    await db.execute(sql`UPDATE inventory_products SET stock=${stock}, updated_at=NOW() WHERE sku=${sku}`);
  },

  async getLowStock() {
    const res = await db.execute(sql`SELECT sku, name, stock, threshold FROM inventory_products WHERE stock <= threshold ORDER BY sku`);
    return res.rows;
  },

  async recordLowEvent(sku: string) {
    const row = await db.execute(sql`SELECT sku, stock, threshold FROM inventory_products WHERE sku=${sku} LIMIT 1`);
    const p = row.rows[0];
    if (!p) return;
    await db.insert(inventoryEvents).values({ type: "low-stock", sku, stock: Number(p.stock), threshold: Number(p.threshold) });
  },

  async listEvents(limit = 100) {
    const res = await db.execute(sql`SELECT id, type, sku, stock, threshold, created_at as ts FROM inventory_events ORDER BY id DESC LIMIT ${limit}`);
    return res.rows;
  }
};
