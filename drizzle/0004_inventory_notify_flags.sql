-- drizzle/0004_inventory_notify_flags.sql
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS notify_slack boolean DEFAULT true;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS notify_email boolean DEFAULT false;
