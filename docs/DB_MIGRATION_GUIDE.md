# Database Migration Guide: Affiliates & Inventory

## Overview

This guide documents the migration of affiliate tracking and low-stock inventory systems from in-memory storage to PostgreSQL-backed persistence using Drizzle ORM.

## Migration Summary

**Date:** November 6, 2025  
**Status:** ✅ Complete  
**Impact:** Production-ready database-backed e-commerce features

### What Changed

- **Affiliates System:** Migrated from in-memory to PostgreSQL
- **Inventory Management:** Migrated from in-memory to PostgreSQL  
- **Low-Stock Scheduler:** Now DB-backed with webhook/email notifiers
- **Ops Settings UI:** New management interface at `/ops/settings`

---

## Database Schema

### Tables Created

#### 1. `affiliates`
Stores affiliate partner information and performance metrics.

```sql
CREATE TABLE affiliates (
  id SERIAL PRIMARY KEY,
  handle VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  pixel_id VARCHAR(255) UNIQUE NOT NULL,
  revenue_30d NUMERIC(10,2) DEFAULT 0,
  clicks_30d INTEGER DEFAULT 0,
  conversions_30d INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_affiliates_handle ON affiliates(handle);
CREATE INDEX idx_affiliates_pixel_id ON affiliates(pixel_id);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `handle`: URL-safe affiliate identifier (e.g., "tech-blog-2025")
- `name`: Display name (e.g., "Tech Blog Network")
- `status`: "active" or "paused"
- `pixel_id`: Unique tracking pixel identifier (UUID)
- `revenue_30d`, `clicks_30d`, `conversions_30d`: 30-day rolling metrics
- `created_at`: Registration timestamp

#### 2. `aff_clicks`
Tracks individual click events with attribution data.

```sql
CREATE TABLE aff_clicks (
  id SERIAL PRIMARY KEY,
  pixel_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_aff_clicks_pixel_id ON aff_clicks(pixel_id);
CREATE INDEX idx_aff_clicks_timestamp ON aff_clicks(timestamp DESC);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `pixel_id`: References affiliate tracking pixel
- `ip_address`: Visitor IP (for deduplication)
- `user_agent`, `referrer`, `landing_page`: Attribution metadata
- `timestamp`: Click timestamp (indexed for performance)

#### 3. `aff_attributions`
Records conversion events (orders attributed to affiliates).

```sql
CREATE TABLE aff_attributions (
  id SERIAL PRIMARY KEY,
  pixel_id VARCHAR(255) NOT NULL,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  revenue NUMERIC(10,2) NOT NULL,
  commission NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_aff_attributions_pixel_id ON aff_attributions(pixel_id);
CREATE INDEX idx_aff_attributions_order_id ON aff_attributions(order_id);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `pixel_id`: References affiliate
- `order_id`: Unique order identifier (prevents double-attribution)
- `revenue`: Total order value
- `commission`: Calculated affiliate commission
- `status`: "pending", "approved", "paid"
- `timestamp`: Conversion timestamp

#### 4. `inventory_products`
Stores inventory items with stock tracking (renamed from `products` to avoid collision).

```sql
CREATE TABLE inventory_products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  unit_price NUMERIC(10,2),
  supplier VARCHAR(255),
  last_restocked TIMESTAMP
);
CREATE INDEX idx_inventory_products_sku ON inventory_products(sku);
CREATE INDEX idx_inventory_products_low_stock ON inventory_products(stock);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `sku`: Stock Keeping Unit (e.g., "WIDGET-001")
- `name`: Product name
- `stock`: Current stock level
- `threshold`: Low-stock alert threshold
- `unit_price`, `supplier`: Product metadata
- `last_restocked`: Last restock timestamp

#### 5. `inventory_events`
Logs stock change events for audit trail.

