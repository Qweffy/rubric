import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  errorClusters,
  judges,
  runs,
  suites,
  type RunStatus,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Shell — cross-cutting reads for the app chrome.                      */
/* Sync status (is a run in flight? when did the store last change?)    */
/* and the nav badge counts that decorate the sidebar.                  */
/* ------------------------------------------------------------------ */

export type SyncState = "idle" | "running" | "stale";

export interface SyncStatus {
  /** "running" when any run is in flight; "stale" if the last run is old. */
  state: SyncState;
  /** Runs currently executing. */
  runningCount: number;
  /** Start time of the most recent run, null when the store is empty. */
  lastRunAt: Date | null;
  /** Finish time of the most recent completed run, null when none. */
  lastCompletedAt: Date | null;
  /** Status of the most recent run, null when the store is empty. */
  lastRunStatus: RunStatus | null;
}

/** A run older than this (and none running) marks the store "stale". */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Store sync status for the shell header: whether a run is in flight, and how
 * fresh the latest run is. Pure read — the freshness boundary is computed
 * against `now` (injectable for tests; defaults to Date.now()).
 */
export async function getSyncStatus(now: number = Date.now()): Promise<SyncStatus> {
  const [runningRows, latestRows, lastCompletedRows] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(runs)
      .where(eq(runs.status, "running")),
    db
      .select({ startedAt: runs.startedAt, status: runs.status })
      .from(runs)
      .orderBy(desc(runs.startedAt))
      .limit(1),
    db
      .select({ finishedAt: runs.finishedAt })
      .from(runs)
      .where(eq(runs.status, "completed"))
      .orderBy(desc(runs.finishedAt))
      .limit(1),
  ]);

  const runningCount = runningRows[0]?.n ?? 0;
  const latest = latestRows[0] ?? null;
  const lastRunAt = latest?.startedAt ?? null;
  const lastRunStatus = latest?.status ?? null;
  const lastCompletedAt = lastCompletedRows[0]?.finishedAt ?? null;

  let state: SyncState = "idle";
  if (runningCount > 0) {
    state = "running";
  } else if (
    lastRunAt !== null &&
    now - lastRunAt.getTime() > STALE_AFTER_MS
  ) {
    state = "stale";
  }

  return { state, runningCount, lastRunAt, lastCompletedAt, lastRunStatus };
}

export interface NavBadges {
  /** Suites flagged "regressed" — the headline alert count. */
  regressedSuites: number;
  /** Suites flagged "flaky". */
  flakySuites: number;
  /** Runs currently executing. */
  runningRuns: number;
  /** Judges not in an "aligned" state (need recalibration attention). */
  uncalibratedJudges: number;
  /** Error clusters not yet promoted into the golden set. */
  openErrorClusters: number;
}

/**
 * Sidebar badge counts. One fanned-out read of cheap aggregate COUNTs — these
 * decorate the nav and must stay light enough to run on every shell render.
 */
export async function getNavBadges(): Promise<NavBadges> {
  const [regressed, flaky, running, uncalibrated, openClusters] =
    await Promise.all([
      db
        .select({ n: sql<number>`count(*)` })
        .from(suites)
        .where(eq(suites.status, "regressed")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(suites)
        .where(eq(suites.status, "flaky")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(runs)
        .where(eq(runs.status, "running")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(judges)
        .where(sql`${judges.status} <> 'aligned'`),
      db
        .select({ n: sql<number>`count(*)` })
        .from(errorClusters)
        .where(sql`${errorClusters.inGoldenSet} = 0`),
    ]);

  return {
    regressedSuites: regressed[0]?.n ?? 0,
    flakySuites: flaky[0]?.n ?? 0,
    runningRuns: running[0]?.n ?? 0,
    uncalibratedJudges: uncalibrated[0]?.n ?? 0,
    openErrorClusters: openClusters[0]?.n ?? 0,
  };
}
