-- drizzle/0003_affiliates_rates_status.sql
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS commission_rate numeric(6,4); -- e.g., 0.1250 = 12.5%
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'active'; -- active|suspended

CREATE INDEX IF NOT EXISTS affiliates_status_idx ON affiliates (status);
