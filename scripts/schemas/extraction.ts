import { z } from "zod";

const lowerCase = (val: unknown) =>
  typeof val === "string" ? val.toLowerCase() : val;

export const ExtractionInsight = z.object({
  domain: z.string(),
  topic: z.string(),
  subtopic: z.string().optional(),
  title: z.string(),
  actionability: z.preprocess(
    lowerCase,
    z.enum(["immediate", "reference", "inspiration"])
  ),
  confidence: z.preprocess(
    lowerCase,
    z.enum(["pending", "low", "medium", "high", "very_high"])
  ),
  shelf_life: z.preprocess(
    lowerCase,
    z.enum(["evergreen", "time-sensitive"])
  ),
  tags: z.array(z.string()),
  resolutions: z.object({
    one_line: z.string(),
    standard: z.string(),
    deep: z.string().optional(),
  }),
});

export const ExtractionInput = z.object({
  source_summary: z.string(),
  insights: z.array(ExtractionInsight),
});

export type ExtractionInsightData = z.infer<typeof ExtractionInsight>;
export type ExtractionInputData = z.infer<typeof ExtractionInput>;
