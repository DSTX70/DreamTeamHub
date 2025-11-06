// shared/lint/jsonSchemaUtils.ts
export type JSONSchema = any;

export function isObjectSchema(s: JSONSchema): boolean {
  return !!s && (s.type === "object" || (!!s.properties && typeof s.properties === "object"));
}

export function isArraySchema(s: JSONSchema): boolean {
  return !!s && (s.type === "array" || !!s.items);
}

export function walkSchema(schema: JSONSchema, fn: (node: JSONSchema, path: string[]) => void, path: string[] = []) {
  if (!schema || typeof schema !== "object") return;
  fn(schema, path);
  if (schema.properties && typeof schema.properties === "object") {
    for (const [k, v] of Object.entries(schema.properties)) {
      walkSchema(v as JSONSchema, fn, [...path, "properties", k]);
    }
  }
  if (schema.items) {
    walkSchema(schema.items, fn, [...path, "items"]);
  }
  if (schema.anyOf) schema.anyOf.forEach((s: JSONSchema, i: number) => walkSchema(s, fn, [...path, "anyOf", String(i)]));
  if (schema.oneOf) schema.oneOf.forEach((s: JSONSchema, i: number) => walkSchema(s, fn, [...path, "oneOf", String(i)]));
  if (schema.allOf) schema.allOf.forEach((s: JSONSchema, i: number) => walkSchema(s, fn, [...path, "allOf", String(i)]));
}

export function getPath(schema: JSONSchema, path: string[]): JSONSchema | undefined {
  let cur: any = schema;
  for (const seg of path) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }
  return cur;
}

export function setPath(schema: JSONSchema, path: string[], val: any): JSONSchema {
  if (path.length === 0) return val;
  const [head, ...rest] = path;
  const clone = Array.isArray(schema) ? [...schema] : { ...schema };
  clone[head] = setPath(schema ? schema[head] : undefined, rest, val);
  return clone;
}
