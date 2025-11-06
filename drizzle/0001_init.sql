-- drizzle/0001_init.sql
-- Core tables for affiliates & inventory

CREATE TABLE IF NOT EXISTS affiliates (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS aff_clicks (
  id serial PRIMARY KEY,
  code varchar(64) NOT NULL,
  source varchar(128),
  ua text,
  ip varchar(128),
  visitor_key varchar(256) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS aff_clicks_code_time_idx ON aff_clicks (code, created_at);

CREATE TABLE IF NOT EXISTS aff_attributions (
  id serial PRIMARY KEY,
  code varchar(64),
  order_id varchar(128) NOT NULL,
  order_total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS aff_attr_order_unique ON aff_attributions (order_id);
CREATE INDEX IF NOT EXISTS aff_attr_code_time_idx ON aff_attributions (code, created_at);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  sku varchar(128) UNIQUE NOT NULL,
  name text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  threshold integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_events (
  id serial PRIMARY KEY,
  type varchar(32) NOT NULL,
  sku varchar(128) NOT NULL,
  stock integer NOT NULL,
  threshold integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inv_events_type_time_idx ON inventory_events (type, created_at);
CREATE INDEX IF NOT EXISTS inv_events_sku_time_idx ON inventory_events (sku, created_at);
