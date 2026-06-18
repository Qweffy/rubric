import {
  TrajectoriesView,
  type TrajectoryMatchKind,
  type TrajectoryRow,
  type TrajectoryStats,
  type TrajectorySuiteHeader,
} from "@/components/trajectories/trajectories-view";
import  { type TrajectoryOutcome } from "@/db/schema";
import { getTrajectories, type TrajectoryListItem } from "@/lib/queries/trajectories";

// Trajectory scores reflect the live seeded store (runs land tasks under a
// suite); never statically cache the index. Mutations revalidatePath here.
export const dynamic = "force-dynamic";

/** The golden-set target the overview is framed against (design: "40 GOLDEN TASKS · v6"). */
const GOLDEN_TARGET = 40;
/** Step budget the avg-steps tile is measured against (design: "/ budget 6.0"). */
const STEP_BUDGET = 6;

/**
 * Outcome → the trajectory's sequence-match kind. The match column grades the
 * *shape* of the actual tool sequence vs. the golden reference:
 *  - correct               → EXACT    (step-for-step identical)
 *  - diverged-but-correct  → PARTIAL  (extra / re-ordered, still-correct answer)
 *  - failed                → DIVERGED (wrong / missing tool)
 */
function matchKind(outcome: TrajectoryOutcome): TrajectoryMatchKind {
  switch (outcome) {
    case "correct":
      return "EXACT";
    case "diverged-but-correct":
      return "PARTIAL";
    case "failed":
      return "DIVERGED";
  }
}

/** Per-row status badge word, keyed off the same outcome. */
function statusWord(outcome: TrajectoryOutcome): TrajectoryRow["status"] {
  switch (outcome) {
    case "correct":
      return "PASSING";
    case "diverged-but-correct":
      return "PARTIAL";
    case "failed":
      return "REGRESSED";
  }
}

/**
 * A short amber/red note for the rows that drifted, derived from the outcome.
 * EXACT rows carry no note. The detail view owns the per-step diff; here we
 * surface only the headline reason inferable from the list row.
 */
function driftNote(item: TrajectoryListItem): string | null {
  switch (item.outcome) {
    case "diverged-but-correct":
      return "extra tool call · right tools, still-correct answer";
    case "failed":
      return "wrong or missing tool, over budget";
    case "correct":
      return null;
  }
}

function toRow(item: TrajectoryListItem): TrajectoryRow {
  const kind = matchKind(item.outcome);
  return {
    id: item.id,
    taskId: item.taskId,
    suiteSlug: item.suiteSlug,
    suiteTitle: item.suiteTitle,
    expectedTools: item.expectedTools,
    toolSelectionAccuracy: item.toolSelectionAccuracy,
    finalAnswerPass: item.finalAnswerPass,
    outcome: item.outcome,
    match: kind,
    status: statusWord(item.outcome),
    note: driftNote(item),
  };
}

/** Mean of a numeric series, or 0 for an empty series. */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Roll the per-task rows up into the four headline tiles. Numbers are derived
 * from the seeded query — the golden target and step budget are the only fixed
 * framing constants (mirroring the design's "40 GOLDEN TASKS" / "budget 6.0").
 */
function buildStats(rows: TrajectoryRow[]): TrajectoryStats {
  const total = rows.length;
  const exact = rows.filter((r) => r.match === "EXACT").length;
  const finalPass = rows.filter((r) => r.finalAnswerPass).length;
  const avgAccuracy = mean(rows.map((r) => r.toolSelectionAccuracy));
  // Each task's step count = its expected sequence length (the golden plan); the
  // mean approximates the trajectory length the agent is graded against.
  const avgSteps = mean(rows.map((r) => r.expectedTools.length));

  return {
    total,
    goldenTarget: GOLDEN_TARGET,
    toolSelectionAccuracyPct: avgAccuracy * 100,
    exactMatch: exact,
    exactMatchPct: total > 0 ? (exact / total) * 100 : 0,
    finalAnswerPass: finalPass,
    finalAnswerPassPct: total > 0 ? (finalPass / total) * 100 : 0,
    avgSteps,
    stepBudget: STEP_BUDGET,
  };
}

export default async function TrajectoriesPage() {
  const items = await getTrajectories();
  const rows = items.map(toRow);
  const stats = buildStats(rows);

  // The screen is framed around a single agent suite; the seed lands the
  // golden set under refund-agent. Fall back gracefully if the set is empty.
  const lead = rows[0];
  const suite: TrajectorySuiteHeader = {
    slug: lead?.suiteSlug ?? "refund-agent",
    title: lead?.suiteTitle ?? "refund-agent",
    goldenTarget: GOLDEN_TARGET,
  };

  return <TrajectoriesView rows={rows} stats={stats} suite={suite} />;
}
