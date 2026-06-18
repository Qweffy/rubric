import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  promptVersions,
  runs,
  suites,
  type RunStatus,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Prompt timeline — a suite's prompt versions over time.               */
/* Each version with its body, ref, and the runs executed against it,   */
/* so the screen can chart pass-rate movement across prompt edits.      */
/* ------------------------------------------------------------------ */

export interface PromptRunPoint {
  runId: number;
  sha: string;
  status: RunStatus;
  passRate: number;
  total: number;
  costUsd: number;
  startedAt: Date;
}

export interface PromptVersionTimeline {
  id: number;
  label: string;
  ref: string | null;
  body: string;
  createdAt: Date;
  /** Runs executed against this version, newest-first. */
  runs: PromptRunPoint[];
  /** Latest completed-run pass-rate for this version (0-1), null if none. */
  latestPassRate: number | null;
  /** Mean completed-run pass-rate for this version (0-1), null if none. */
  meanPassRate: number | null;
  runCount: number;
}

export interface PromptTimeline {
  suiteId: number;
  suiteSlug: string;
  suiteTitle: string;
  /** Versions newest-first; each carries its own run history. */
  versions: PromptVersionTimeline[];
}

/**
 * The prompt-version timeline for a suite: every version and the runs executed
 * against it, so the UI can show how a prompt edit moved the pass-rate. Returns
 * null when the slug is unknown.
 */
export async function getPromptTimeline(
  suiteSlug: string,
): Promise<PromptTimeline | null> {
  const found = await db
    .select({
      id: suites.id,
      slug: suites.slug,
      title: suites.title,
    })
    .from(suites)
    .where(eq(suites.slug, suiteSlug))
    .limit(1);

  const suite = found[0];
  if (!suite) return null;

  const [versionRows, runRows] = await Promise.all([
    db
      .select({
        id: promptVersions.id,
        label: promptVersions.label,
        ref: promptVersions.ref,
        body: promptVersions.body,
        createdAt: promptVersions.createdAt,
      })
      .from(promptVersions)
      .where(eq(promptVersions.suiteId, suite.id))
      .orderBy(desc(promptVersions.createdAt)),
    db
      .select({
        promptVersionId: runs.promptVersionId,
        runId: runs.id,
        sha: runs.sha,
        status: runs.status,
        passRate: runs.passRate,
        total: runs.total,
        costUsd: runs.costUsd,
        startedAt: runs.startedAt,
      })
      .from(runs)
      .where(eq(runs.suiteId, suite.id))
      .orderBy(desc(runs.startedAt)),
  ]);

  const runsByVersion = new Map<number, PromptRunPoint[]>();
  for (const r of runRows) {
    const acc = runsByVersion.get(r.promptVersionId) ?? [];
    acc.push({
      runId: r.runId,
      sha: r.sha,
      status: r.status,
      passRate: r.passRate,
      total: r.total,
      costUsd: r.costUsd,
      startedAt: r.startedAt,
    });
    runsByVersion.set(r.promptVersionId, acc);
  }

  const versions: PromptVersionTimeline[] = versionRows.map((v) => {
    const vRuns = runsByVersion.get(v.id) ?? [];
    const completed = vRuns.filter((r) => r.status === "completed");
    const latestPassRate = completed[0]?.passRate ?? null;
    const meanPassRate =
      completed.length > 0
        ? completed.reduce((a, r) => a + r.passRate, 0) / completed.length
        : null;
    return {
      id: v.id,
      label: v.label,
      ref: v.ref,
      body: v.body,
      createdAt: v.createdAt,
      runs: vRuns,
      latestPassRate,
      meanPassRate,
      runCount: vRuns.length,
    };
  });

  return {
    suiteId: suite.id,
    suiteSlug: suite.slug,
    suiteTitle: suite.title,
    versions,
  };
}
