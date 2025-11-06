import { z } from "zod";

export const PublishHeaders = z.object({
  "x-reviewer-token": z.string().min(12, "reviewer token required (min 12 chars)"),
  "idempotency-key": z.string().max(255).optional(),
});

export type PublishHeaders = z.infer<typeof PublishHeaders>;

export const PublishApprover = z.object({
  name: z.string().min(2, "approver name required (min 2 chars)"),
  email: z.string().email("invalid approver email").optional(),
});

export const PublishBody = z.object({
  approver: PublishApprover,
  note: z.string().max(2000, "note too long (max 2000 chars)").optional(),
});

export type PublishBody = z.infer<typeof PublishBody>;

export const LegacyPublishBody = z.object({
  fileId: z.string().min(1, "fileId required"),
  fileName: z.string().min(1, "fileName required").optional(),
  fileUrl: z.string().url("invalid fileUrl").optional(),
  ownerType: z.string().optional(),
  ownerId: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export type LegacyPublishBody = z.infer<typeof LegacyPublishBody>;
