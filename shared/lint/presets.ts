export type LlmPresetKey = "gpt" | "claude" | "gemini";

export type LlmPreset = {
  name: string;
  extraAugment: string[];   // lines appended to augment
  tips: string[];           // shown in UI
};

export const PRESETS: Record<LlmPresetKey, LlmPreset> = {
  gpt: {
    name: "GPT (OpenAI)",
    extraAugment: [
      "Respond with a single JSON object only, no code fences.",
      "Do not add trailing commas.",
      "If a field is optional and unknown, omit it rather than emitting null."
    ],
    tips: [
      "Avoid code fences; some GPT models wrap JSON by default.",
      "Constrain arrays and enums to avoid freeform content.",
      "Prefer omitting unknown optional fields over null to reduce drift."
    ]
  },
  claude: {
    name: "Claude (Anthropic)",
    extraAugment: [
      "Do not include any explanation before or after the JSON.",
      "If you cannot satisfy the schema, output {} (empty object)."
    ],
    tips: [
      "Claude occasionally prepends analysis text—reinforce JSON‑only.",
      "Keep schemas shallow (fewer unions).",
      "Explicitly state fallback {} when uncertain."
    ]
  },
  gemini: {
    name: "Gemini (Google)",
    extraAugment: [
      "No markdown, no commentary—return JSON only.",
      "Ensure numeric fields are numbers, not numeric strings."
    ],
    tips: [
      "Gemini may emit metadata tokens—disallow any non‑JSON.",
      "Be explicit on numeric types to avoid stringified numbers."
    ]
  }
};
