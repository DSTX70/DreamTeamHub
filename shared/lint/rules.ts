// shared/lint/rules.ts
import { JSONSchema, isObjectSchema, isArraySchema, walkSchema } from "./jsonSchemaUtils";

export type LintIssue = {
  code: string;
  level: "warning" | "error";
  message: string;
  path: string[];
  fix?: { description: string; apply: (schema: JSONSchema) => JSONSchema };
};

// Rule: object schemas should default to additionalProperties:false for predictable outputs
export function ruleAdditionalProperties(schema: JSONSchema): LintIssue[] {
  const out: LintIssue[] = [];
  walkSchema(schema, (node, path) => {
    if (isObjectSchema(node)) {
      if (node.additionalProperties === undefined) {
        out.push({
          code: "object.additionalProperties.missing",
          level: "warning",
          message: "Object schema without `additionalProperties`. Add `additionalProperties:false` to reduce extra fields in outputs.",
          path,
          fix: {
            description: "Set additionalProperties:false",
            apply: (root) => {
              const target = path.reduce((acc: any, k: string) => (acc ? acc[k] : undefined), root);
              if (target && target.additionalProperties === undefined) target.additionalProperties = false;
              return root;
            }
          }
        });
      }
    }
  });
  return out;
}

// Rule: unconstrained primitives
export function ruleUnconstrainedPrimitives(schema: JSONSchema): LintIssue[] {
  const out: LintIssue[] = [];
  walkSchema(schema, (node, path) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "string" && !node.enum && node.minLength === undefined) {
      out.push({
        code: "string.unconstrained",
        level: "warning",
        message: "String without enum/minLength — consider adding `minLength` or `enum`.",
        path,
        fix: {
          description: "Add minLength:1",
          apply: (root) => {
            const target = path.reduce((acc: any, k: string) => (acc ? acc[k] : undefined), root);
            if (target && target.type === "string" && target.minLength === undefined) target.minLength = 1;
            return root;
          }
        }
      });
    }
    if (node.type === "number" && node.minimum === undefined && node.maximum === undefined) {
      out.push({
        code: "number.unconstrained",
        level: "warning",
        message: "Number without bounds — consider adding `minimum`/`maximum`.",
        path
      });
    }
    if (isArraySchema(node) && !node.items) {
      out.push({
        code: "array.items.missing",
        level: "error",
        message: "Array without `items` schema — model may emit arbitrary content.",
        path
      });
    }
  });
  return out;
}

// Rule: any/unknown types
export function ruleAnyLike(schema: JSONSchema): LintIssue[] {
  const out: LintIssue[] = [];
  walkSchema(schema, (node, path) => {
    const noType = node.type === undefined && !node.properties && !node.items && !node.anyOf && !node.oneOf && !node.allOf;
    if (noType) {
      out.push({
        code: "type.unknown",
        level: "warning",
        message: "Schema node with no explicit type — consider specifying `type`.",
        path
      });
    }
  });
  return out;
}

// Rule: deep unions (hard for JSON compliance)
export function ruleDeepUnions(schema: JSONSchema): LintIssue[] {
  const out: LintIssue[] = [];
  walkSchema(schema, (node, path) => {
    const unionLen = (node.anyOf?.length || 0) + (node.oneOf?.length || 0);
    if (unionLen >= 3) {
      out.push({
        code: "union.deep",
        level: "warning",
        message: "Union with 3+ branches — consider simplifying or adding discriminators.",
        path
      });
    }
  });
  return out;
}

export function runAllRules(schema: JSONSchema): LintIssue[] {
  return [
    ...ruleAdditionalProperties(schema),
    ...ruleUnconstrainedPrimitives(schema),
    ...ruleAnyLike(schema),
    ...ruleDeepUnions(schema),
  ];
}