```sql
CREATE TABLE inventory_events (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  old_stock INTEGER,
  new_stock INTEGER,
  quantity_delta INTEGER,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_inventory_events_sku ON inventory_events(sku);
CREATE INDEX idx_inventory_events_timestamp ON inventory_events(timestamp DESC);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `sku`: References inventory product
- `event_type`: "low_stock", "restocked", "sale", etc.
- `old_stock`, `new_stock`: Stock levels before/after event
- `quantity_delta`: Change in stock (+/-)
- `metadata`: Additional event data (JSONB for flexibility)
- `timestamp`: Event timestamp (indexed for performance)

---

## Migration Files

### Applied Migrations

1. **`drizzle/0001_init_fixed.sql`**
   - Creates all 5 tables with proper indexes
   - Adds unique constraints on handles, pixel IDs, order IDs, SKUs
   - Sets up timestamp defaults and cascading behavior

2. **`drizzle/0002_seed_products_fixed.sql`**
   - Seeds 5 sample inventory products
   - Sets realistic stock levels and thresholds
   - Provides test data for low-stock scheduler

---

## API Endpoints

### Affiliate Routes (`/api/affiliates`)

#### `POST /api/affiliates`
Create new affiliate partner.

**Request:**
```json
{
  "handle": "tech-blog-2025",
  "name": "Tech Blog Network",
  "status": "active"
}
```

**Response:**
```json
{
  "id": 1,
  "handle": "tech-blog-2025",
  "name": "Tech Blog Network",
  "status": "active",
  "pixelId": "550e8400-e29b-41d4-a716-446655440000",
  "revenue30d": "0.00",
  "clicks30d": 0,
  "conversions30d": 0,
  "createdAt": "2025-11-06T20:00:00.000Z"
}
```

#### `GET /api/affiliates`
List all affiliates with metrics.

**Response:**
```json
[
  {
    "id": 1,
    "handle": "tech-blog-2025",
    "name": "Tech Blog Network",
    "pixelId": "550e8400-e29b-41d4-a716-446655440000",
    "revenue30d": "1250.00",
    "clicks30d": 342,
    "conversions30d": 8,
    "status": "active"
  }
]
```

#### `POST /api/affiliates/track/click`
Track affiliate click (pixel fire).

**Request:**
```json
{
  "pixelId": "550e8400-e29b-41d4-a716-446655440000",
  "landingPage": "/products/widget-pro",
  "referrer": "https://techblog.example.com"
}
```

**Response:**
```json
{
  "success": true,
  "clickId": 42
}
```

#### `POST /api/affiliates/track/conversion`
Track conversion (order attribution).

**Request:**
```json
{
  "pixelId": "550e8400-e29b-41d4-a716-446655440000",
  "orderId": "ORD-2025-11-06-001",
  "revenue": 99.99,
  "commission": 9.99
}
```

**Response:**
```json
{
  "success": true,
  "attributionId": 17
}
```

---

### Inventory Routes (`/api/inventory`)

#### `POST /api/inventory/products`
Add new inventory product.

**Request:**
```json
{
  "sku": "WIDGET-PRO-001",
  "name": "Widget Pro 2025",
  "stock": 100,
  "threshold": 20,
  "unitPrice": 49.99,
  "supplier": "WidgetCo Inc"
}
```

**Response:**
```json
{
  "id": 1,
  "sku": "WIDGET-PRO-001",
  "name": "Widget Pro 2025",
  "stock": 100,
  "threshold": 20,
  "unitPrice": "49.99",
  "supplier": "WidgetCo Inc",
  "lastRestocked": null
}
```

#### `GET /api/inventory/products`
List all inventory products.

**Response:**
```json
[
  {
    "id": 1,
    "sku": "WIDGET-PRO-001",
    "name": "Widget Pro 2025",
    "stock": 100,
    "threshold": 20,
    "unitPrice": "49.99",
    "supplier": "WidgetCo Inc",
    "isLowStock": false
  }
]
```

#### `PUT /api/inventory/products/:sku`
Update stock level.

**Request:**
```json
{
  "stock": 150
}
```

**Response:**
```json
{
  "id": 1,
  "sku": "WIDGET-PRO-001",
  "stock": 150,
  "message": "Stock updated successfully"
}
```

#### `GET /api/inventory/events`
Get stock event history.

**Query Params:**
- `sku` (optional): Filter by SKU
- `limit` (optional): Max events to return (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "sku": "WIDGET-PRO-001",
    "eventType": "low_stock",
    "oldStock": 25,
    "newStock": 18,
    "quantityDelta": -7,
    "metadata": {
      "alertSent": true,
      "notifiers": ["webhook"]
    },
    "timestamp": "2025-11-06T19:45:00.000Z"
  }
]
```

