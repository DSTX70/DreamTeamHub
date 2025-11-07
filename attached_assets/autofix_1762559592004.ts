// client/src/pages/llm/autofix.ts
// Tiny helpers to improve prompts/schemas and to extract JSON from LLM text.
import Ajv from "ajv";

export function suggestPromptFixes(base: string): string[] {
  const fixes: string[] = [];
  if (!/return json only/i.test(base)) fixes.push("Add: 'Return JSON only. No extra text.'");
  if (!/no (markdown|comments)/i.test(base)) fixes.push("Add: 'No markdown, comments, or trailing commas.'");
  if (!/error/i.test(base)) fixes.push("Add: 'If you cannot comply, return {"_error":"..."}'");
  return fixes;
}

export function applyPromptAutofix(base: string): string {
  let out = base;
  if (!/return json only/i.test(out)) out += "\nReturn JSON only. No extra text.";
  if (!/no (markdown|comments)/i.test(out)) out += "\nNo markdown, comments, or trailing commas.";
  if (!/cannot comply/i.test(out)) out += "\nIf you cannot comply, return {\"_error\":\"explanation\"}.";
  return out;
}

export function suggestSchemaFixes(schema: any): string[] {
  const fixes: string[] = [];
  if (schema && schema.type === "object") {
    if (schema.additionalProperties !== false) fixes.push("Set additionalProperties:false on root object.");
    if (schema.properties) {
      for (const [k, v] of Object.entries<any>(schema.properties)) {
        if (v.type === "object" && v.additionalProperties !== false) {
          fixes.push(`Set additionalProperties:false on object property '${k}'.`);
        }
      }
    }
  }
  return fixes;
}

export function applySchemaAutofix(schema: any): any {
  const clone = JSON.parse(JSON.stringify(schema || {}));
  const clamp = (node: any) => {
    if (node && node.type === "object") {
      if (node.additionalProperties !== false) node.additionalProperties = false;
      if (node.properties) {
        Object.values<any>(node.properties).forEach(clamp);
      }
    }
    if (node && node.type === "array" && node.items) clamp(node.items);
  };
  clamp(clone);
  return clone;
}

export function extractJSONBlock(text: string): { json?: any; error?: string } {
  // Try fenced blocks first
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  // Greedy from first '{' to last '}' as a heuristic
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return { error: "No JSON object found." };
  const candidate = raw.slice(start, end + 1);
  try {
    const obj = JSON.parse(candidate);
    return { json: obj };
  } catch (e: any) {
    return { error: "Invalid JSON block: " + e.message };
  }
}

export function validateAgainstSchema(obj: any, schema: any) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(obj);
  return { ok, errors: validate.errors || [] };
}
