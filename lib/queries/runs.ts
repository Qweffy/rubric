import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  caseResults,
  cases,
  promptVersions,
  runs,
  suites,
  type CaseVerdict,
  type RunStatus,
  type RunTrigger,
  type ScorerFlippedFrom,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Run detail — the case × scorer matrix for one run.                   */
/* Summary header + a dense grid of per-(case, scorer) cells, plus a    */
/* per-scorer pass-rate footer. Drives the run inspector screen.        */
/* ------------------------------------------------------------------ */

export interface RunSummary {
  id: number;
  suiteId: number;
  suiteSlug: string;
  suiteTitle: string;
  promptLabel: string;
  promptRef: string | null;
  sha: string;
  branch: string;
  trigger: RunTrigger;
  triggeredBy: string | null;
  status: RunStatus;
  total: number;
  passCount: number;
  failCount: number;
  skippedCount: number;
  passRate: number;
  costUsd: number;
  wallMs: number;
  startedAt: Date;
  finishedAt: Date | null;
}

/** One cell of the case × scorer matrix. null when a scorer didn't run on a case. */
export interface MatrixCell {
  pass: boolean;
  score: number;
  detail: string | null;
  /** Concrete mismatches surfaced on hover. */
  errors: string[];
  /** Set when this scorer's verdict changed vs. the prior run. */
  flippedFrom: ScorerFlippedFrom | null;
}

export interface MatrixRow {
  caseRowId: number;
  caseId: string;
  label: string | null;
  verdict: CaseVerdict;
  score: number;
  /** Cells aligned to RunDetail.scorers order; null where a scorer is absent. */
  cells: (MatrixCell | null)[];
}

export interface ScorerColumn {
  name: string;
  /** Fraction of executed cases this scorer passed (0-1). */
  passRate: number;
  passCount: number;
  total: number;
}

export interface RunDetail {
  summary: RunSummary;
  /** Column order for the matrix — stable, sorted by scorer name. */
  scorers: ScorerColumn[];
  rows: MatrixRow[];
}

/**
 * A run's full case × scorer matrix. One header read, then cases + their scorer
 * results, assembled into a dense grid with a per-scorer pass-rate footer.
 * Returns null when the run id is unknown.
 */
export async function getRunDetail(runId: number): Promise<RunDetail | null> {
  const header = await db
    .select({
      id: runs.id,
      suiteId: runs.suiteId,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
      promptLabel: promptVersions.label,
      promptRef: promptVersions.ref,
      sha: runs.sha,
      branch: runs.branch,
      trigger: runs.trigger,
      triggeredBy: runs.triggeredBy,
      status: runs.status,
      total: runs.total,
      passCount: runs.passCount,
      failCount: runs.failCount,
      skippedCount: runs.skippedCount,
      passRate: runs.passRate,
      costUsd: runs.costUsd,
      wallMs: runs.wallMs,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
    })
    .from(runs)
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
    .where(eq(runs.id, runId))
    .limit(1);

  const summary = header[0];
  if (!summary) return null;

  const caseRows = await db
    .select({
      caseRowId: cases.id,
      caseId: cases.caseId,
      label: cases.label,
      verdict: cases.verdict,
      score: cases.score,
    })
    .from(cases)
    .where(eq(cases.runId, runId))
    .orderBy(asc(cases.id));

  if (caseRows.length === 0) {
    return { summary, scorers: [], rows: [] };
  }

  const caseRowIds = caseRows.map((c) => c.caseRowId);
  const resultRows = await db
    .select({
      caseRowId: caseResults.caseRowId,
      scorerName: caseResults.scorerName,
      pass: caseResults.pass,
      score: caseResults.score,
      detail: caseResults.detail,
      errors: caseResults.errors,
      flippedFrom: caseResults.flippedFrom,
    })
    .from(caseResults)
    .where(inArray(caseResults.caseRowId, caseRowIds));

  // Stable column order: scorer names sorted ascending.
  const scorerNames = [...new Set(resultRows.map((r) => r.scorerName))].sort();

  // Index results by (caseRowId, scorerName) for O(1) cell lookup.
  const cellByKey = new Map<string, MatrixCell>();
  const passByScorer = new Map<string, { pass: number; total: number }>();
  for (const r of resultRows) {
    cellByKey.set(`${r.caseRowId}:${r.scorerName}`, {
      pass: r.pass,
      score: r.score,
      detail: r.detail,
      errors: r.errors,
      flippedFrom: r.flippedFrom,
    });
    const acc = passByScorer.get(r.scorerName) ?? { pass: 0, total: 0 };
    acc.total += 1;
    if (r.pass) acc.pass += 1;
    passByScorer.set(r.scorerName, acc);
  }

  const rows: MatrixRow[] = caseRows.map((c) => {
    const cells: (MatrixCell | null)[] = scorerNames.map(
      (name) => cellByKey.get(`${c.caseRowId}:${name}`) ?? null,
    );
    return {
      caseRowId: c.caseRowId,
      caseId: c.caseId,
      label: c.label,
      verdict: c.verdict,
      score: c.score,
      cells,
    };
  });

  const scorers: ScorerColumn[] = scorerNames.map((name) => {
    const acc = passByScorer.get(name) ?? { pass: 0, total: 0 };
    return {
      name,
      passRate: acc.total > 0 ? acc.pass / acc.total : 0,
      passCount: acc.pass,
      total: acc.total,
    };
  });

  return { summary, scorers, rows };
}

export interface RunListItem {
  id: number;
  suiteSlug: string;
  suiteTitle: string;
  promptLabel: string;
  sha: string;
  branch: string;
  trigger: RunTrigger;
  status: RunStatus;
  total: number;
  passRate: number;
  costUsd: number;
  startedAt: Date;
  finishedAt: Date | null;
}

/**
 * Runs newest-first, optionally scoped to a suite slug. Drives the runs index
 * and the suite-scoped run history. Unknown slug yields an empty list.
 */
export async function listRuns(suiteSlug?: string): Promise<RunListItem[]> {
  const base = db
    .select({
      id: runs.id,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
      promptLabel: promptVersions.label,
      sha: runs.sha,
      branch: runs.branch,
      trigger: runs.trigger,
      status: runs.status,
      total: runs.total,
      passRate: runs.passRate,
      costUsd: runs.costUsd,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
    })
    .from(runs)
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId));

  if (suiteSlug === undefined) {
    return base.orderBy(desc(runs.startedAt));
  }
  return base.where(eq(suites.slug, suiteSlug)).orderBy(desc(runs.startedAt));
}
