import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  caseResults,
  cases,
  promptVersions,
  runs,
  suites,
  type RunStatus,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Regression diff — run A (baseline) vs run B (candidate).             */
/* Surfaces cases whose verdict flipped, and per-scorer pass-rate       */
/* deltas, for the regression-gate review screen.                       */
/* ------------------------------------------------------------------ */

export type FlipDirection = "fixed" | "regressed";

export interface FlippedCase {
  caseId: string;
  label: string | null;
  /** "regressed" = pass→fail (the gate-tripping kind); "fixed" = fail→pass. */
  direction: FlipDirection;
  /** Case row id in run A, null when the case is new in run B. */
  caseRowIdA: number | null;
  /** Case row id in run B, null when the case was dropped in B. */
  caseRowIdB: number | null;
}

export interface ScorerDelta {
  scorerName: string;
  passRateA: number;
  passRateB: number;
  /** passRateB − passRateA. Negative = regression on that scorer. */
  delta: number;
}

export interface DiffRunRef {
  id: number;
  promptLabel: string;
  sha: string;
  branch: string;
  status: RunStatus;
  passRate: number;
  total: number;
  startedAt: Date;
}

export interface RegressionDiff {
  suiteSlug: string;
  suiteTitle: string;
  runA: DiffRunRef;
  runB: DiffRunRef;
  /** Net pass-rate change, runB − runA. */
  passRateDelta: number;
  regressedCount: number;
  fixedCount: number;
  /** Cases new in B (present in B, absent in A). */
  addedCaseIds: string[];
  /** Cases dropped in B (present in A, absent in B). */
  removedCaseIds: string[];
  flippedCases: FlippedCase[];
  scorerDeltas: ScorerDelta[];
}

interface RunHead {
  id: number;
  suiteId: number;
  suiteSlug: string;
  suiteTitle: string;
  promptLabel: string;
  sha: string;
  branch: string;
  status: RunStatus;
  passRate: number;
  total: number;
  startedAt: Date;
}

async function getRunHead(runId: number): Promise<RunHead | null> {
  const rows = await db
    .select({
      id: runs.id,
      suiteId: runs.suiteId,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
      promptLabel: promptVersions.label,
      sha: runs.sha,
      branch: runs.branch,
      status: runs.status,
      passRate: runs.passRate,
      total: runs.total,
      startedAt: runs.startedAt,
    })
    .from(runs)
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
    .where(eq(runs.id, runId))
    .limit(1);
  return rows[0] ?? null;
}

interface CaseVerdictRow {
  caseRowId: number;
  caseId: string;
  label: string | null;
  pass: boolean;
}

/** Per-case pass/fail for a run — a case "passes" when its verdict is "pass". */
async function getCasePasses(runId: number): Promise<CaseVerdictRow[]> {
  const rows = await db
    .select({
      caseRowId: cases.id,
      caseId: cases.caseId,
      label: cases.label,
      verdict: cases.verdict,
    })
    .from(cases)
    .where(eq(cases.runId, runId))
    .orderBy(asc(cases.id));
  return rows.map((r) => ({
    caseRowId: r.caseRowId,
    caseId: r.caseId,
    label: r.label,
    pass: r.verdict === "pass",
  }));
}

/** Per-scorer pass counts across a run's cases, for the pass-rate delta. */
async function getScorerPassRates(
  caseRowIds: number[],
): Promise<Map<string, number>> {
  const byScorer = new Map<string, number>();
  if (caseRowIds.length === 0) return byScorer;

  const rows = await db
    .select({
      scorerName: caseResults.scorerName,
      pass: caseResults.pass,
    })
    .from(caseResults)
    .where(inArray(caseResults.caseRowId, caseRowIds));

  const counts = new Map<string, { pass: number; total: number }>();
  for (const r of rows) {
    const acc = counts.get(r.scorerName) ?? { pass: 0, total: 0 };
    acc.total += 1;
    if (r.pass) acc.pass += 1;
    counts.set(r.scorerName, acc);
  }
  for (const [name, acc] of counts) {
    byScorer.set(name, acc.total > 0 ? acc.pass / acc.total : 0);
  }
  return byScorer;
}

/**
 * Diff two runs by logical caseId. runA is the baseline, runB the candidate.
 * Flips, per-scorer pass-rate deltas, and added/removed cases. Returns null when
 * either run is unknown. Diffing runs from different suites still works but the
 * suite header reflects run A.
 */
export async function getRegressionDiff(
  runAId: number,
  runBId: number,
): Promise<RegressionDiff | null> {
  const [headA, headB] = await Promise.all([
    getRunHead(runAId),
    getRunHead(runBId),
  ]);
  if (!headA || !headB) return null;

  const [casesA, casesB] = await Promise.all([
    getCasePasses(runAId),
    getCasePasses(runBId),
  ]);

  const byIdA = new Map(casesA.map((c) => [c.caseId, c]));
  const byIdB = new Map(casesB.map((c) => [c.caseId, c]));

  const flippedCases: FlippedCase[] = [];
  for (const [caseId, b] of byIdB) {
    const a = byIdA.get(caseId);
    if (a === undefined) continue;
    if (a.pass === b.pass) continue;
    flippedCases.push({
      caseId,
      label: b.label ?? a.label,
      direction: a.pass && !b.pass ? "regressed" : "fixed",
      caseRowIdA: a.caseRowId,
      caseRowIdB: b.caseRowId,
    });
  }
  // Stable: regressions first, then fixes, each alpha by caseId.
  flippedCases.sort((x, y) =>
    x.direction === y.direction
      ? x.caseId.localeCompare(y.caseId)
      : x.direction === "regressed"
        ? -1
        : 1,
  );

  const addedCaseIds = [...byIdB.keys()]
    .filter((id) => !byIdA.has(id))
    .sort((a, b) => a.localeCompare(b));
  const removedCaseIds = [...byIdA.keys()]
    .filter((id) => !byIdB.has(id))
    .sort((a, b) => a.localeCompare(b));

  const [ratesA, ratesB] = await Promise.all([
    getScorerPassRates(casesA.map((c) => c.caseRowId)),
    getScorerPassRates(casesB.map((c) => c.caseRowId)),
  ]);

  const scorerNames = [
    ...new Set([...ratesA.keys(), ...ratesB.keys()]),
  ].sort((a, b) => a.localeCompare(b));
  const scorerDeltas: ScorerDelta[] = scorerNames.map((name) => {
    const passRateA = ratesA.get(name) ?? 0;
    const passRateB = ratesB.get(name) ?? 0;
    return { scorerName: name, passRateA, passRateB, delta: passRateB - passRateA };
  });

  return {
    suiteSlug: headA.suiteSlug,
    suiteTitle: headA.suiteTitle,
    runA: {
      id: headA.id,
      promptLabel: headA.promptLabel,
      sha: headA.sha,
      branch: headA.branch,
      status: headA.status,
      passRate: headA.passRate,
      total: headA.total,
      startedAt: headA.startedAt,
    },
    runB: {
      id: headB.id,
      promptLabel: headB.promptLabel,
      sha: headB.sha,
      branch: headB.branch,
      status: headB.status,
      passRate: headB.passRate,
      total: headB.total,
      startedAt: headB.startedAt,
    },
    passRateDelta: headB.passRate - headA.passRate,
    regressedCount: flippedCases.filter((f) => f.direction === "regressed")
      .length,
    fixedCount: flippedCases.filter((f) => f.direction === "fixed").length,
    addedCaseIds,
    removedCaseIds,
    flippedCases,
    scorerDeltas,
  };
}
