// shared/lint/promptAugment.ts
import { JSONSchema } from "./jsonSchemaUtils";

export function schemaToCompactOutline(s: JSONSchema, indent = 0): string {
  if (!s || typeof s !== "object") return "";
  const pad = "  ".repeat(indent);
  if (s.type === "object" && s.properties) {
    const inner = Object.entries(s.properties).map(([k, v]) => `${pad}- ${k}: ${schemaToCompactOutline(v, indent + 1)}`).join("\n");
    return `object{\n${inner}\n${pad}}`;
  }
  if (s.type === "array" && s.items) {
    return `array<${schemaToCompactOutline(s.items, indent)}>`;
  }
  if (Array.isArray(s.type)) return (s.type as any[]).join("|");
  if (s.enum) return `enum(${(s.enum as any[]).slice(0,6).join(", ")}${(s.enum as any[]).length>6?"…":""})`;
  return String(s.type || "any");
}

export function augmentForJson(schema?: JSONSchema, opts?: { forbidNonJsonText?: boolean }) {
  const core = [
    "Return a single JSON object only.",
    "Do not include any extra commentary, code fences, or explanations.",
    "If you cannot produce valid JSON for the requested schema, respond with an empty object `{}`."
  ];
  const outline = schema ? `\nSchema (compact):\n${schemaToCompactOutline(schema)}` : "";
  const nonJson = opts?.forbidNonJsonText ? "\nDo not output anything that is not JSON." : "";
  return core.join(" ") + outline + nonJson;
}
