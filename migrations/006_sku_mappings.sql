-- FCC SKU Mappings table for dynamic lifestyle shot → SKU mapping
CREATE TABLE IF NOT EXISTS fcc_sku_mappings (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(50) NOT NULL DEFAULT 'fcc',
  shot_key VARCHAR(100) NOT NULL,
  label VARCHAR(200) NOT NULL,
  base_key VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand, shot_key)
);

-- Seed with initial lifestyle shots
INSERT INTO fcc_sku_mappings (brand, shot_key, label, base_key) VALUES
  ('fcc', 'home.lifestyle_ol1', 'OL-1 Brunch Banter', 'fcc/lifestyle/OL-1_Brunch_Banter_SKU-OL-PRIDE-001'),
  ('fcc', 'home.lifestyle_ol2', 'OL-2 Stoop Affirmation', 'fcc/lifestyle/OL-2_Stoop_Affirmation_SKU-OL-AFFIRM-002'),
  ('fcc', 'home.lifestyle_me1', 'ME-1 Candlelight Foil', 'fcc/lifestyle/ME-1_Candlelight_Foil_SKU-ME-FOIL-001'),
  ('fcc', 'home.lifestyle_me2', 'ME-2 Bar Congrats Clink', 'fcc/lifestyle/ME-2_Bar_Congrats_Clink_SKU-ME-CONGRATS-003'),
  ('fcc', 'home.lifestyle_cc1', 'CC-1 Kitchen Table Thank-You', 'fcc/lifestyle/CC-1_Kitchen_Table_ThankYou_SKU-CC-THANKS-004'),
  ('fcc', 'home.lifestyle_cc2', 'CC-2 At-Home Birthday', 'fcc/lifestyle/CC-2_AtHome_Birthday_SKU-CC-BDAY-005')
ON CONFLICT (brand, shot_key) DO NOTHING;

-- Update trigger
CREATE OR REPLACE FUNCTION update_fcc_sku_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fcc_sku_mappings_updated_at
  BEFORE UPDATE ON fcc_sku_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_fcc_sku_mappings_updated_at();
