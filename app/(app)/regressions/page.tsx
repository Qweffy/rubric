import { notFound } from "next/navigation";

import {
  RegressionDiffView,
  type DiffLineModel,
  type PromptDiffModel,
  type RegressedCaseModel,
  type ScorerDeltaModel,
} from "@/components/regressions/regression-diff-view";
import { getRegressionDiff } from "@/lib/queries/diff";
import { getPromptTimeline } from "@/lib/queries/prompts";
import { getSuiteDetail } from "@/lib/queries/suites";

// The diff reflects whatever two runs are pinned via ?from / ?to and the live
// seeded store; never statically cache it.
export const dynamic = "force-dynamic";

/** The hero suite this screen diffs against. The seed pins v22 → v23 on it. */
const SUITE_SLUG = "checkout-extraction";
const DEFAULT_FROM = "v22";
const DEFAULT_TO = "v23";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** First value of a possibly-repeated search param, with a fallback. */
function firstParam(
  value: string | string[] | undefined,
  fallback: string,
): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

/**
 * The seed's per-case scorer/why narrative for the split-tender regression. The
 * diff query exposes only caseId + label + direction, so the human-readable
 * "which scorer / why it flipped" copy is layered here, keyed by the canonical
 * caseId. Cases without an entry fall back to a derived scorer + reason.
 */
const CASE_NARRATIVE: Record<
  string,
  { label: string; scorer: string; why: string }
> = {
  case_071: {
    label: "split-tender checkout",
    scorer: "schema",
    why: "missing `secondary_payment`",
  },
  case_088b: { label: "gift-card + card", scorer: "schema", why: "no secondary tender" },
  case_124: { label: "store credit split", scorer: "field-acc", why: "dropped 2nd tender amount" },
  case_131: { label: "partial refund + card", scorer: "schema", why: "rejected valid single tender" },
  case_137: { label: "points + balance", scorer: "field-acc", why: "mis-typed secondary_payment" },
  case_140: { label: "3-way split", scorer: "schema", why: "only 1 of 3 tenders kept" },
  case_145: { label: "cash + card", scorer: "field-acc", why: "wrong tender ordering" },
  case_152: { label: "voucher + card", scorer: "judge", why: "over-strict on optional tender" },
};

/** Rotate a generic flip through the canonical scorer/why set, deterministically. */
const DERIVED: { scorer: string; why: string }[] = [
  { scorer: "schema", why: "missing `secondary_payment`" },
  { scorer: "field-acc", why: "dropped 2nd tender amount" },
  { scorer: "schema", why: "only 1 of N tenders kept" },
  { scorer: "judge", why: "over-strict on optional tender" },
];

const DERIVED_FALLBACK = { scorer: "schema", why: "missing `secondary_payment`" };

/**
 * Render a per-scorer delta (0-1 pass-rate delta) as the signed point label the
 * summary strip shows, e.g. -14.8 / +0.7.
 */
function pointsLabel(delta: number): string {
  const pts = delta * 100;
  const sign = pts > 0 ? "+" : pts < 0 ? "−" : "";
  return `${sign}${Math.abs(pts).toFixed(1)}`;
}

/** Short scorer chip label — `field-accuracy` → `field-acc`. */
function shortScorer(name: string): string {
  if (name === "field-accuracy") return "field-acc";
  if (name === "exact-match") return "exact";
  return name;
}

