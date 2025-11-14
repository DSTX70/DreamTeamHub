import { db } from '../db/client.js';
import { productCatalog } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

export async function getAllProducts() {
  return db
    .select()
    .from(productCatalog)
    .where(eq(productCatalog.isActive, true));
}

export async function getProductsForLine(line: string) {
  return db
    .select()
    .from(productCatalog)
    .where(
      and(
        eq(productCatalog.line, line),
        eq(productCatalog.isActive, true)
      )
    );
}

export async function getProductsForSkus(skus: string[]) {
  if (!skus.length) return [];
  return db
    .select()
    .from(productCatalog)
    .where(inArray(productCatalog.sku, skus));
}

export async function getHeroProducts() {
  return db
    .select()
    .from(productCatalog)
    .where(
      and(
        eq(productCatalog.isActive, true)
      )
    );
}

export async function getProductBySku(sku: string) {
  const results = await db
    .select()
    .from(productCatalog)
    .where(eq(productCatalog.sku, sku))
    .limit(1);
  
  return results[0] || null;
}

export type CatalogProduct = typeof productCatalog.$inferSelect;
