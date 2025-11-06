// shared/lint/promptLinter.ts
import { JSONSchema } from "./jsonSchemaUtils";
import { LintIssue, runAllRules } from "./rules";

export type LintResult = {
  issues: LintIssue[];
  fixedSchema?: JSONSchema;
};

export function lintSchema(schema: JSONSchema, applyFixes = false): LintResult {
  const issues = runAllRules(schema);
  if (!applyFixes) return { issues };
  const clone = JSON.parse(JSON.stringify(schema));
  for (const i of issues) {
    if (i.fix?.apply) i.fix.apply(clone);
  }
  return { issues, fixedSchema: clone };
}
