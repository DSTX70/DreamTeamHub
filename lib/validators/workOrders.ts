import { z } from "zod";

export const UUID = z.string().uuid("invalid UUID");

export const AutonomyLevel = z.enum(["L0","L1","L2","L3"]);

export const WorkOrderCaps = z.object({
  runsPerDay: z.number().int().min(1).max(10000).default(100),
  usdPerDay: z.number().min(0).max(1_000_000).default(2.0),
}).partial().default({});

export const WorkOrderKpis = z.object({
  successMin: z.number().int().min(0).max(100).default(90),
  p95Max: z.number().min(0).max(60_000).default(3.0),
}).partial().default({});

export const WorkOrderCreateBody = z.object({
  title: z.string().min(3, "title too short"),
  owner: z.string().min(2, "owner too short"),
  autonomy: AutonomyLevel.default("L1").optional(),
  inputs: z.string().min(1, "inputs required"),
  output: z.string().min(1, "output required"),
  caps: WorkOrderCaps.optional(),
  kpis: WorkOrderKpis.optional(),
  playbook: z.string().max(50000).optional(),
  stop: z.string().max(1000).optional(),
});

export type WorkOrderCreateBody = z.infer<typeof WorkOrderCreateBody>;

export const WorkOrderStartBody = z.object({
  agent: z.string().min(2, "agent required"),
});

export type WorkOrderStartBody = z.infer<typeof WorkOrderStartBody>;
