import { z } from "zod";

export const SupportIssueSchema = z.object({
  slug: z.string(),
  title: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  root_causes: z.array(z.string()).optional(),
  resolution_steps: z.array(z.string()).optional(),
});

export const ResponseMacroSchema = z.object({
  issue_slug: z.string(),
  channel: z.enum(["email", "chat", "phone", "social"]),
  template: z.string(),
  tone: z.enum(["formal", "friendly", "empathetic", "urgent"]).optional(),
});

export const KbArticleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  outline: z.array(z.string()),
  related_issues: z.array(z.string()).optional(),
});

export const SupportPlaybookKnowledgeBasePackSchema = z.object({
  overview: z.string(),
  top_issues: z.array(SupportIssueSchema),
  response_macros: z.array(ResponseMacroSchema),
  triage_tree_description: z.string(),
  kb_articles: z.array(KbArticleSchema),
  escalation_triggers: z.array(z.string()).optional(),
  feedback_loop_notes: z.string().optional(),
});

export type SupportPlaybookKnowledgeBasePack = z.infer<
  typeof SupportPlaybookKnowledgeBasePackSchema
>;
