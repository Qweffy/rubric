import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  caseResults,
  cases,
  humanLabels,
  judges,
  judgeVerdicts,
  promptVersions,
  runs,
  suites,
  type CaseVerdict,
  type HumanLabel,
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

/* ------------------------------------------------------------------ */
/* Label candidates — cases of a suite's latest completed run that a    */
/* human still needs to grade. Powers `rubric label <suite>`: each      */
/* candidate carries everything a human needs to judge it (input /      */
/* expected / actual, every scorer verdict, the judge verdict +         */
/* reasoning), plus whether it already has a human gold label.          */
/* ------------------------------------------------------------------ */

/** One scorer's verdict on a label candidate, sorted by scorer name. */
export interface CandidateScorer {
  scorerName: string;
  pass: boolean;
  score: number;
  detail: string | null;
}

/** The newest judge verdict on a label candidate, when one exists. */
export interface CandidateJudge {
  judgeName: string;
  pass: boolean;
  score: number;
  reasoning: string | null;
}

/** A single case awaiting (or eligible for) a human gold label. */
export interface LabelCandidate {
  caseId: string;
  label: string | null;
  verdict: CaseVerdict;
  input: unknown;
  expected: unknown;
  actual: unknown;
  scorers: CandidateScorer[];
  /** Newest judge verdict on the case, null when no judge has graded it. */
  judge: CandidateJudge | null;
  /** The case's existing human gold label, null when not yet labeled. */
  humanLabel: HumanLabel | null;
}

export interface LabelCandidates {
  suiteId: number;
  suiteSlug: string;
  suiteTitle: string;
  runId: number;
  candidates: LabelCandidate[];
}

export interface LoadLabelCandidatesOptions {
  /** Include already-labeled cases (re-labeling). Default: only unlabeled. */
  includeLabeled?: boolean;
  /** Cap the number of candidates returned (applied after filtering). */
  limit?: number;
}

/**
 * Cases of a suite's latest completed run, each with its scorer + judge
 * verdicts and its current human label (null when unlabeled). By default only
 * unlabeled cases are returned; pass includeLabeled to re-label. Returns null
 * when the suite slug is unknown or the suite has no completed run.
 */
export async function loadLabelCandidates(
  suiteSlug: string,
  opts: LoadLabelCandidatesOptions = {},
): Promise<LabelCandidates | null> {
  const suiteRow = await db
    .select({ id: suites.id, slug: suites.slug, title: suites.title })
    .from(suites)
    .where(eq(suites.slug, suiteSlug))
    .limit(1);
  const suite = suiteRow[0];
  if (!suite) return null;

  // The suite's latest completed run — newest startedAt wins.
  const runRow = await db
    .select({ id: runs.id })
    .from(runs)
    .where(and(eq(runs.suiteId, suite.id), eq(runs.status, "completed")))
    .orderBy(desc(runs.startedAt))
    .limit(1);
  const run = runRow[0];
  if (!run) return null;

  // Left-join human_labels on (suiteId, caseId) so unlabeled cases survive.
  const caseRows = await db
    .select({
      caseRowId: cases.id,
      caseId: cases.caseId,
      label: cases.label,
      verdict: cases.verdict,
      input: cases.input,
      expected: cases.expected,
      actual: cases.actual,
      humanLabel: humanLabels.label,
    })
    .from(cases)
    .leftJoin(
      humanLabels,
      and(
        eq(humanLabels.suiteId, suite.id),
        eq(humanLabels.caseId, cases.caseId),
      ),
    )
    .where(eq(cases.runId, run.id))
    .orderBy(asc(cases.id));

  const filtered =
    opts.includeLabeled === true
      ? caseRows
      : caseRows.filter((c) => c.humanLabel === null);
  const limited =
    opts.limit !== undefined ? filtered.slice(0, Math.max(0, opts.limit)) : filtered;

  if (limited.length === 0) {
    return {
      suiteId: suite.id,
      suiteSlug: suite.slug,
      suiteTitle: suite.title,
      runId: run.id,
      candidates: [],
    };
  }

  const caseRowIds = limited.map((c) => c.caseRowId);

  const [scorerRows, verdictRows] = await Promise.all([
    db
      .select({
        caseRowId: caseResults.caseRowId,
        scorerName: caseResults.scorerName,
        pass: caseResults.pass,
        score: caseResults.score,
        detail: caseResults.detail,
      })
      .from(caseResults)
      .where(inArray(caseResults.caseRowId, caseRowIds))
      .orderBy(asc(caseResults.caseRowId), asc(caseResults.scorerName)),
    db
      .select({
        caseRowId: judgeVerdicts.caseRowId,
        judgeName: judges.name,
        pass: judgeVerdicts.pass,
        score: judgeVerdicts.score,
        reasoning: judgeVerdicts.reasoning,
        createdAt: judgeVerdicts.createdAt,
      })
      .from(judgeVerdicts)
      .innerJoin(judges, eq(judges.id, judgeVerdicts.judgeId))
      .where(inArray(judgeVerdicts.caseRowId, caseRowIds))
      .orderBy(desc(judgeVerdicts.createdAt)),
  ]);

  const scorersByCase = new Map<number, CandidateScorer[]>();
  for (const r of scorerRows) {
    const acc = scorersByCase.get(r.caseRowId) ?? [];
    acc.push({
      scorerName: r.scorerName,
      pass: r.pass,
      score: r.score,
      detail: r.detail,
    });
    scorersByCase.set(r.caseRowId, acc);
  }

  // Newest verdict per case wins — rows are newest-first, so first seen is kept.
  const judgeByCase = new Map<number, CandidateJudge>();
  for (const r of verdictRows) {
    if (judgeByCase.has(r.caseRowId)) continue;
    judgeByCase.set(r.caseRowId, {
      judgeName: r.judgeName,
      pass: r.pass,
      score: r.score,
      reasoning: r.reasoning,
    });
  }

  const candidates: LabelCandidate[] = limited.map((c) => ({
    caseId: c.caseId,
    label: c.label,
    verdict: c.verdict,
    input: c.input,
    expected: c.expected,
    actual: c.actual,
    scorers: scorersByCase.get(c.caseRowId) ?? [],
    judge: judgeByCase.get(c.caseRowId) ?? null,
    humanLabel: c.humanLabel,
  }));

  return {
    suiteId: suite.id,
    suiteSlug: suite.slug,
    suiteTitle: suite.title,
    runId: run.id,
    candidates,
  };
}
