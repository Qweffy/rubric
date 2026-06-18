import { type CaseVerdict } from "@/db/schema";

import { type Scorer, type ScorerContext, type ScoreResult } from "./types";

/* ------------------------------------------------------------------ */
/* Aggregation — fold scorer verdicts into case verdicts, and case      */
/* verdicts into a run summary the CI gate reads.                       */
/*                                                                      */
/* Two levels:                                                          */
/*   scoreCase: run every scorer for one case. If the case precondition  */
/*     resolved false, the whole case is 'skipped' and no scorer runs.   */
/*     Otherwise the case PASSES iff every (non-skipped) scorer passes;   */
/*     the case score is the weight-weighted mean of scorer scores.      */
/*   summarizeRun: fold cases into pass-rate, per-scorer pass-rates, and  */
/*     per-scorer flips vs an optional baseline.                        */
/*                                                                      */
/* exitCode applies the gate: green iff the run clears the global floor   */
/* AND every scorer clears its own floor.                               */
/* ------------------------------------------------------------------ */

/** One scorer's outcome on one case, tagged with the scorer's identity. */
export interface ScorerOutcome {
  name: string;
  weight: number;
  /** 'skipped' carries no pass/score into the case roll-up. */
  skipped: boolean;
  result: ScoreResult;
}

/** A fully scored case: verdict, weighted score, and the per-scorer trail. */
export interface CaseOutcome {
  caseId: string;
  verdict: CaseVerdict;
  /** Weighted mean of non-skipped scorer scores; 0 for a skipped case. */
  score: number;
  outcomes: ScorerOutcome[];
}

/** Input to {@link scoreCase}: the case, its scorers, and resolved gating. */
export interface CaseInput {
  ctx: ScorerContext;
  actual: unknown;
  expect: unknown;
  /**
   * Whether the case precondition held. `undefined` (no precondition) and
   * `true` both run the scorers; `false` skips the whole case.
   */
  preconditionMet?: boolean;
}

// A skipped scorer's placeholder result — never counted in pass-rates.
const SKIPPED_RESULT: ScoreResult = {
  pass: false,
  score: 0,
  detail: "skipped (precondition not met)",
  errors: [],
};

/** Weighted mean of the given outcomes' scores; 0 when no weight is active. */
function weightedMean(outcomes: readonly ScorerOutcome[]): number {
  let weightSum = 0;
  let acc = 0;
  for (const outcome of outcomes) {
    if (outcome.skipped) continue;
    // Negative/zero weights would distort the mean; clamp to non-negative.
    const weight = outcome.weight > 0 ? outcome.weight : 0;
    weightSum += weight;
    acc += weight * outcome.result.score;
  }
  return weightSum > 0 ? acc / weightSum : 0;
}

/**
 * Run every scorer for one case and fold the verdicts. Scorers run
 * concurrently (judge-backed ones await an LLM); a skipped case short-circuits
 * before any scorer is invoked.
 */
export async function scoreCase(
  scorers: readonly Scorer[],
  input: CaseInput,
): Promise<CaseOutcome> {
  if (input.preconditionMet === false) {
    const outcomes: ScorerOutcome[] = scorers.map((s) => ({
      name: s.name,
      weight: s.weight,
      skipped: true,
      result: SKIPPED_RESULT,
    }));
    return { caseId: input.ctx.caseId, verdict: "skipped", score: 0, outcomes };
  }

  const outcomes: ScorerOutcome[] = await Promise.all(
    scorers.map(async (scorer) => ({
      name: scorer.name,
      weight: scorer.weight,
      skipped: false,
      result: await scorer.score(input.actual, input.expect, input.ctx),
    })),
  );

  const active = outcomes.filter((o) => !o.skipped);
  // PASS iff every non-skipped scorer passes. An all-skipped case (no scorers,
  // or all gated out individually) has no failing scorer → it passes vacuously.
  const verdict: CaseVerdict = active.every((o) => o.result.pass) ? "pass" : "fail";
  const score = weightedMean(outcomes);

  return { caseId: input.ctx.caseId, verdict, score, outcomes };
}

/* ------------------------------ run level ------------------------------ */

/** A scorer's verdict on one case, condensed for flip detection. */
type ScorerVerdict = "pass" | "fail";

/** A flip: a scorer's verdict on a case changed vs the baseline. */
export interface ScorerFlip {
  scorer: string;
  caseId: string;
  from: ScorerVerdict;
  to: ScorerVerdict;
}

