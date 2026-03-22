import { z } from "zod";

// ─── Decision Schema ──────────────────────────────────────────────────

export const DecisionFrontmatter = z.object({
  id: z.string().regex(/^DEC-\d{6}-[A-F0-9]{4}$/i),
  date: z.string(), // YYYY-MM-DD
  context: z.string(),
  options: z.array(z.string()).min(2),
  choice: z.string(),
  informed_by: z.array(z.string()), // INS-/PRI- IDs that informed the decision
  outcome_date: z.string(), // YYYY-MM-DD — when to check the outcome
  status: z.enum(["pending", "success", "failure", "mixed"]),
  tags: z.array(z.string()).optional(),
});

export type DecisionData = z.infer<typeof DecisionFrontmatter>;

// ─── Decision Input (from JSON file) ──────────────────────────────────

export const DecisionInput = z.object({
  decisions: z.array(
    z.object({
      context: z.string(),
      options: z.array(z.string()).min(2),
      choice: z.string(),
      informed_by: z.array(z.string()),
      outcome_date: z.string(),
      tags: z.array(z.string()).optional(),
      body: z.string().optional(), // detailed reasoning in markdown
    })
  ),
});

export type DecisionInputData = z.infer<typeof DecisionInput>;

// ─── Prediction Schema ────────────────────────────────────────────────

export const PredictionFrontmatter = z.object({
  id: z.string().regex(/^PRED-\d{6}-[A-F0-9]{4}$/i),
  derived_from: z.array(z.string()), // PRI-/INS- IDs the prediction derives from
  claim: z.string(),
  falsifiable_metric: z.string(), // how to know if it's wrong
  deadline: z.string(), // YYYY-MM-DD — when this prediction should be evaluated
  status: z.enum(["active", "confirmed", "falsified"]),
  date_created: z.string(),
  tags: z.array(z.string()).optional(),
});

export type PredictionData = z.infer<typeof PredictionFrontmatter>;

// ─── Prediction Input (from JSON file) ────────────────────────────────

export const PredictionInput = z.object({
  predictions: z.array(
    z.object({
      derived_from: z.array(z.string()),
      claim: z.string(),
      falsifiable_metric: z.string(),
      deadline: z.string(),
      tags: z.array(z.string()).optional(),
      body: z.string().optional(), // detailed reasoning
    })
  ),
});

export type PredictionInputData = z.infer<typeof PredictionInput>;
