import { z } from "zod";

/**
 * PatchDrop can be:
 * A) Patch needed (FILE blocks)
 * B) No patch needed (explicit rationale/evidence)
 * C) BLOCKED: missing evidence/context (asks user for the minimal next artifact)
 *
 * Backward compatible: all shapes include dropText for UI display/copy.
 */

const PatchDropWithChanges = z.object({
  repo: z.string().min(1),
  noPatchRequired: z.literal(false).optional().default(false),
  blocked: z.literal(false).optional().default(false),
  dropText: z.string().min(1),
});

const PatchDropNoPatchNeeded = z.object({
  repo: z.string().min(1),
  noPatchRequired: z.literal(true),
  blocked: z.literal(false).optional().default(false),
  rationale: z.string().min(1),
  evidence: z.string().optional(),
  dropText: z.string().min(1),
});

const PatchDropBlocked = z.object({
  repo: z.string().min(1),
  blocked: z.literal(true),
  noPatchRequired: z.literal(false).optional().default(false),
  evidenceRequest: z.string().min(1),
  suggestedFileFetchPaths: z.array(z.string().min(1)).max(20).optional().default([]),
  dropText: z.string().min(1),
});

export const PatchDropSchema = z.union([PatchDropWithChanges, PatchDropNoPatchNeeded, PatchDropBlocked]);

export type PatchDrop = z.infer<typeof PatchDropSchema>;
