import { z } from "zod";

export const OwnerType = z.enum(["BU","BRAND","PRODUCT","PROJECT"]);
export const UUID = z.string().uuid("invalid UUID");

export const SearchQuery = z.object({
  q: z.string().min(2, "q required (min 2 chars)"),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuery>;

export const DraftUploadBody = z.object({
  text: z.string().min(1, "text required"),
  fileName: z.string()
    .min(1)
    .max(255)
    .regex(/^[^\/\\:*?"<>|]+$/, "invalid filename"),
  mimeType: z.string().min(3).max(255).optional(),
});

export type DraftUploadBody = z.infer<typeof DraftUploadBody>;

export const PublishBody = z.object({
  fileId: z.string().min(1, "fileId required"),
  fileName: z.string().min(1, "fileName required").optional(),
  fileUrl: z.string().url("invalid fileUrl").optional(),
  ownerType: OwnerType.optional(),
  ownerId: z.string().min(1).optional(),
  meta: z.record(z.any()).optional(),
});

export type PublishBody = z.infer<typeof PublishBody>;
