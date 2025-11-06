/**
 * Prompt Linter for structured JSON outputs.
 * Flags common schema pitfalls and proposes safe auto-fixes.
 */
export interface LintIssue {
  code: string;
  message: string;
  path?: string;
  suggestion?: any;
}

export function lintSchema(schema: any, opts: { autoFix?: boolean } = {}): { issues: LintIssue[]; schema: any } {
  const issues: LintIssue[] = [];
  const s = JSON.parse(JSON.stringify(schema));

  // 1) Add additionalProperties: false at object roots if missing
  function ensureNoAdditional(obj: any, path = "$") {
    if (obj && obj.type === "object") {
      if (obj.additionalProperties === undefined) {
        issues.push({
          code: "OBJ_ADDITIONAL_PROPS_MISSING",
          message: `Object at ${path} lacks additionalProperties:false (can degrade JSON compliance).`,
          path,
          suggestion: { additionalProperties: false },
        });
        if (opts.autoFix) obj.additionalProperties = false;
      }
      if (obj.properties) {
        for (const [k, v] of Object.entries(obj.properties)) {
          ensureNoAdditional(v, `${path}.properties.${k}`);
        }
      }
    }
    // arrays: dive into items
    if (obj && obj.type === "array" && obj.items) {
      ensureNoAdditional(obj.items, `${path}.items`);
    }
  }

  // 2) Avoid very deep unions (simple heuristic)
  function checkUnions(obj: any, path = "$", depth = 0) {
    if (!obj) return;
    const unionKeys = ["anyOf", "oneOf", "allOf"];
    for (const k of unionKeys) {
      if (Array.isArray(obj[k])) {
        if (obj[k].length > 5) {
          issues.push({
            code: "DEEP_UNION",
            message: `${k} at ${path} has ${obj[k].length} variants; consider simplifying.`,
            path,
          });
        }
        obj[k].forEach((child: any, i: number) => checkUnions(child, `${path}.${k}[${i}]`, depth + 1));
      }
    }
    if (obj.properties) {
      for (const [key, child] of Object.entries(obj.properties)) {
        checkUnions(child, `${path}.properties.${key}`, depth + 1);
      }
    }
    if (obj.items) checkUnions(obj.items, `${path}.items`, depth + 1);
  }

  ensureNoAdditional(s);
  checkUnions(s);
  return { issues, schema: s };
}