---

### Ops Settings Routes (`/api/ops/settings`)

#### `POST /api/ops/settings/test-webhook`
Test Slack webhook notification.

**Request:**
```json
{
  "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test alert sent successfully",
  "timestamp": "2025-11-06T20:00:00.000Z"
}
```

#### `POST /api/ops/settings/test-email`
Test SMTP email notification.

**Request:**
```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "ops@dreamteamhub.app",
  "smtpPass": "app-password-here",
  "emailFrom": "ops@dreamteamhub.app",
  "emailTo": "admin@dreamteamhub.app"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "timestamp": "2025-11-06T20:00:00.000Z"
}
```

#### `POST /api/ops/inventory/scan-now`
Manually trigger low-stock scan.

**Response:**
```json
{
  "success": true,
  "message": "Scan initiated",
  "timestamp": "2025-11-06T20:00:00.000Z",
  "lowStockItems": [
    {
      "sku": "WIDGET-PRO-001",
      "stock": 18,
      "threshold": 20
    }
  ]
}
```

---

## Low-Stock Scheduler

### Configuration

The DB-backed scheduler runs automatically on server start and scans every 60 seconds for low-stock items.

**Environment Variables:**

```bash
# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# SMTP Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ops@dreamteamhub.app
SMTP_PASS=your-app-password
MAIL_FROM=ops@dreamteamhub.app
EMAIL_TO=admin@dreamteamhub.app
```

**Scheduler Behavior:**

1. **Scan Interval:** 60 seconds (configurable)
2. **Throttling:** 5-minute cooldown per SKU+stock level (prevents spam)
3. **Notifiers:** Webhook + Email (if configured)
4. **Event Logging:** All alerts logged to `inventory_events` table

**Startup Log:**
```
[Cron] 📦 DB-backed low-stock scheduler started (60s interval, 0 notifier(s))
```

**With Notifiers Configured:**
```
[Cron] 📦 DB-backed low-stock scheduler started (60s interval, 2 notifier(s))
```

### Alert Format

**Slack Webhook:**
```json
{
  "text": "⚠️ Low Stock Alert: WIDGET-PRO-001 (Widget Pro 2025) - Stock: 18 / Threshold: 20"
}
```

**Email:**
```
Subject: Low Stock Alert: WIDGET-PRO-001

Dear Operations Team,

This is an automated alert regarding low stock levels:

Product: Widget Pro 2025
SKU: WIDGET-PRO-001
Current Stock: 18 units
Threshold: 20 units

Please restock this item as soon as possible.

---
Dream Team Hub Operations
Timestamp: 2025-11-06T20:00:00.000Z
```

---

## Frontend UI

### Ops Settings Page (`/ops/settings`)

**Location:** `client/src/pages/ops/OpsSettings.tsx`  
**Route:** `/ops/settings`

**Features:**
- Webhook configuration & testing
- SMTP configuration & testing
- Manual scan trigger
- Real-time test results
- Form validation with Zod

**Components:**
- `FormRow`: Reusable form row component
- Zustand store for settings persistence (client-side only)

**Usage:**
1. Navigate to `/ops/settings`
2. Enter webhook URL or SMTP credentials
3. Click "Test Webhook" or "Test Email"
4. Use "Scan Now" to manually trigger inventory scan
5. Settings are stored locally (not persisted to server)

