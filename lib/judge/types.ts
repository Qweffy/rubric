/* ------------------------------------------------------------------ */
/* Judge seam — the contract a judge provider implements.               */
/* An adapter takes a rubric + the case's input/output and returns a    */
/* raw, unvalidated verdict; the caller parses it through               */
/* judgeVerdictSchema before trusting any field.                        */
/* ------------------------------------------------------------------ */

/** A single judging request: the rubric to grade against plus the I/O. */
export interface JudgeRequest {
  rubric: string[];
  input: unknown;
  output: unknown;
  expectedAnswer?: string;
}

/**
 * Raw judge response. Untyped on purpose — it comes from an LLM and must be
 * validated through judgeVerdictSchema before any field is read.
 */
export type RawJudgeOutput = unknown;

/** A judge provider (Groq, Ollama, recorded fixture, …). */
export interface JudgeAdapter {
  readonly model: string;
  judge(req: JudgeRequest): Promise<RawJudgeOutput>;
}
