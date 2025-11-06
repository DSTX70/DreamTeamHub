import { z } from "zod";

export const OpsKind = z.string().min(2, "kind required (min 2 chars)");
export const OwnerType = z.enum(["BU","BRAND","PRODUCT","PROJECT"]);
export const UUID = z.string().uuid("invalid UUID");

export const PostOpsBody = z.object({
  kind: OpsKind,
  actor: z.string().min(1).optional(),
  ownerType: OwnerType.optional(),
  ownerId: z.string().optional(),
  message: z.string().max(2000, "message too long (max 2000 chars)").optional(),
  meta: z.record(z.any()).optional(),
});

export type PostOpsBody = z.infer<typeof PostOpsBody>;

export const GetOpsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  kind: z.string().optional(),
  owner_type: OwnerType.optional(),
  owner_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type GetOpsQuery = z.infer<typeof GetOpsQuery>;