---

## Data Access Objects (DAOs)

### AffiliateDao (`server/db/affiliateDao.ts`)

**Methods:**
- `createAffiliate(data)`: Create new affiliate
- `getAffiliates()`: List all affiliates
- `getAffiliateByHandle(handle)`: Find by handle
- `getAffiliateByPixelId(pixelId)`: Find by pixel ID
- `trackClick(data)`: Record click event
- `trackConversion(data)`: Record conversion
- `getClicksByPixelId(pixelId, days)`: Get click history
- `getConversionsByPixelId(pixelId, days)`: Get conversion history
- `updateMetrics(pixelId, days)`: Recalculate 30-day metrics

### InventoryDao (`server/db/inventoryDao.ts`)

**Methods:**
- `createProduct(data)`: Add inventory product
- `getProducts()`: List all products
- `getProductBySku(sku)`: Find by SKU
- `updateStock(sku, stock)`: Update stock level
- `getLowStockProducts()`: Get items below threshold
- `logEvent(data)`: Record inventory event
- `getEvents(sku?, limit?)`: Get event history

---

## Testing

### Manual Testing Checklist

**Affiliates:**
- [ ] Create affiliate via POST `/api/affiliates`
- [ ] Track click via POST `/api/affiliates/track/click`
- [ ] Track conversion via POST `/api/affiliates/track/conversion`
- [ ] Verify metrics update in GET `/api/affiliates`
- [ ] Check attribution prevents duplicate orders

**Inventory:**
- [ ] Create product via POST `/api/inventory/products`
- [ ] Update stock via PUT `/api/inventory/products/:sku`
- [ ] Verify low-stock detection (stock < threshold)
- [ ] Check event logging in GET `/api/inventory/events`
- [ ] Trigger manual scan via POST `/api/ops/inventory/scan-now`

**Notifications:**
- [ ] Configure webhook URL in `/ops/settings`
- [ ] Test webhook delivery
- [ ] Configure SMTP in `/ops/settings`
- [ ] Test email delivery
- [ ] Verify alerts sent for low-stock items

### Database Verification

```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('affiliates', 'aff_clicks', 'aff_attributions', 'inventory_products', 'inventory_events');

-- Verify seed data
SELECT * FROM inventory_products;

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename IN ('affiliates', 'aff_clicks', 'aff_attributions', 'inventory_products', 'inventory_events');
```

---

## Troubleshooting

### Issue: Scheduler not sending alerts

**Check:**
1. Verify env vars: `echo $SLACK_WEBHOOK_URL`
2. Check scheduler logs: `[Cron] 📦 DB-backed low-stock scheduler started (60s interval, X notifier(s))`
3. Ensure stock is below threshold
4. Check throttle timeout (5min cooldown)

**Solution:**
- Set env vars in Replit Secrets
- Restart workflow to reload env vars
- Use `/ops/settings` to test webhook/email

### Issue: Database connection errors

**Check:**
1. Verify `DATABASE_URL` env var exists
2. Check migration status: `npm run db:push`
3. Verify tables exist (see Database Verification above)

**Solution:**
- Use Replit's built-in PostgreSQL database
- Apply migrations: `npm run db:push --force`
- Check `server/db/client.ts` for connection config

### Issue: Duplicate conversions

**Check:**
1. Verify `order_id` is unique
2. Check `aff_attributions` table for existing order

**Solution:**
- The DAO prevents duplicate `order_id` inserts
- Returns 409 Conflict if order already attributed
- Use different `order_id` for each test conversion

---

## Performance Considerations

### Indexes

All tables have appropriate indexes for common queries:
- `affiliates`: handle, pixel_id
- `aff_clicks`: pixel_id, timestamp (DESC)
- `aff_attributions`: pixel_id, order_id
- `inventory_products`: sku, stock (low-stock queries)
- `inventory_events`: sku, timestamp (DESC)