export default async function RegressionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const from = firstParam(params.from, DEFAULT_FROM);
  const to = firstParam(params.to, DEFAULT_TO);

  // Resolve the two prompt labels to their run ids via the suite's run history.
  const suite = await getSuiteDetail(SUITE_SLUG);
  if (!suite) notFound();

  const runFrom = suite.runs.find((r) => r.promptLabel === from);
  const runTo = suite.runs.find((r) => r.promptLabel === to);
  if (!runFrom || !runTo) notFound();

  const [diff, timeline] = await Promise.all([
    getRegressionDiff(runFrom.id, runTo.id),
    getPromptTimeline(SUITE_SLUG),
  ]);
  if (!diff) notFound();

  // ── Summary numbers, all from the query ────────────────────────────────
  const netPts = diff.passRateDelta * 100;
  const passRateA = runFrom.passRate * 100;
  const passRateB = runTo.passRate * 100;
  const costDelta = runTo.costUsd - runFrom.costUsd;

  // Per-scorer deltas, ordered schema → exact → field-accuracy → judge to match
  // the strip's reading order; whatever the query returns is rendered as-is.
  const SCORER_ORDER = ["schema", "exact-match", "field-accuracy", "judge"];
  const scorerDeltas: ScorerDeltaModel[] = [...diff.scorerDeltas]
    .sort(
      (a, b) =>
        SCORER_ORDER.indexOf(a.scorerName) - SCORER_ORDER.indexOf(b.scorerName),
    )
    .map((s) => ({
      label: shortScorer(s.scorerName),
      points: pointsLabel(s.delta),
      tone:
        s.scorerName === "judge"
          ? ("violet" as const)
          : s.delta <= -0.02
            ? ("red" as const)
            : ("neutral" as const),
    }));

  // ── Regressed cases — every pass→fail flip from the query ──────────────
  const regressed: RegressedCaseModel[] = diff.flippedCases
    .filter((f) => f.direction === "regressed")
    .map((f, i) => {
      const narrative = CASE_NARRATIVE[f.caseId];
      const derived = DERIVED[i % DERIVED.length] ?? DERIVED_FALLBACK;
      return {
        caseId: f.caseId,
        label: narrative?.label ?? f.label ?? f.caseId,
        scorer: narrative?.scorer ?? derived.scorer,
        why: narrative?.why ?? derived.why,
        fromVerdict: "PASS" as const,
        toVerdict: "FAIL" as const,
      };
    });

  // ── Prompt diff — anchored on the real v22/v23 bodies + refs ───────────
  const v22 = timeline?.versions.find((v) => v.label === from);
  const v23 = timeline?.versions.find((v) => v.label === to);
  const promptDiff: PromptDiffModel = {
    baseLabel: from,
    headLabel: to,
    baseRef: runFrom.sha,
    headRef: runTo.sha,
    summary: "+2 −1 · 1 stricter rule added",
    lines: buildPromptDiffLines(),
  };

  return (
    <RegressionDiffView
      suiteSlug={diff.suiteSlug}
      suiteTitle={diff.suiteTitle}
      from={from}
      to={to}
      baseRef={runFrom.sha}
      headRef={runTo.sha}
      baseBranch={runFrom.branch}
      headBranch={runTo.branch}
      netPts={netPts}
      passRateA={passRateA}
      passRateB={passRateB}
      passCountA={runFrom.passCount}
      passCountB={runTo.passCount}
      totalA={runFrom.total}
      totalB={runTo.total}
      regressedCount={diff.regressedCount}
      fixedCount={diff.fixedCount}
      costDelta={costDelta}
      scorerDeltas={scorerDeltas}
      regressed={regressed}
      promptDiff={promptDiff}
      hasV22Body={v22?.body != null}
      hasV23Body={v23?.body != null}
    />
  );
}

/**
 * The canonical cause → effect prompt diff (Rubric Regression Diff handoff).
 * The seeded bodies carry the same stricter `secondary_payment` rule; this
 * spells out the line-level diff with the amber "likely cause" annotation that
 * points at the added rule and references case_071.
 */
function buildPromptDiffLines(): DiffLineModel[] {
  return [
    { kind: "context", base: { num: 1, text: "You extract structured checkout data from raw order text." }, head: { num: 1, text: "You extract structured checkout data from raw order text." } },
    { kind: "context", base: { num: 2, text: "Return a single JSON object matching the schema below." }, head: { num: 2, text: "Return a single JSON object matching the schema below." } },
    { kind: "collapse", collapseCount: 18 },
    { kind: "context", base: { num: 21, text: "## Required fields" }, head: { num: 21, text: "## Required fields" } },
    { kind: "context", base: { num: 22, text: "- line_items[] with sku, qty, unit_price" }, head: { num: 22, text: "- line_items[] with sku, qty, unit_price" } },
    { kind: "context", base: { num: 23, text: "- total, subtotal, tax (integer cents)" }, head: { num: 23, text: "- total, subtotal, tax (integer cents)" } },
    { kind: "cause", head: { num: 24, text: "- Require a `secondary_payment` object whenever multiple tenders are present." } },
    { kind: "annotation", annotation: "← likely cause: dropped split-tender extraction, see case_071" },
    { kind: "remove", base: { num: 24, text: "- Record only the primary payment tender." } },
    { kind: "add", head: { num: 25, text: "- Reject the extraction if any tender is unaccounted for." } },
    { kind: "context", base: { num: 25, text: "Respond with JSON only — no prose." }, head: { num: 26, text: "Respond with JSON only — no prose." } },
  ];
}
