import { notFound } from "next/navigation";

import {
  SuiteDetailView,
  type RunRow,
  type ScorerRow,
  type SuiteHeaderData,
} from "@/components/suite-detail/suite-detail-view";
import { getRunDetail, type ScorerColumn } from "@/lib/queries/runs";
import {
  getSuiteDetail,
  type SuiteDetail,
  type SuiteRunSummary,
} from "@/lib/queries/suites";

// The suite detail reflects live run history (CI/nightly runs land out of band);
// never statically cache it — read uncached on every request.
export const dynamic = "force-dynamic";

/** Display order for scorers — schema (the regression culprit) leads. */
const SCORER_ORDER = ["schema", "exact-match", "field-accuracy", "judge"];

/** Stable display ordering for the per-scorer breakdown panel. */
function orderScorers(scorers: ScorerColumn[]): ScorerColumn[] {
  return [...scorers].sort((a, b) => {
    const ia = SCORER_ORDER.indexOf(a.name);
    const ib = SCORER_ORDER.indexOf(b.name);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Map a query run-summary to the row the client view renders. */
function toRunRow(run: SuiteRunSummary): RunRow {
  return {
    id: run.id,
    sha: run.sha,
    branch: run.branch,
    promptLabel: run.promptLabel,
    status: run.status,
    passRate: run.passRate,
    total: run.total,
    passCount: run.passCount,
    failCount: run.failCount,
    costUsd: run.costUsd,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  };
}

export default async function SuiteDetailPage({
  params,
}: {
  params: Promise<{ suiteId: string }>;
}) {
  const { suiteId } = await params;
  const detail: SuiteDetail | null = await getSuiteDetail(suiteId);
  if (detail === null) notFound();

  // Newest-first runs from the query. The head (latest) drives the summary +
  // per-scorer panel; the prior completed run is the baseline we diff against.
  const runs = detail.runs;
  const headRun = runs[0] ?? null;
  const baselineRun =
    runs.find(
      (r, i) => i > 0 && r.status === "completed" && r.id !== headRun?.id,
    ) ?? null;

  // Per-scorer pass-rates for the head + baseline come from each run's full
  // case × scorer matrix. We diff them to surface each scorer's regression.
  const [headDetail, baselineDetail] = await Promise.all([
    headRun ? getRunDetail(headRun.id) : Promise.resolve(null),
    baselineRun ? getRunDetail(baselineRun.id) : Promise.resolve(null),
  ]);

  const baselineByScorer = new Map<string, number>(
    (baselineDetail?.scorers ?? []).map((s) => [s.name, s.passRate]),
  );

  const scorers: ScorerRow[] = headDetail
    ? orderScorers(headDetail.scorers).map((s) => {
        const prior = baselineByScorer.get(s.name);
        return {
          name: s.name,
          passRate: s.passRate,
          passCount: s.passCount,
          total: s.total,
          delta: prior === undefined ? null : s.passRate - prior,
        };
      })
    : [];

  // Regression framing derives entirely from the two runs: head vs baseline
  // pass-rate, net delta, and the count of cases that flipped pass→fail.
  const headPassRate = headRun?.passRate ?? null;
  const baselinePassRate = baselineRun?.passRate ?? null;
  const netDelta =
    headPassRate !== null && baselinePassRate !== null
      ? headPassRate - baselinePassRate
      : null;

  // Cases that flipped pass→fail vs the baseline: present in the head's matrix
  // as a fail whose scorer carries a `flippedFrom: "pass"` flag.
  const flippedCases = (headDetail?.rows ?? [])
    .filter(
      (row) =>
        row.verdict === "fail" &&
        row.cells.some((c) => c?.flippedFrom === "pass"),
    )
    .map((row) => ({
      caseId: row.caseId,
      label: row.label,
    }));

  // Scored-case count = the per-scorer matrix total (excludes skipped cases),
  // which is the canonical "N CASES" figure the scorer panel and design use.
  // Fall back to the run's total when no scorer matrix is available.
  const scoredCaseCount =
    headDetail?.scorers[0]?.total ?? headRun?.total ?? null;

  const header: SuiteHeaderData = {
    slug: detail.slug,
    title: detail.title,
    repo: detail.repo,
    status: detail.status,
    caseCount: scoredCaseCount,
    scorerCount: headDetail?.scorers.length ?? scorers.length,
    promptLabel: headRun?.promptLabel ?? null,
    headBranch: headRun?.branch ?? "main",
    headSha: headRun?.sha ?? null,
    headStartedAt: headRun?.startedAt.toISOString() ?? null,
  };

  return (
    <SuiteDetailView
      header={header}
      runs={runs.map(toRunRow)}
      scorers={scorers}
      sparkline={detail.sparkline}
      headPassRate={headPassRate}
      baselinePassRate={baselinePassRate}
      baselineLabel={baselineRun?.promptLabel ?? null}
      netDelta={netDelta}
      flippedCases={flippedCases}
    />
  );
}
