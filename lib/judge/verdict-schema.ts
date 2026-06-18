import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Judge verdict boundary — the schema every raw judge output is parsed */
/* through before it's trusted. strictObject so an LLM hallucinating an */
/* extra key fails loudly; the same schema feeds z.toJSONSchema to pin  */
/* the provider's structured-output / strict mode.                      */
/* ------------------------------------------------------------------ */

export const judgeVerdictSchema = z.strictObject({
  score: z.number().int().min(0).max(5),
  pass: z.boolean(),
  rubricResults: z.array(
    z.strictObject({
      criterion: z.string(),
      pass: z.boolean(),
    }),
  ),
  reasoning: z.string(),
});

export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;
