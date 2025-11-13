import { db } from '../db';
import { sql } from 'drizzle-orm';

type SkuMapRow = {
  id: number;
  brand: string;
  shot_key: string;
  label: string;
  base_key: string;
};

export type FccSkuMap = Record<string, SkuMapRow>;

export async function getFccSkuMap(brand = 'fcc'): Promise<SkuMapRow[]> {
  const result = await db.execute(
    sql`SELECT id, brand, shot_key, label, base_key FROM fcc_sku_mappings WHERE brand = ${brand} ORDER BY shot_key`
  );
  return result.rows as SkuMapRow[];
}

/**
 * Returns FCC SKU mappings as a keyed map for fast lookup.
 * Usage: const map = await getFccSkuMapByKey(); const ol1 = map['home.lifestyle_ol1'];
 */
export async function getFccSkuMapByKey(brand = 'fcc'): Promise<FccSkuMap> {
  const rows = await getFccSkuMap(brand);
  const map: FccSkuMap = {};
  
  for (const row of rows) {
    if (!row.shot_key) continue;
    map[row.shot_key] = row;
  }
  
  return map;
}

export async function upsertFccSkuMap(params: {
  brand: string;
  shot_key: string;
  label: string;
  base_key: string;
}): Promise<void> {
  await db.execute(
    sql`
      INSERT INTO fcc_sku_mappings (brand, shot_key, label, base_key)
      VALUES (${params.brand}, ${params.shot_key}, ${params.label}, ${params.base_key})
      ON CONFLICT (brand, shot_key)
      DO UPDATE SET label = ${params.label}, base_key = ${params.base_key}, updated_at = NOW()
    `
  );
}
