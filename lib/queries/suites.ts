import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  promptVersions,
  runs,
  suites,
  type RunStatus,
  type SuiteStatus,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Suites overview — the dashboard landing screen.                      */
/* KPI strip over every suite + one row per suite with its latest-run   */
/* pass-rate, delta vs the prior run, status, and a sparkline of recent */
/* pass-rates. No "server-only" so the CLI (tsx) can read it too.       */
/* ------------------------------------------------------------------ */

/** How many recent runs feed each suite-row sparkline. */
export const SPARKLINE_POINTS = 12;

export interface SuiteKpis {
  /** Total suites tracked. */
  suiteCount: number;
  /** Suites whose latest run is green (status "passing"). */
  passingCount: number;
  /** Suites in a "regressed" state — the headline failure count. */
  regressedCount: number;
  /** Suites flagged "flaky". */
  flakyCount: number;
  /** Suites with no run in a while ("stale"). */
  staleCount: number;
  /** Mean latest-run pass-rate across suites with a run (0-1), null if none. */
  meanPassRate: number | null;
  /** Sum of latest-run costUsd across suites with a run. */
  totalCostUsd: number;
  /** Count of suites that have at least one completed run. */
  ranSuiteCount: number;
}

export interface SuiteRow {
  id: number;
  slug: string;
  title: string;
  repo: string;
  status: SuiteStatus;
  /** Latest run's pass-rate (0-1), null until the suite has a completed run. */
  passRate: number | null;
  /** passRate(latest) − passRate(prior), null when fewer than two runs. */
  delta: number | null;
  /** Latest run's total case count, null until a run lands. */
  total: number | null;
  /** Latest run's cost in USD, null until a run lands. */
  costUsd: number | null;
  /** Prompt-version label of the latest run ("v3"), null until a run lands. */
  promptLabel: string | null;
  /** Short sha of the latest run, null until a run lands. */
  sha: string | null;
  /** Latest run's start time, null until a run lands. */
  lastRunAt: Date | null;
  /** Status of the latest run, null until a run lands. */
  lastRunStatus: RunStatus | null;
  /** Oldest-to-newest pass-rates of recent completed runs, for the sparkline. */
  sparkline: number[];
}

export interface SuitesOverview {
  kpis: SuiteKpis;
  suites: SuiteRow[];
}

interface LatestRunShape {
  suiteId: number;
  runId: number;
  passRate: number;
  total: number;
  costUsd: number;
  sha: string;
  promptLabel: string;
  startedAt: Date;
  status: RunStatus;
}

/**
 * The most-recent run per suite, joined to its prompt-version label. Drizzle on
 * better-sqlite3 has no window functions in the query builder, so we resolve
 * "latest" by suites.latestRunId (kept current by the CLI writer) and fall back
 * to a per-suite max(startedAt) for suites whose pointer is null.
 */
async function getLatestRunsBySuite(
  suiteIds: number[],
  pointerRunIds: number[],
): Promise<Map<number, LatestRunShape>> {
  const bySuite = new Map<number, LatestRunShape>();
  if (suiteIds.length === 0) return bySuite;

  // Primary source: rows the suite pointer references directly.
  if (pointerRunIds.length > 0) {
    const pointed = await db
      .select({
        suiteId: runs.suiteId,
        runId: runs.id,
        passRate: runs.passRate,
        total: runs.total,
        costUsd: runs.costUsd,
        sha: runs.sha,
        promptLabel: promptVersions.label,
        startedAt: runs.startedAt,
        status: runs.status,
      })
      .from(runs)
      .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
      .where(inArray(runs.id, pointerRunIds));
    for (const r of pointed) bySuite.set(r.suiteId, r);
  }

  // Fallback: suites without a usable pointer — pick their newest run.
  const missing = suiteIds.filter((id) => !bySuite.has(id));
  if (missing.length > 0) {
    const candidates = await db
      .select({
        suiteId: runs.suiteId,
        runId: runs.id,
        passRate: runs.passRate,
        total: runs.total,
        costUsd: runs.costUsd,
        sha: runs.sha,
        promptLabel: promptVersions.label,
        startedAt: runs.startedAt,
        status: runs.status,
      })
      .from(runs)
      .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
      .where(inArray(runs.suiteId, missing))
      .orderBy(desc(runs.startedAt));
    // Rows are newest-first; first seen per suite wins.
    for (const r of candidates) {
      if (!bySuite.has(r.suiteId)) bySuite.set(r.suiteId, r);
    }
  }

  return bySuite;
}