/** Per-scorer roll-up across all cases the scorer actually ran on. */
export interface ScorerSummary {
  name: string;
  /** Cases where this scorer ran (skipped cases excluded). */
  ran: number;
  passed: number;
  /** passed / ran; 0 when the scorer never ran. */
  passRate: number;
}

/** The whole-run summary the report renders and the gate reads. */
export interface RunSummary {
  total: number;
  passCount: number;
  failCount: number;
  skippedCount: number;
  /** passCount / (total - skippedCount); 0 when every case skipped. */
  passRate: number;
  scorers: ScorerSummary[];
  flips: ScorerFlip[];
}

/**
 * A baseline verdict map for flip detection: `baseline[caseId][scorerName]` is
 * that scorer's prior verdict. Missing entries mean "no prior" → no flip.
 */
export type BaselineMap = Record<string, Record<string, ScorerVerdict>>;

function condense(result: ScoreResult): ScorerVerdict {
  return result.pass ? "pass" : "fail";
}

/**
 * Fold scored cases into a run summary. `baseline`, when given, drives flip
 * detection: a scorer counts as flipped on a case when its current verdict
 * differs from the baseline's verdict for the same (caseId, scorerName).
 */
export function summarizeRun(
  cases: readonly CaseOutcome[],
  baseline?: BaselineMap,
): RunSummary {
  let passCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Preserve first-seen scorer order for stable report columns.
  const order: string[] = [];
  const ran = new Map<string, number>();
  const passed = new Map<string, number>();
  const flips: ScorerFlip[] = [];

  for (const caseOutcome of cases) {
    if (caseOutcome.verdict === "skipped") skippedCount += 1;
    else if (caseOutcome.verdict === "pass") passCount += 1;
    else failCount += 1;

    for (const outcome of caseOutcome.outcomes) {
      if (!ran.has(outcome.name)) {
        order.push(outcome.name);
        ran.set(outcome.name, 0);
        passed.set(outcome.name, 0);
      }
      if (outcome.skipped) continue;

      ran.set(outcome.name, (ran.get(outcome.name) ?? 0) + 1);
      const verdict = condense(outcome.result);
      if (verdict === "pass") {
        passed.set(outcome.name, (passed.get(outcome.name) ?? 0) + 1);
      }

      const prior = baseline?.[caseOutcome.caseId]?.[outcome.name];
      if (prior !== undefined && prior !== verdict) {
        flips.push({
          scorer: outcome.name,
          caseId: caseOutcome.caseId,
          from: prior,
          to: verdict,
        });
      }
    }
  }

  const scored = passCount + failCount;
  const scorers: ScorerSummary[] = order.map((name) => {
    const ranCount = ran.get(name) ?? 0;
    const passedCount = passed.get(name) ?? 0;
    return {
      name,
      ran: ranCount,
      passed: passedCount,
      passRate: ranCount > 0 ? passedCount / ranCount : 0,
    };
  });

  return {
    total: cases.length,
    passCount,
    failCount,
    skippedCount,
    passRate: scored > 0 ? passCount / scored : 0,
    scorers,
    flips,
  };
}

/* -------------------------------- gate -------------------------------- */

/**
 * CI gate config. `floor` is the minimum run pass-rate; `scorerFloors` is an
 * optional per-scorer minimum pass-rate (a scorer absent from the map must
 * still clear `scorerFloor`, the shared default, when set).
 */
export interface Gate {
  /** Minimum run-level pass-rate, in [0, 1]. */
  floor: number;
  /** Shared minimum per-scorer pass-rate when a scorer has no explicit floor. */
  scorerFloor?: number;
  /** Per-scorer pass-rate floors, keyed by scorer name. */
  scorerFloors?: Record<string, number>;
}

function floorFor(gate: Gate, scorer: string): number | undefined {
  return gate.scorerFloors?.[scorer] ?? gate.scorerFloor;
}

/**
 * Resolve the run to a process exit code: 0 (green) iff the run pass-rate
 * clears `gate.floor` AND every scorer clears its applicable floor; 1 (red)
 * otherwise. A scorer with no applicable floor is unconstrained.
 */
export function exitCode(summary: RunSummary, gate: Gate): 0 | 1 {
  if (summary.passRate < gate.floor) return 1;
  for (const scorer of summary.scorers) {
    const floor = floorFor(gate, scorer.name);
    if (floor !== undefined && scorer.passRate < floor) return 1;
  }
  return 0;
}
