import { getJudge } from "@/lib/judge/factory";
import { type JudgeAdapter, type JudgeRequest } from "@/lib/judge/types";
import {
  type JudgeVerdict,
  judgeVerdictSchema,
} from "@/lib/judge/verdict-schema";
import { type Scorer, type ScoreResult, type ScorerContext } from "@/lib/scorers/types";
import { type JudgeScorer } from "@/lib/spec/types";
import { parseOrResult } from "@/lib/validation";

/* ------------------------------------------------------------------ */
/* Judge-backed scorer.                                                 */
/* Builds a JudgeRequest from the case, calls the adapter (the injected */
/* one in tests, else the env-configured getJudge()), and parses the    */
/* raw output through judgeVerdictSchema — that parse is the boundary,   */
/* strict mode only guarantees shape. One repair retry on parse failure  */
/* (re-call the adapter), then the scorer fails the case loudly.         */
/*                                                                       */
/* Verdict score is 0..5; ScoreResult.score is normalized to [0,1] as    */
/* score/5. pass = verdict.score >= passScore (both on the 0..5 scale).  */
/* ------------------------------------------------------------------ */

const VERDICT_MAX = 5;

/** Pull the expected answer out of the case's expected blob, if present. */
function expectedAnswer(expect: unknown): string | undefined {
  if (typeof expect === "string") return expect;
  if (expect !== null && typeof expect === "object") {
    const record = expect as Record<string, unknown>;
    const candidate = record.answer ?? record.expected ?? record.output;
    if (typeof candidate === "string") return candidate;
  }
  return undefined;
}

function toScoreResult(
  verdict: JudgeVerdict,
  passScore: number,
): ScoreResult {
  const pass = verdict.score >= passScore;
  const failed = verdict.rubricResults
    .filter((r) => !r.pass)
    .map((r) => r.criterion);
  return {
    pass,
    score: verdict.score / VERDICT_MAX,
    detail:
      verdict.reasoning ||
      `judge scored ${verdict.score}/${VERDICT_MAX} (pass≥${passScore})`,
    errors: pass ? [] : failed,
  };
}

/**
 * A judge-backed Scorer. Pass a concrete `adapter` to inject a mock (tests run
 * with no key); omit it to resolve the env-configured adapter lazily, per call,
 * via getJudge() — so constructing the scorer never reads a key.
 */
export function judgeScorer(
  spec: JudgeScorer,
  adapter?: JudgeAdapter,
): Scorer {
  return {
    name: spec.name,
    weight: spec.weight,
    async score(
      actual: unknown,
      expect: unknown,
      _ctx: ScorerContext,
    ): Promise<ScoreResult> {
      void _ctx;
      const judge = adapter ?? getJudge();
      // The Scorer seam carries the system OUTPUT (actual) and the EXPECTED blob,
      // not the original case input — so `input` here is the expected context,
      // and `output` is the value under grade. The reference answer, when the
      // expected blob exposes one, rides in expectedAnswer.
      const req: JudgeRequest = {
        rubric: spec.rubric,
        input: expect,
        output: actual,
        expectedAnswer: expectedAnswer(expect),
      };

      const first = parseOrResult(judgeVerdictSchema, await judge.judge(req));
      if (first.ok) return toScoreResult(first.data, spec.passScore);

      // One repair retry: re-ask the adapter, then fail the case if still invalid.
      const second = parseOrResult(judgeVerdictSchema, await judge.judge(req));
      if (second.ok) return toScoreResult(second.data, spec.passScore);

      const reason = second.error;
      return {
        pass: false,
        score: 0,
        detail: `judge output failed validation twice: ${reason}`,
        errors: [reason],
      };
    },
  };
}
