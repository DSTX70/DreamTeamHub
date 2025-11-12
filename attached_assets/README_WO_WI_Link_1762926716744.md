
# WO↔WI Link — Mini Drop (Migration + Routes + Client helpers)

This package links `work_items` to `work_orders` (varchar IDs like `WO-001`), adds a WO-level files view, and ships minimal client helpers.

## Files
- `migrations/002_work_orders_link.sql` — Adds `work_items.work_order_id`, index, and `work_order_files` view.
- `app/server/routes/work_order_files.ts` — `GET /api/work-orders/:woId/files` and optional `POST /api/work-orders/:woId/upload` proxy.
- `app/client/lib/uploader/api.ts` — Full client API including WO helpers (`listWorkOrderFiles`, `getDefaultVisibility`).

## Apply
```bash
psql "$DATABASE_URL" -f migrations/002_work_orders_link.sql
```

**Backfill WO-001 → WI #7 (one-time):**
```sql
UPDATE work_items SET work_order_id = 'WO-001' WHERE id = 7;
```

## Mount server routes
```ts
// app/server/index.ts
import { workOrderFilesRouter } from './routes/work_order_files';
app.use('/api', workOrderFilesRouter);
```

## Quick tests
```bash
# WO files (empty or count)
curl -s http://localhost:5000/api/work-orders/WO-001/files | jq '.files | length'

# Upload to WI #7 (current flow)
curl -s -X POST http://localhost:5000/api/ops/uploader/upload   -F "work_item_id=7" -F "visible_to=pod" -F "file=@./tokens.json" | jq
```
