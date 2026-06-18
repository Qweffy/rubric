import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  caseResults,
  cases,
  promptVersions,
  runs,
  suites,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Gate status — the regression-gate board (PR-review screen).          */
/* For each suite's candidate run, every tracked scorer's pass-rate is  */
/* compared against its gate threshold; a metric below threshold blocks */
/* the merge. Mirrors the spec-default thresholds (field-accuracy 0.95, */
/* json-schema 0.90) unless a suite overrides them.                     */
/* ------------------------------------------------------------------ */

export type GateMetricStatus = "pass" | "fail";

/**
 * Default gate thresholds per scorer name. These mirror the golden-set spec
 * defaults (fieldAccuracyScorerSchema.threshold = 0.95). Scorers absent here
 * default to GENERIC_THRESHOLD.
 */
export const GATE_THRESHOLDS: Record<string, number> = {
  "field-accuracy": 0.95,
  "json-schema": 0.9,
  schema: 0.9,
};

/** Fallback gate threshold for scorers without an explicit entry. */
export const GENERIC_THRESHOLD = 0.9;

export interface GateMetric {
  /** Scorer name the metric tracks ("field-accuracy", "schema"). */
  metric: string;
  /** Observed pass-rate on the candidate run (0-1). */
  value: number;
  /** Gate threshold the value must meet or exceed (0-1). */
  threshold: number;
  /** value − threshold; negative means the gate is tripped. */
  margin: number;
  status: GateMetricStatus;
}

export interface SuiteGate {
  suiteId: number;
  suiteSlug: string;
  suiteTitle: string;
  /** Candidate run under review. */
  runId: number;
  promptLabel: string;
  sha: string;
  branch: string;
  /** Overall run pass-rate (0-1). */
  passRate: number;
  /** Per-scorer gate metrics, failing ones first. */
  metrics: GateMetric[];
  /** True when every tracked metric meets its threshold. */
  passing: boolean;
}

export interface GateStatus {
  /** True when every suite gate passes — the merge is green. */
  allPassing: boolean;
  blockingCount: number;
  suiteCount: number;
  gates: SuiteGate[];
}

function thresholdFor(scorerName: string): number {
  return GATE_THRESHOLDS[scorerName] ?? GENERIC_THRESHOLD;
}

/** Per-scorer pass-rate over a run's cases, keyed by scorer name. */
async function scorerPassRates(runId: number): Promise<Map<string, number>> {
  const byScorer = new Map<string, number>();
  const caseRows = await db
    .select({ id: cases.id })
    .from(cases)
    .where(eq(cases.runId, runId));
  const caseRowIds = caseRows.map((c) => c.id);
  if (caseRowIds.length === 0) return byScorer;

  const rows = await db
    .select({ scorerName: caseResults.scorerName, pass: caseResults.pass })
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

/** Newest completed run per suite — the candidate the gate evaluates. */
async function latestCompletedRunBySuite(): Promise<
  Map<
    number,
    {
      runId: number;
      promptLabel: string;
      sha: string;
      branch: string;
      passRate: number;
    }
  >
> {
  const rows = await db
    .select({
      suiteId: runs.suiteId,
      runId: runs.id,
      promptLabel: promptVersions.label,
      sha: runs.sha,
      branch: runs.branch,
      passRate: runs.passRate,
      startedAt: runs.startedAt,
    })
    .from(runs)
    .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
    .where(eq(runs.status, "completed"))
    .orderBy(desc(runs.startedAt));

  const bySuite = new Map<
    number,
    {
      runId: number;
      promptLabel: string;
      sha: string;
      branch: string;
      passRate: number;
    }
  >();
  for (const r of rows) {
    if (bySuite.has(r.suiteId)) continue;
    bySuite.set(r.suiteId, {
      runId: r.runId,
      promptLabel: r.promptLabel,
      sha: r.sha,
      branch: r.branch,
      passRate: r.passRate,
    });
  }
  return bySuite;
}

/**
 * The regression-gate board: each suite's latest completed run with its scorer
 * pass-rates checked against gate thresholds. A metric below threshold blocks
 * the suite; any blocked suite turns the board red. Suites with no completed run
 * are omitted (nothing to gate).
 */
export async function getGateStatus(): Promise<GateStatus> {
  const suiteRows = await db
    .select({
      id: suites.id,
      slug: suites.slug,
      title: suites.title,
    })
    .from(suites)
    .orderBy(desc(suites.updatedAt));

  const candidates = await latestCompletedRunBySuite();

  const gates: SuiteGate[] = [];
  for (const s of suiteRows) {
    const candidate = candidates.get(s.id);
    if (candidate === undefined) continue;

    const rates = await scorerPassRates(candidate.runId);
    const metrics: GateMetric[] = [...rates.entries()]
      .map(([metric, value]) => {
        const threshold = thresholdFor(metric);
        const margin = value - threshold;
        return {
          metric,
          value,
          threshold,
          margin,
          status: margin >= 0 ? ("pass" as const) : ("fail" as const),
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "fail" ? -1 : 1;
        return a.margin - b.margin;
      });

    gates.push({
      suiteId: s.id,
      suiteSlug: s.slug,
      suiteTitle: s.title,
      runId: candidate.runId,
      promptLabel: candidate.promptLabel,
      sha: candidate.sha,
      branch: candidate.branch,
      passRate: candidate.passRate,
      metrics,
      passing: metrics.every((m) => m.status === "pass"),
    });
  }

  // Blocked suites bubble to the top of the board.
  gates.sort((a, b) => {
    if (a.passing !== b.passing) return a.passing ? 1 : -1;
    return a.suiteTitle.localeCompare(b.suiteTitle);
  });

  const blockingCount = gates.filter((g) => !g.passing).length;

  return {
    allPassing: blockingCount === 0,
    blockingCount,
    suiteCount: gates.length,
    gates,
  };
}
