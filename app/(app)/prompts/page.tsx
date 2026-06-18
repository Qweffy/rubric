import { notFound } from "next/navigation";

import {
  PromptTimelineView,
  type ScorecardData,
  type TimelineVersion,
} from "@/components/prompts/prompt-timeline-view";
import {
  getPromptTimeline,
  type PromptVersionTimeline,
} from "@/lib/queries/prompts";

// The timeline reflects live version/run state (a new prompt run lands a fresh
// node and moves the pass-rate); never statically cache it.
export const dynamic = "force-dynamic";

/** Default suite when none is supplied — the canonical hero suite. */
const DEFAULT_SUITE = "checkout-extraction";

/** Parse a numeric version label ("v23" → 23) for stable ordering. */
function versionNumber(label: string): number {
  const match = /\d+/.exec(label);
  return match ? Number.parseInt(match[0], 10) : 0;
}

/**
 * Display pass-rate for a version. The query's `latestPassRate` only counts
 * *completed* runs, so a regressed head (failed run) reports null there — fall
 * back to the newest run's raw pass-rate so the regressed node still shows its
 * number.
 */
function displayPassRate(v: PromptVersionTimeline): number | null {
  if (v.latestPassRate !== null) return v.latestPassRate;
  const newestRun = v.runs[0];
  return newestRun ? newestRun.passRate : null;
}

/** The most relevant run for a version (newest by start time). */
function headRun(v: PromptVersionTimeline) {
  return v.runs[0] ?? null;
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  const suiteSlug = suite ?? DEFAULT_SUITE;

  const timeline = await getPromptTimeline(suiteSlug);
  if (timeline === null) notFound();

  // Newest-first: order by the head run's start time, falling back to the
  // version number so versions without runs still sort sensibly.
  const ordered = [...timeline.versions].sort((a, b) => {
    const aRun = headRun(a);
    const bRun = headRun(b);
    if (aRun && bRun) return bRun.startedAt.getTime() - aRun.startedAt.getTime();
    if (aRun) return -1;
    if (bRun) return 1;
    return versionNumber(b.label) - versionNumber(a.label);
  });

  // The live version = newest version whose head run completed (shipped to main).
  const liveVersion =
    ordered.find((v) => headRun(v)?.status === "completed") ?? null;
  const livePassRate = liveVersion ? displayPassRate(liveVersion) : null;

  // `PromptRunPoint` doesn't carry the run's branch, so derive it: a failed
  // head run is the candidate on its feature branch; everything else is on main.
  const branchFor = (v: PromptVersionTimeline): string => {
    const run = headRun(v);
    if (run?.status === "failed") return "feat/stricter-schema";
    return "main";
  };

  // Build the view rows oldest→newest deltas: each node's Δ is its pass-rate
  // minus the *previous* version's (the one shipped before it). `ordered` is
  // newest-first, so the previous version is the next index.
  const versions: TimelineVersion[] = ordered.map((v, index) => {
    const run = headRun(v);
    const passRate = displayPassRate(v);
    const prev = ordered[index + 1];
    const prevPassRate = prev ? displayPassRate(prev) : null;
    const prevRun = prev ? headRun(prev) : null;

    const passDelta =
      passRate !== null && prevPassRate !== null
        ? (passRate - prevPassRate) * 100
        : null;
    const costDelta =
      run && prevRun ? run.costUsd - prevRun.costUsd : null;

    const isLive = liveVersion !== null && v.id === liveVersion.id;
    const isRegressed = run?.status === "failed";

    return {
      id: v.id,
      label: v.label,
      number: versionNumber(v.label),
      ref: v.ref,
      createdAt: v.createdAt.toISOString(),
      branch: run ? branchFor(v) : null,
      passRate,
      passDelta,
      costDelta,
      status: run?.status ?? null,
      isLive,
      isRegressed,
      isImproved:
        !isRegressed && passDelta !== null && passDelta >= 2,
      isCostWin: costDelta !== null && costDelta < -0.005,
      isCostRegression:
        !isRegressed &&
        costDelta !== null &&
        costDelta > 0.005 &&
        passDelta !== null &&
        Math.abs(passDelta) < 0.05,
    };
  });

  // Right-rail scorecards, all derived from the seeded versions.
  const withRate = versions.filter(
    (v): v is TimelineVersion & { passRate: number } => v.passRate !== null,
  );
  const best = withRate.reduce<(TimelineVersion & { passRate: number }) | null>(
    (acc, v) => (acc === null || v.passRate > acc.passRate ? v : acc),
    null,
  );

  // Versions created within the trailing 7 days of the newest version.
  const newest = ordered[0];
  const weekCutoffMs = newest
    ? newest.createdAt.getTime() - 7 * 24 * 60 * 60 * 1000
    : 0;
  const thisWeek = ordered.filter(
    (v) => headRun(v) !== null && (headRun(v)?.startedAt.getTime() ?? 0) >= weekCutoffMs,
  );

  const scorecards: ScorecardData = {
    liveLabel: liveVersion?.label ?? null,
    livePassRate,
    liveSince: liveVersion
      ? (headRun(liveVersion)?.startedAt.toISOString() ?? null)
      : null,
    bestPassRate: best?.passRate ?? null,
    bestLabel: best?.label ?? null,
    bestDate: best
      ? (ordered.find((v) => v.id === best.id)?.createdAt.toISOString() ?? null)
      : null,
    thisWeekCount: thisWeek.length,
    thisWeekLabels: thisWeek.map((v) => v.label),
  };

  // Pass-rate series for the sparkline, oldest→newest (reverse of `ordered`).
  const series = [...versions]
    .reverse()
    .map((v) => v.passRate)
    .filter((r): r is number => r !== null);

  return (
    <PromptTimelineView
      suiteSlug={timeline.suiteSlug}
      suiteTitle={timeline.suiteTitle}
      totalVersions={timeline.versions.length}
      versions={versions}
      scorecards={scorecards}
      series={series}
    />
  );
}
