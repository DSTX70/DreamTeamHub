-- server/db/migrations/20251107_create_llm_presets.sql
CREATE TABLE IF NOT EXISTS llm_presets (
  id SERIAL PRIMARY KEY,
  family VARCHAR(16) NOT NULL, -- 'gpt' | 'claude' | 'gemini'
  label TEXT NOT NULL,
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  augment_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_llm_presets_family ON llm_presets(family);
