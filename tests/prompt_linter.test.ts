// tests/prompt_linter.test.ts
import { lintSchema } from "../shared/lint/promptLinter";

describe("prompt linter basics", () => {
  it("adds additionalProperties:false to objects", () => {
    const schema = { type: "object", properties: { a: { type: "string" } } };
    const res = lintSchema(schema, true);
    expect(res.fixedSchema?.additionalProperties).toBe(false);
  });

  it("warns on string unconstrained", () => {
    const schema = { type: "object", properties: { a: { type: "string" } } };
    const res = lintSchema(schema, false);
    const code = res.issues.map(i => i.code);
    expect(code).toContain("string.unconstrained");
  });
});