### Query Optimization

**Affiliates:**
- Metrics calculated via aggregation (no N+1 queries)
- 30-day window uses timestamp indexes
- Click/conversion lookups use pixel_id index

**Inventory:**
- Low-stock scan uses indexed `stock` column
- Event history limited to 50 entries by default
- SKU lookups use unique index

### Scaling Recommendations

**For High-Volume Affiliates:**
- Add Redis cache for click deduplication
- Use materialized views for metrics
- Partition `aff_clicks` by timestamp

**For Large Inventory:**
- Partition `inventory_events` by month
- Add caching layer for product lookups
- Use batch updates for stock changes

---

## Security Considerations

### Input Validation

All endpoints use Zod schemas for validation:
- `affiliateDao.ts`: Validates handles, pixel IDs, order IDs
- `inventoryDao.ts`: Validates SKUs, stock levels
- Frontend forms: Client-side validation with react-hook-form + Zod

### SQL Injection Prevention

- **Drizzle ORM:** All queries use parameterized statements
- **No raw SQL:** All database access via DAO layer
- **Type safety:** TypeScript enforces schema compliance

### Environment Variables

**Sensitive Secrets:**
- `DATABASE_URL`: PostgreSQL connection string
- `SLACK_WEBHOOK_URL`: Webhook endpoint
- `SMTP_PASS`: Email password

**Best Practices:**
- Store in Replit Secrets (never commit to git)
- Use `process.env` for access
- Never log secrets in production

---

## Rollback Plan

### If Issues Occur

**1. Revert to In-Memory Storage:**
```typescript
// server/routes.ts
import affiliateRoute from './routes/affiliate.route'; // Old version
import inventoryRoute from './routes/inventory.route'; // Old version
```

**2. Drop Tables (if needed):**
```sql
DROP TABLE IF EXISTS inventory_events;
DROP TABLE IF EXISTS inventory_products;
DROP TABLE IF EXISTS aff_attributions;
DROP TABLE IF EXISTS aff_clicks;
DROP TABLE IF EXISTS affiliates;
```

**3. Restore from Checkpoint:**
- Use Replit's built-in rollback feature
- Navigate to checkpoint before migration
- Restore code, database, and chat session

---

## Future Enhancements

### Phase 2 (Planned)

1. **Affiliate Dashboard:**
   - Public-facing portal for partners
   - Real-time metrics visualization
   - Payout request workflow

2. **Inventory Forecasting:**
   - ML-based demand prediction
   - Auto-restock recommendations
   - Supplier integration (API)

3. **Advanced Notifications:**
   - SMS alerts via Twilio
   - In-app push notifications
   - Custom alert rules (webhooks)

4. **Analytics & Reporting:**
   - Commission tracking
   - Revenue attribution graphs
   - Inventory turnover analysis

---

## Support & Contact

**Documentation:**
- `docs/NEW_FEATURES_INTEGRATION.md`: High-level feature overview
- `docs/DB_MIGRATION_GUIDE.md`: This document (detailed migration guide)

**Code Locations:**
- Backend: `server/db/`, `server/routes/`, `server/scheduler/`, `server/notifiers/`
- Frontend: `client/src/pages/ops/OpsSettings.tsx`
- Schema: `shared/schema.ts`, `server/db/schema.ts`

**Questions?**
- Check console logs: `refresh_all_logs` tool
- Review migration files: `drizzle/0001_init_fixed.sql`, `drizzle/0002_seed_products_fixed.sql`
- Test endpoints: Use `/ops/settings` UI or Postman/curl

---

**Migration Completed:** November 6, 2025  
**Status:** ✅ Production Ready  
**Database:** PostgreSQL (Neon-backed)  
**ORM:** Drizzle  
**Scheduler:** DB-backed with webhook/email notifiers  
**UI:** Ops Settings at `/ops/settings`
