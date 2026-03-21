import { z } from "zod";

export const SessionState = z.object({
  focus_area: z.string(),
  train_of_thought: z.string(),
  active_files: z.array(z.string()),
  open_loops: z.array(z.string()),
  next_actions: z.array(z.string()),
});

export type SessionStateData = z.infer<typeof SessionState>;
