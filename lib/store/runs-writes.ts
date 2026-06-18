import { db } from "@/db";
import {
  type CaseVerdict,
  type RunStatus,
  type RunTrigger,
  type ScorerFlippedFrom,
  type SuiteStatus,
} from "@/db/schema";

import {
  insertCase,
  insertCaseResult,
  insertRun,
  updateSuiteLatestRun,
} from "./primitives";

/**
 * Persist a completed run and its full case tree in one transaction.
 *
 * rubric runs on better-sqlite3, which — unlike hiring-radar's neon-http —
 * supports synchronous transactions. persistRun wraps the whole fan-out in a
 * single db.transaction(): the run row, every case, every case_result, and the
 * suite's latestRunId/status update all commit atomically or not at all. A
 * half-written run never becomes visible to a reader.
 *
 * The case / case_result writes go through the idempotent insert* primitives,
 * which upsert against the schema's unique indexes (cases on (runId, caseId),
 * case_results on (caseRowId, scorerName)). The run row itself has no natural
 * unique key, so re-persisting a summary inserts a fresh run — callers that
 * want to retry a specific run should delete it first (cascade clears its tree).
 */

/** One scorer's contribution to a case, as produced by the runner. */
export interface ScorerResultInput {
  scorerName: string;
  pass: boolean;
  /** Normalized to [0, 1]. */
  score: number;
  detail?: string | null;
  errors: string[];
  latencyMs?: number | null;
  /** Set when this scorer's verdict flipped vs the prior run. */
  flippedFrom?: ScorerFlippedFrom | null;
}

/** A single case within a run, with all of its scorer results. */
export interface CaseSummaryInput {
  caseId: string;
  label?: string | null;
  input: unknown;
  expected: unknown;
  actual?: unknown;
  verdict: CaseVerdict;
  /** Aggregate case score, normalized to [0, 1]. */
  score: number;
  precondition?: string | null;
  scorers: ScorerResultInput[];
}

/** The full result of one suite execution, ready to persist. */
export interface RunSummary {
  suiteId: number;
  promptVersionId: number;
  sha: string;
  branch: string;
  trigger?: RunTrigger;
  triggeredBy?: string | null;
  status?: RunStatus;
  costUsd: number;
  wallMs: number;
  startedAt: Date;
  finishedAt?: Date | null;
  /** Grade to stamp on the parent suite once the run lands. */
  suiteStatus: SuiteStatus;
  cases: CaseSummaryInput[];
}

export interface PersistRunResult {
  runId: number;
  caseCount: number;
  scorerCount: number;
}

interface VerdictTally {
  total: number;
  passCount: number;
  failCount: number;
  skippedCount: number;
  passRate: number;
}

function tallyVerdicts(caseSummaries: readonly CaseSummaryInput[]): VerdictTally {
  let passCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  for (const c of caseSummaries) {
    if (c.verdict === "pass") passCount += 1;
    else if (c.verdict === "fail") failCount += 1;
    else skippedCount += 1;
  }
  // Skipped cases don't count against the pass rate — only graded cases do.
  const graded = passCount + failCount;
  return {
    total: caseSummaries.length,
    passCount,
    failCount,
    skippedCount,
    passRate: graded === 0 ? 0 : passCount / graded,
  };
}

/**
 * Persist a run and its entire case/scorer tree atomically, then point the suite
 * at it. Returns the new run id and the counts written.
 */
export function persistRun(summary: RunSummary): PersistRunResult {
  const tally = tallyVerdicts(summary.cases);

  return db.transaction((tx) => {
    const runId = insertRun(
      {
        suiteId: summary.suiteId,
        promptVersionId: summary.promptVersionId,
        sha: summary.sha,
        branch: summary.branch,
        trigger: summary.trigger ?? "manual",
        triggeredBy: summary.triggeredBy ?? null,
        status: summary.status ?? "completed",
        total: tally.total,
        passCount: tally.passCount,
        failCount: tally.failCount,
        skippedCount: tally.skippedCount,
        passRate: tally.passRate,
        costUsd: summary.costUsd,
        wallMs: summary.wallMs,
        startedAt: summary.startedAt,
        finishedAt: summary.finishedAt ?? new Date(),
      },
      tx,
    );

    let scorerCount = 0;
    for (const c of summary.cases) {
      const caseRowId = insertCase(
        {
          runId,
          caseId: c.caseId,
          label: c.label ?? null,
          input: c.input,
          expected: c.expected,
          actual: c.actual ?? null,
          verdict: c.verdict,
          score: c.score,
          precondition: c.precondition ?? null,
        },
        tx,
      );

      for (const s of c.scorers) {
        insertCaseResult(
          {
            caseRowId,
            scorerName: s.scorerName,
            pass: s.pass,
            score: s.score,
            detail: s.detail ?? null,
            errors: s.errors,
            latencyMs: s.latencyMs ?? null,
            flippedFrom: s.flippedFrom ?? null,
          },
          tx,
        );
        scorerCount += 1;
      }
    }

    updateSuiteLatestRun(summary.suiteId, runId, summary.suiteStatus, new Date(), tx);

    return { runId, caseCount: summary.cases.length, scorerCount };
  });
}
