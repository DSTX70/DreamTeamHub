-- server/db/seeds/20251107_llm_presets_seed.sql
-- Default strict-JSON presets for GPT/Claude/Gemini families

-- GPT preset: Strict JSON output
INSERT INTO llm_presets (family, label, tips, augment_lines, enabled)
VALUES (
  'gpt',
  'Strict JSON Output',
  '["Always use response_format: {type: json_object}", "Validate schema before responding", "Use concise property names"]',
  '["Return valid JSON only. No markdown code fences, no explanatory text before or after.", "All keys must use camelCase.", "Ensure the response matches the exact schema provided."]',
  true
)
ON CONFLICT DO NOTHING;

-- Claude preset: Strict JSON output
INSERT INTO llm_presets (family, label, tips, augment_lines, enabled)
VALUES (
  'claude',
  'Strict JSON Output',
  '["Prefer structured output with explicit schemas", "Use clear type definitions", "Validate before returning"]',
  '["Respond with valid JSON only.", "Do not include any text outside the JSON object.", "Match the exact schema provided in the system prompt.", "Use camelCase for all property names."]',
  true
)
ON CONFLICT DO NOTHING;

-- Gemini preset: Strict JSON output
INSERT INTO llm_presets (family, label, tips, augment_lines, enabled)
VALUES (
  'gemini',
  'Strict JSON Output',
  '["Use generation_config with response_mime_type: application/json", "Provide clear schema constraints", "Test output format"]',
  '["Output must be valid JSON only.", "No explanatory text or markdown formatting.", "Follow the exact schema structure.", "Use camelCase for property names."]',
  true
)
ON CONFLICT DO NOTHING;

-- GPT preset: Conversational with context
INSERT INTO llm_presets (family, label, tips, augment_lines, enabled)
VALUES (
  'gpt',
  'Conversational Assistant',
  '["Maintain context across turns", "Be concise but helpful", "Ask clarifying questions when needed"]',
  '["Keep responses focused and relevant to the user question.", "If context is unclear, ask a single clarifying question.", "Provide actionable suggestions when appropriate."]',
  true
)
ON CONFLICT DO NOTHING;
