CREATE TABLE IF NOT EXISTS seo_meta (
  id BIGSERIAL PRIMARY KEY,
  route TEXT NOT NULL,               -- e.g. "/" or "/collections"
  section_key TEXT NOT NULL,         -- e.g. "home.lifestyle_ol1"
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  og_image TEXT,
  keywords TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (route, section_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_seo_meta_route_locale
  ON seo_meta(route, locale);
