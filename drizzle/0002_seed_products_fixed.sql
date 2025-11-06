-- drizzle/0002_seed_products_fixed.sql
INSERT INTO inventory_products (sku, name, stock, threshold) VALUES
('CARD-CC-HELLO-001', 'ColorCue — Hello Mint', 42, 10)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO inventory_products (sku, name, stock, threshold) VALUES
('CARD-RMX-GROOVE-002', 'Remix — Groove Grid', 8, 12)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO inventory_products (sku, name, stock, threshold) VALUES
('CARD-HS-LOVE-003', 'HeartScript — Love Note', 15, 10)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO inventory_products (sku, name, stock, threshold) VALUES
('CARD-ME-NYE-004', 'Midnight Express — NYE Foil', 3, 8)
ON CONFLICT (sku) DO NOTHING;
