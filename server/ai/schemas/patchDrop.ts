import { z } from "zod";

/**
 * Pilot F: PatchDrop can be either:
 * A) A real patch drop with FILE blocks
 * B) A "No Patch Needed" outcome when repo context shows the fix already exists
 *
 * Backward compatible: both shapes include dropText so the UI can still display/copy.
 */

const PatchDropWithChanges = z.object({
  repo: z.string().min(1),
  noPatchRequired: z.literal(false).optional().default(false),
  dropText: z.string().min(1),
});

const PatchDropNoPatchNeeded = z.object({
  repo: z.string().min(1),
  noPatchRequired: z.literal(true),
  rationale: z.string().min(1),
  evidence: z.string().optional(),
  // Keep dropText for UI compatibility (display + copy). Must be present.
  dropText: z.string().min(1),
});

export const PatchDropSchema = z.union([PatchDropWithChanges, PatchDropNoPatchNeeded]);

export type PatchDrop = z.infer<typeof PatchDropSchema>;
