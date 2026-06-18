/* ------------------------------------------------------------------ */
/* Scorer seam — the contract every scorer implements.                  */
/* A scorer takes a case's actual output, its expected blob, and case   */
/* context, and returns a single normalized verdict. The runner depends */
/* only on these types, never on a concrete scorer.                     */
/* ------------------------------------------------------------------ */

/** Per-case context a scorer may need beyond the actual/expect pair. */
export interface ScorerContext {
  /** Logical case id (CaseSpec.id), stable across runs. */
  caseId: string;
  /** Suite slug the case belongs to. */
  suite: string;
}

/**
 * A single scorer's verdict for one case. `score` is normalized to [0, 1];
 * `pass` is the binary call; `detail` is a human-readable one-liner; `errors`
 * enumerates concrete mismatches (empty when passing).
 */
export interface ScoreResult {
  pass: boolean;
  score: number;
  detail: string;
  errors: string[];
}

/**
 * A scoring strategy. `weight` is its relative contribution to the case's
 * aggregate score. `score` is async so judge-backed scorers can await an
 * LLM call; deterministic scorers resolve immediately.
 */
export interface Scorer {
  name: string;
  weight: number;
  score(
    actual: unknown,
    expect: unknown,
    ctx: ScorerContext,
  ): Promise<ScoreResult>;
}
