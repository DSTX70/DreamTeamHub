import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db/client.js';
import { productCatalog } from '../server/db/schema.js';

async function importProductCatalog() {
  try {
    const csvPath = path.join(process.cwd(), 'server/data/product_catalog.csv');
    console.log(`Reading product catalog from: ${csvPath}`);
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Parsed ${records.length} products from CSV`);

    await db.delete(productCatalog);
    console.log('Cleared existing product catalog');

    for (const record of records) {
      if (!record.sku) {
        console.warn('Skipping row with missing SKU:', record);
        continue;
      }

      await db.insert(productCatalog).values({
        sku: record.sku,
        line: record.line,
        collection: record.collection,
        series: record.series,
        productName: record.product_name,
        variantName: record.variant_name,
        format: record.format,
        size: record.size,
        finish: record.finish,
        brandSlug: record.brand_slug,
        urlSlug: record.url_slug,
        heroSlot: record.hero_slot || null,
        isActive: record.is_active === 'true',
        priceMsrp: record.price_msrp ? record.price_msrp : null,
        currency: record.currency || null,
        tags: record.tags || '',
      });

      console.log(`✓ Imported ${record.sku} - ${record.product_name}`);
    }

    console.log(`\n✅ Successfully imported ${records.length} products to catalog`);
  } catch (error) {
    console.error('❌ Failed to import product catalog:', error);
    process.exit(1);
  }
}

importProductCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
