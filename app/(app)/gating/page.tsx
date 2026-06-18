import {
  CiGatingView,
  type GatePrMeta,
  type GateHistoryEvent,
  type GateRow,
  type OverrideSummary,
} from "@/components/gating/ci-gating-view";
import {
  GATE_THRESHOLDS,
  GENERIC_THRESHOLD,
  type GateMetric,
  type SuiteGate,
  getGateStatus,
} from "@/lib/queries/gating";
import { getRunDetail, listRuns } from "@/lib/queries/runs";

/**
 * CI / Gating (M6) — the go/no-go board for open PRs. Server component: reads
 * the live gate status on every request, then hands a typed snapshot to the
 * client view that owns the board hover, the override-confirm flow, and the
 * ⌘K-driven row selection.
 *
 * force-dynamic: the gate board reflects whatever CI last wrote; it must never
 * be frozen at build time. params/searchParams are awaited per Next 16 (both
 * are Promises) — `?pr=` lets a deep link preselect a board row.
 */
export const dynamic = "force-dynamic";

/**
 * Design-canonical PR chrome the gate query does not carry. The board surfaces
 * one row per OPEN pull request; the PR number/title/"when" are GitHub metadata
 * mapped by suite slug. Only suites with an open PR appear on the board (the
 * other seeded suites have no PR under review), so this map also defines the
 * board's membership + order.
 */
const PR_META_BY_SLUG: Record<string, GatePrMeta> = {
  "checkout-extraction": {
    pr: 214,
    title: "tighten checkout schema",
    when: "12m ago",
    rootCauseScorer: "field-accuracy",
  },
  "support-router": {
    pr: 211,
    title: "support router tweaks",
    when: "1h ago",
  },
  "invoice-parser": {
    pr: 209,
    title: "invoice edge cases",
    when: "3h ago",
  },
};

/**
 * The PENDING PR (#205) and the override/history ledger are CI-event chrome the
 * gate-status query does not surface (it scores only the latest COMPLETED run).
 * Rendered as the design's canonical fixtures so the board, status strip, and
 * history timeline reproduce the handoff.
 */
const PENDING_PR = {
  pr: 205,
  title: "judge prompt update",
  suite: "multiple",
} as const;

const OVERRIDES_7D: OverrideSummary = {
  count: 1,
  by: "nico",
  reason: "hotfix",
  pr: 198,
  at: "2026-06-17 09:40 UTC",
};

const GATE_HISTORY: GateHistoryEvent[] = [
  { kind: "block", pr: 214, text: "blocked — 2 floors failed", actor: "ci", when: "12m ago" },
  { kind: "pass", pr: 211, text: "passed all floors", actor: "ci", when: "1h ago" },
  {
    kind: "override",
    pr: 198,
    text: "overridden by nico · reason: hotfix",
    actor: "",
    when: "2026-06-17 09:40",
  },
  { kind: "pass", pr: 209, text: "passed all floors", actor: "ci", when: "3h ago" },
];

/** Gate threshold for a scorer, mirroring the gate query's own resolution. */
function thresholdFor(scorer: string): number {
  return GATE_THRESHOLDS[scorer] ?? GENERIC_THRESHOLD;
}

/**
 * Build a SuiteGate for the open PR under review on a suite. getGateStatus()
 * scores the latest COMPLETED run, but a CI gate evaluates the PR's candidate
 * run — which for #214 is the FAILED head run `a3f9c21` (PR#214) the status
 * query omits. We read that run via getRunDetail and re-score its scorers
 * against the same floors, so the board shows the canonical regression
 * (schema 79.6%, field-accuracy 0.84) entirely from the data layer.
 */
async function candidateGateForPr(slug: string): Promise<SuiteGate | null> {
  const suiteRuns = await listRuns(slug);
  const candidate = suiteRuns.find(
    (r) => r.suiteSlug === slug && r.trigger === "ci",
  );
  if (candidate === undefined) return null;

  const detail = await getRunDetail(candidate.id);
  if (detail === null) return null;

  const metrics: GateMetric[] = detail.scorers
    .map((s) => {
      const threshold = thresholdFor(s.name);
      const margin = s.passRate - threshold;
      return {
        metric: s.name,
        value: s.passRate,
        threshold,
        margin,
        status: margin >= 0 ? ("pass" as const) : ("fail" as const),
      };
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "fail" ? -1 : 1;
      return a.margin - b.margin;
    });

  return {
    suiteId: detail.summary.suiteId,
    suiteSlug: detail.summary.suiteSlug,
    suiteTitle: detail.summary.suiteTitle,
    runId: detail.summary.id,
    promptLabel: detail.summary.promptLabel,
    sha: detail.summary.sha,
    branch: detail.summary.branch,
    passRate: detail.summary.passRate,
    metrics,
    passing: metrics.every((m) => m.status === "pass"),
  };
}

export default async function GatingPage({
  searchParams,
}: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, status] = await Promise.all([searchParams, getGateStatus()]);

  // The blocked PR (#214) is the suite's CI candidate run, which the status
  // query excludes (it failed). Pull it from the run detail so the board shows
  // the real regression rather than the suite's last green run.
  const blockedGate = await candidateGateForPr("checkout-extraction");

  // Board membership = suites with an open PR, in PR_META order. Each row is the
  // suite's gate; checkout-extraction uses the CI-candidate gate when available.
  const bySlug = new Map<string, SuiteGate>(
    status.gates.map((g) => [g.suiteSlug, g]),
  );
  if (blockedGate) bySlug.set(blockedGate.suiteSlug, blockedGate);

  const rows: GateRow[] = Object.entries(PR_META_BY_SLUG)
    .map(([slug, meta]) => {
      const gate = bySlug.get(slug);
      return gate ? { gate, meta } : null;
    })
    .filter((row): row is GateRow => row !== null)
    .sort((a, b) => {
      // Blocked first, then by PR number descending (newest PR on top).
      if (a.gate.passing !== b.gate.passing) return a.gate.passing ? 1 : -1;
      return b.meta.pr - a.meta.pr;
    });

  const blockingCount = rows.filter((r) => !r.gate.passing).length;

  // Deep-link selection: `?pr=214` preselects that board row.
  const prParam = Array.isArray(sp.pr) ? sp.pr[0] : sp.pr;
  const parsedPr = prParam !== undefined ? Number.parseInt(prParam, 10) : Number.NaN;

  return (
    <CiGatingView
      rows={rows}
      blockingCount={blockingCount}
      suiteCount={rows.length}
      pending={PENDING_PR}
      overrides={OVERRIDES_7D}
      history={GATE_HISTORY}
      initialPr={Number.isNaN(parsedPr) ? null : parsedPr}
    />
  );
}
