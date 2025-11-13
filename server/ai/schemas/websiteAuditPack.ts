import { z } from "zod";

export const AuditPageSchema = z.object({
  url: z.string(),
  label: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  template_type: z.string().optional(),
});

export const AuditFindingSchema = z.object({
  id: z.string(),
  page_url: z.string(),
  area: z.enum([
    "SEO",
    "Content",
    "UX",
    "Brand",
    "Performance",
    "Accessibility",
    "Risk",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  recommendation: z.string(),
  effort: z.enum(["S", "M", "L"]),
});

export const AuditChecklistItemSchema = z.object({
  label: z.string(),
  status: z.enum(["pass", "fail", "n/a", "unknown"]),
  notes: z.string().optional(),
});

export const AuditChecklistSchema = z.object({
  area: z.enum(["SEO", "UX", "Brand", "Performance", "Accessibility"]),
  items: z.array(AuditChecklistItemSchema),
});

export const AuditRoadmapBucketSchema = z.object({
  bucket: z.enum(["do_now", "do_next", "do_later"]),
  finding_ids: z.array(z.string()),
  narrative: z.string(),
});

export const WebsiteAuditPackSchema = z.object({
  site_name: z.string(),
  base_url: z.string(),
  environment: z.enum(["production", "staging", "dev"]),
  summary: z.object({
    headline: z.string(),
    key_wins: z.array(z.string()),
    key_issues: z.array(z.string()),
  }),
  pages: z.array(AuditPageSchema),
  findings: z.array(AuditFindingSchema),
  checklists: z.array(AuditChecklistSchema),
  roadmap: z.array(AuditRoadmapBucketSchema),
});

export type WebsiteAuditPack = z.infer<typeof WebsiteAuditPackSchema>;
export type AuditPage = z.infer<typeof AuditPageSchema>;
export type AuditFinding = z.infer<typeof AuditFindingSchema>;
export type AuditChecklistItem = z.infer<typeof AuditChecklistItemSchema>;
export type AuditChecklist = z.infer<typeof AuditChecklistSchema>;
export type AuditRoadmapBucket = z.infer<typeof AuditRoadmapBucketSchema>;
