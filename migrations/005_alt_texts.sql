-- Migration: Alt text registry for SEO image accessibility
-- Allows importing alt text from CSV files attached to Work Items
-- Supports localization and review workflow

CREATE TABLE IF NOT EXISTS alt_texts (
  id BIGSERIAL PRIMARY KEY,
  image_key TEXT NOT NULL,            -- stable key/filename/path
  alt_text  TEXT NOT NULL,
  context   TEXT,                     -- page/slot ("home/hero-1")
  locale    TEXT NOT NULL DEFAULT 'en',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (image_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_alt_texts_image_locale
  ON alt_texts(image_key, locale);

COMMENT ON TABLE alt_texts IS 'Registry of alt text for images, importable from CSV files';
COMMENT ON COLUMN alt_texts.image_key IS 'Stable identifier for the image (filename, S3 key, or path)';
COMMENT ON COLUMN alt_texts.context IS 'Optional context hint like "home/hero-1" or "PDP/gallery-3"';
COMMENT ON COLUMN alt_texts.locale IS 'Language/locale code (en, es-MX, etc.)';
