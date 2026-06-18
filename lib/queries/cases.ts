import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  caseResults,
  cases,
  judges,
  judgeVerdicts,
  promptVersions,
  runs,
  suites,
  type CaseVerdict,
  type JudgeProvider,
  type RubricResult,
  type ScorerFlippedFrom,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Case detail — one case under one run.                                */
/* Input / expected / actual blobs + every scorer's verdict + each      */
/* judge's reasoning and per-criterion rubric breakdown.                */
/* ------------------------------------------------------------------ */

export interface ScorerVerdict {
  scorerName: string;
  pass: boolean;
  score: number;
  detail: string | null;
  errors: string[];
  latencyMs: number | null;
  flippedFrom: ScorerFlippedFrom | null;
}

export interface CaseJudgeVerdict {
  judgeId: number;
  judgeName: string;
  provider: JudgeProvider;
  score: number;
  pass: boolean;
  /** Per-criterion rubric breakdown (criterion, pass, optional weight/note). */
  rubric: RubricResult[];
  reasoning: string | null;
  tokens: number | null;
  costUsd: number | null;
  createdAt: Date;
}

export interface CaseDetail {
  caseRowId: number;
  caseId: string;
  label: string | null;
  verdict: CaseVerdict;
  score: number;
  precondition: string | null;
  /** Arbitrary JSON blobs — validated upstream by the runner, opaque here. */
  input: unknown;
  expected: unknown;
  /** null until the case executes. */
  actual: unknown;
  /** Owning run + suite context, for the breadcrumb header. */
  runId: number;
  suiteSlug: string;
  suiteTitle: string;
  promptLabel: string;
  sha: string;
  /** One entry per scorer that ran on the case, sorted by scorer name. */
  scorers: ScorerVerdict[];
  /** One entry per judge verdict on the case, newest-first. */
  judgeVerdicts: CaseJudgeVerdict[];
}

/**
 * A single case's full detail, keyed by its case_results row id (the unique
 * per-run row, not the logical caseId which repeats across runs). Returns null
 * when the row id is unknown.
 */
export async function getCaseDetail(
  caseRowId: number,
): Promise<CaseDetail | null> {
  const found = await db
    .select({
      caseRowId: cases.id,
      caseId: cases.caseId,
      label: cases.label,
      verdict: cases.verdict,
      score: cases.score,
      precondition: cases.precondition,
      input: cases.input,
      expected: cases.expected,
      actual: cases.actual,
      runId: cases.runId,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
      promptLabel: promptVersions.label,
      sha: runs.sha,
    })
    .from(cases)
    .innerJoin(runs, eq(runs.id, cases.runId))
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
    .where(eq(cases.id, caseRowId))
    .limit(1);

  const c = found[0];
  if (!c) return null;

  const [scorerRows, verdictRows] = await Promise.all([
    db
      .select({
        scorerName: caseResults.scorerName,
        pass: caseResults.pass,
        score: caseResults.score,
        detail: caseResults.detail,
        errors: caseResults.errors,
        latencyMs: caseResults.latencyMs,
        flippedFrom: caseResults.flippedFrom,
      })
      .from(caseResults)
      .where(eq(caseResults.caseRowId, caseRowId))
      .orderBy(asc(caseResults.scorerName)),
    db
      .select({
        judgeId: judgeVerdicts.judgeId,
        judgeName: judges.name,
        provider: judges.provider,
        score: judgeVerdicts.score,
        pass: judgeVerdicts.pass,
        rubric: judgeVerdicts.rubricResults,
        reasoning: judgeVerdicts.reasoning,
        tokens: judgeVerdicts.tokens,
        costUsd: judgeVerdicts.costUsd,
        createdAt: judgeVerdicts.createdAt,
      })
      .from(judgeVerdicts)
      .innerJoin(judges, eq(judges.id, judgeVerdicts.judgeId))
      .where(eq(judgeVerdicts.caseRowId, caseRowId))
      .orderBy(asc(judges.name)),
  ]);

  return {
    caseRowId: c.caseRowId,
    caseId: c.caseId,
    label: c.label,
    verdict: c.verdict,
    score: c.score,
    precondition: c.precondition,
    input: c.input,
    expected: c.expected,
    actual: c.actual,
    runId: c.runId,
    suiteSlug: c.suiteSlug,
    suiteTitle: c.suiteTitle,
    promptLabel: c.promptLabel,
    sha: c.sha,
    scorers: scorerRows,
    judgeVerdicts: verdictRows,
  };
}