/** Recent completed-run pass-rates per suite, oldest-first, for sparklines. */
async function getSparklinesBySuite(
  suiteIds: number[],
): Promise<Map<number, number[]>> {
  const bySuite = new Map<number, number[]>();
  if (suiteIds.length === 0) return bySuite;

  const rows = await db
    .select({
      suiteId: runs.suiteId,
      passRate: runs.passRate,
      startedAt: runs.startedAt,
    })
    .from(runs)
    .where(
      and(inArray(runs.suiteId, suiteIds), eq(runs.status, "completed")),
    )
    .orderBy(asc(runs.suiteId), desc(runs.startedAt));

  // Per suite: take the newest SPARKLINE_POINTS, then reverse to oldest-first.
  for (const r of rows) {
    const acc = bySuite.get(r.suiteId) ?? [];
    if (acc.length < SPARKLINE_POINTS) acc.push(r.passRate);
    bySuite.set(r.suiteId, acc);
  }
  for (const [k, v] of bySuite) bySuite.set(k, v.reverse());

  return bySuite;
}

/**
 * KPI strip + one row per suite for the overview grid. A single read fanned out
 * with Promise.all: suites, their latest runs, and recent-run sparklines.
 */
export async function getSuitesOverview(): Promise<SuitesOverview> {
  const suiteRows = await db
    .select({
      id: suites.id,
      slug: suites.slug,
      title: suites.title,
      repo: suites.repo,
      status: suites.status,
      latestRunId: suites.latestRunId,
    })
    .from(suites)
    .orderBy(asc(suites.title));

  if (suiteRows.length === 0) {
    return {
      kpis: {
        suiteCount: 0,
        passingCount: 0,
        regressedCount: 0,
        flakyCount: 0,
        staleCount: 0,
        meanPassRate: null,
        totalCostUsd: 0,
        ranSuiteCount: 0,
      },
      suites: [],
    };
  }

  const suiteIds = suiteRows.map((s) => s.id);
  const pointerRunIds = suiteRows
    .map((s) => s.latestRunId)
    .filter((id): id is number => id !== null);

  const [latestBySuite, sparklines] = await Promise.all([
    getLatestRunsBySuite(suiteIds, pointerRunIds),
    getSparklinesBySuite(suiteIds),
  ]);

  // Prior-run pass-rates, to compute each suite's delta vs. the run before its
  // latest. Newest-first per suite; index 1 is the prior completed run.
  const priorBySuite = new Map<number, number>();
  const completedRuns = await db
    .select({
      suiteId: runs.suiteId,
      passRate: runs.passRate,
      startedAt: runs.startedAt,
    })
    .from(runs)
    .where(and(inArray(runs.suiteId, suiteIds), eq(runs.status, "completed")))
    .orderBy(asc(runs.suiteId), desc(runs.startedAt));
  const seenPerSuite = new Map<number, number>();
  for (const r of completedRuns) {
    const seen = seenPerSuite.get(r.suiteId) ?? 0;
    if (seen === 1) priorBySuite.set(r.suiteId, r.passRate);
    seenPerSuite.set(r.suiteId, seen + 1);
  }

  const rows: SuiteRow[] = suiteRows.map((s) => {
    const latest = latestBySuite.get(s.id) ?? null;
    const prior = priorBySuite.get(s.id);
    const passRate = latest?.passRate ?? null;
    const delta =
      passRate !== null && prior !== undefined ? passRate - prior : null;
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      repo: s.repo,
      status: s.status,
      passRate,
      delta,
      total: latest?.total ?? null,
      costUsd: latest?.costUsd ?? null,
      promptLabel: latest?.promptLabel ?? null,
      sha: latest?.sha ?? null,
      lastRunAt: latest?.startedAt ?? null,
      lastRunStatus: latest?.status ?? null,
      sparkline: sparklines.get(s.id) ?? [],
    };
  });

  const ratesPresent = rows
    .map((r) => r.passRate)
    .filter((p): p is number => p !== null);
  const meanPassRate =
    ratesPresent.length > 0
      ? ratesPresent.reduce((a, b) => a + b, 0) / ratesPresent.length
      : null;

  const kpis: SuiteKpis = {
    suiteCount: rows.length,
    passingCount: rows.filter((r) => r.status === "passing").length,
    regressedCount: rows.filter((r) => r.status === "regressed").length,
    flakyCount: rows.filter((r) => r.status === "flaky").length,
    staleCount: rows.filter((r) => r.status === "stale").length,
    meanPassRate,
    totalCostUsd: rows.reduce((a, r) => a + (r.costUsd ?? 0), 0),
    ranSuiteCount: ratesPresent.length,
  };

  return { kpis, suites: rows };
}

