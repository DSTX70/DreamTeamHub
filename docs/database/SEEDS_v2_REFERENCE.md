# ERD v2 Seed Files (Reference)

These seed files are designed for the ERD v2 architecture (saved in `docs/database/ERD_v2_2025-11-04.sql`).

## Files
1. `drizzle_seeds.ts` - Base company + 3 Business Units
2. `seeds_brands_products.ts` - IMAGINATION brands/products
3. `seeds_brands_products_innovation.ts` - INNOVATION brands
4. `seeds_brands_products_impact.ts` - IMPACT brands + Fab Card Co. products

## Usage (when ERD v2 is adopted)

```bash
# Base entities
ts-node drizzle_seeds.ts

# Business unit specific
ts-node seeds_brands_products.ts
ts-node seeds_brands_products_innovation.ts
ts-node seeds_brands_products_impact.ts
```

## Notes
- These files expect the ERD v2 schema with UUID-based hierarchy
- Current implementation uses simpler schema - see actual seed script in `server/seeds/`
- Migration to ERD v2 planned for future enhancement
