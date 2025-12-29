import { z } from "zod";

export const PatchDropSchema = z.object({
  repo: z.string().min(1),
  dropText: z.string().min(1),
});

export type PatchDrop = z.infer<typeof PatchDropSchema>;
