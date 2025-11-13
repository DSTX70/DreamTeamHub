import { z } from "zod";

export const AcademyModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration_minutes: z.number().int(),
  format: z.enum(["video", "workshop", "lab", "reading", "office_hours"]),
  description: z.string(),
  outcomes: z.array(z.string()),
  required_assets: z.array(z.string()),
});

export const AcademyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  objectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  modules: z.array(AcademyModuleSchema),
});

export const CertificationPathSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["L1", "L2", "L3"]),
  target_role: z.string(),
  required_tracks: z.array(z.string()),
  exam_format: z.string(),
  criteria: z.array(z.string()),
});

export const AcademyLogisticsSchema = z.object({
  cohort_length_weeks: z.number().int(),
  cadence: z.string(),
  max_seats: z.number().int(),
  delivery_model: z.string(),
});

export const AgentLabAcademyPackSchema = z.object({
  summary: z.object({
    headline: z.string(),
    primary_audience: z.string(),
    key_outcomes: z.array(z.string()),
  }),
  tracks: z.array(AcademyTrackSchema),
  certifications: z.array(CertificationPathSchema),
  logistics: AcademyLogisticsSchema,
  open_questions: z.array(z.string()),
});

export type AgentLabAcademyPack = z.infer<typeof AgentLabAcademyPackSchema>;