export interface SuitePromptVersion {
  id: number;
  label: string;
  ref: string | null;
  createdAt: Date;
}

export interface SuiteRunSummary {
  id: number;
  sha: string;
  branch: string;
  triggeredBy: string | null;
  promptLabel: string;
  status: RunStatus;
  passRate: number;
  total: number;
  passCount: number;
  failCount: number;
  costUsd: number;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface SuiteDetail {
  id: number;
  slug: string;
  title: string;
  repo: string;
  status: SuiteStatus;
  /** All prompt versions under the suite, newest-first. */
  promptVersions: SuitePromptVersion[];
  /** Recent runs, newest-first, with their prompt label. */
  runs: SuiteRunSummary[];
  /** Latest-run pass-rate (0-1), null until a run lands. */
  latestPassRate: number | null;
  /** Pass-rate sparkline over recent completed runs, oldest-first. */
  sparkline: number[];
}

/**
 * A single suite's detail page: its prompt versions, its recent runs, and a
 * pass-rate sparkline. Returns null when the slug is unknown.
 */
export async function getSuiteDetail(slug: string): Promise<SuiteDetail | null> {
  const found = await db
    .select({
      id: suites.id,
      slug: suites.slug,
      title: suites.title,
      repo: suites.repo,
      status: suites.status,
    })
    .from(suites)
    .where(eq(suites.slug, slug))
    .limit(1);

  const suite = found[0];
  if (!suite) return null;

  const [versions, runRows] = await Promise.all([
    db
      .select({
        id: promptVersions.id,
        label: promptVersions.label,
        ref: promptVersions.ref,
        createdAt: promptVersions.createdAt,
      })
      .from(promptVersions)
      .where(eq(promptVersions.suiteId, suite.id))
      .orderBy(desc(promptVersions.createdAt)),
    db
      .select({
        id: runs.id,
        sha: runs.sha,
        branch: runs.branch,
        triggeredBy: runs.triggeredBy,
        promptLabel: promptVersions.label,
        status: runs.status,
        passRate: runs.passRate,
        total: runs.total,
        passCount: runs.passCount,
        failCount: runs.failCount,
        costUsd: runs.costUsd,
        startedAt: runs.startedAt,
        finishedAt: runs.finishedAt,
      })
      .from(runs)
      .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
      .where(eq(runs.suiteId, suite.id))
      .orderBy(desc(runs.startedAt)),
  ]);

  const completed = runRows.filter((r) => r.status === "completed");
  const latestPassRate = completed[0]?.passRate ?? null;
  const sparkline = completed
    .slice(0, SPARKLINE_POINTS)
    .map((r) => r.passRate)
    .reverse();

  return {
    id: suite.id,
    slug: suite.slug,
    title: suite.title,
    repo: suite.repo,
    status: suite.status,
    promptVersions: versions,
    runs: runRows,
    latestPassRate,
    sparkline,
  };
}
