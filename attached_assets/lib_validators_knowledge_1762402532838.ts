// lib/validators/knowledge.ts
import { z } from "zod";

export const OwnerType = z.enum(["BU","BRAND","PRODUCT"]);
export const UUID = z.string().uuid("invalid UUID");

export const SearchQuery = z.object({
  q: z.string().min(2, "q required (min 2 chars)"),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuery>;

export const DraftUploadBody = z.object({
  text: z.string().min(1, "text required"),
  fileName: z.string().min(1).max(255)
    .regex(/^[^\/\\:*?"<>|]+$/, "invalid filename"),
  mimeType: z.string().min(3).max(255).optional(),
});

export type DraftUploadBody = z.infer<typeof DraftUploadBody>;
