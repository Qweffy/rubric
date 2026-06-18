import { type StatusValue } from "@/components/ui/status-badge";
import {
  type TrajectoryOutcome,
  type TrajectoryStepMatch,
} from "@/db/schema";
import {
  type TrajectoryDetail,
  type TrajectoryStepDetail,
} from "@/lib/queries/trajectories";

/* ------------------------------------------------------------------ */
/* View model — derives the screen's presentational fields from the    */
/* seeded query. Numbers that exist in the data (accuracy, step counts, */
/* args/result, outcome) come straight through; per-call cost/latency/  */
/* tokens and judge copy are not in the schema, so they're derived      */
/* deterministically here (keyed off the seeded step shape) rather than */
/* hardcoded at the call site. The query is the single source.          */
/* ------------------------------------------------------------------ */

export type StepKind = TrajectoryStepMatch;

export interface TrajectoryStepView {
  /** Stable key — the step idx. */
  key: string;
  /** Source step from the query. */
  raw: TrajectoryStepDetail;
  kind: StepKind;
  /** EXPECTED-track node label (null when there is no expected step). */
  expectedLabel: string | null;
  /** EXPECTED-track ordinal label, e.g. "E2". */
  expectedTag: string | null;
  /** ACTUAL-track node label (null when the step is a deletion). */
  actualLabel: string | null;
  /** ACTUAL-track ordinal label, e.g. "A2". */
  actualTag: string | null;
  /** Sequential index of this actual call (0-based), null for deletions. */
  actualIdx: number | null;
  /** 1-based step number shown in the UI (matches "STEP 2"). */
  stepNumber: number;
  /** A redundant insert reuses the prior call's query. */
  redundant: boolean;
  /** Pretty-printed args JSON for the drawer. */
  argsText: string;
  /** Pretty-printed (truncated) result preview for the drawer. */
  resultText: string;
  /** Derived per-call telemetry shown in the drawer. */
  latencyLabel: string;
  costLabel: string;
  tokens: number;
  /** Inline note for divergent steps (null for clean matches). */
  note: string | null;
}

export interface CostModel {
  fraction: number;
  /** "UNDER" / "+53% OVER". */
  verdict: string;
  /** Verdict text color. */
  tone: string;
  /** Bar fill color. */
  barColor: string;
}

export interface RubricCriterion {
  index: number;
  label: string;
  verdict: "PASS" | "MINOR" | "FAIL";
}

export interface TrajectoryModel {
  taskId: string;
  suiteTitle: string;
  outcome: TrajectoryOutcome;
  versionLabel: string;
  headlineStatus: StatusValue;

  steps: TrajectoryStepView[];
  divergenceStep: TrajectoryStepView | null;
  /** The step the drawer focuses by default — divergence, else the first step. */
  defaultStep: TrajectoryStepView;

  expectedCount: number;
  actualCount: number;
  stepBudget: number;

  toolAccuracyWhole: string;
  toolAccuracyFraction: string;
  counts: { match: number; insert: number; delete: number; substitute: number };

  firstDivergenceStep: number;
  firstDivergenceLabel: string;

  finalAnswerPass: boolean;
  finalAnswerVerdict: "PASS" | "FAIL";
  judgeScore: number;
  judgeMax: number;

  costLabel: string;
  budgetLabel: string;
  cost: CostModel;

  agentFinalAnswer: AnswerSegment[];
  rubric: RubricCriterion[];
  judgeReasoning: string;
  judgeModel: string;
  judgeTokens: string;
}

/** A run of answer text — `hi` lifts the segment to the heading color / a code style. */
export type AnswerSegment =
  | { text: string }
  | { text: string; tone: "hi" }
  | { text: string; tone: "mono"; color?: string };

const STEP_BUDGET = 6;
const COST_SPENT = 0.028;
const COST_BUDGET = 0.04;

const OUTCOME_STATUS: Record<TrajectoryOutcome, StatusValue> = {
  correct: "PASS",
  "diverged-but-correct": "PARTIAL",
  failed: "FAIL",
};

function toMono(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Pretty per-call args block, compacted to a single inline object when small. */
function argsPreview(args: unknown): string {
  if (args && typeof args === "object" && !Array.isArray(args)) {
    const entries = Object.entries(args as Record<string, unknown>);
    const inline = entries
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(", ");
    return `{ ${inline} }`;
  }
  return toMono(args);
}

/** Result preview — collapse the seeded shape into the design's truncated list. */
function resultPreview(result: unknown): string {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    const r = result as Record<string, unknown>;
    if (typeof r.flights === "number") {
      return [
        "[",
        '  { flight: "BA178", price: 842, seats: 9 },',
        `  … +${Math.max(0, r.flights - 1)} results`,
        "]",
      ].join("\n");
    }
  }
  return toMono(result);
}

/** Cost-vs-budget model — verdict flips to "+N% OVER" once spend exceeds cap. */
function deriveCost(spent: number, budget: number): CostModel {
  const fraction = budget > 0 ? spent / budget : 0;
  const overBudget = fraction > 1;
  return {
    fraction,
    verdict: overBudget ? `+${Math.round((fraction - 1) * 100)}% OVER` : "UNDER",
    tone: overBudget ? "var(--red)" : "var(--phosphor)",
    barColor: overBudget ? "var(--red)" : "var(--phosphor)",
  };
}

/**
 * Build the full view model for the trajectory detail screen from the seeded
 * query. Pure and deterministic so the page stays a thin pass-through.
 */
export function buildTrajectoryModel(detail: TrajectoryDetail): TrajectoryModel {
  // Walk the steps, assigning expected/actual ordinals per track. Deletions
  // consume an expected ordinal but no actual; inserts the reverse.
  let expectedOrd = 0;
  let actualOrd = 0;
  let priorActual: TrajectoryStepDetail | null = null;

  const steps: TrajectoryStepView[] = detail.steps.map((raw, i) => {
    const kind: StepKind = raw.match;
    const hasExpected = kind !== "insert" && raw.expectedTool !== null;
    const hasActual = kind !== "delete" && raw.actualTool !== null;

    if (hasExpected) expectedOrd += 1;
    const thisActualIdx = hasActual ? actualOrd : null;
    if (hasActual) actualOrd += 1;

    const redundant =
      kind === "insert" &&
      priorActual !== null &&
      priorActual.actualTool === raw.actualTool &&
      toMono(priorActual.args) === toMono(raw.args);

    const tokens = redundant ? 312 : 280 + ((i * 37) % 90);
    const cost = redundant ? 0.006 : 0.004 + ((i * 11) % 5) / 1000;
    const latency = redundant ? 1.31 : 0.9 + ((i * 17) % 70) / 100;

    const view: TrajectoryStepView = {
      key: String(raw.idx),
      raw,
      kind,
      expectedLabel: hasExpected ? raw.expectedTool : null,
      expectedTag: hasExpected ? `E${expectedOrd}` : null,
      actualLabel: hasActual ? raw.actualTool : null,
      actualTag: hasActual ? `A${actualOrd}` : null,
      actualIdx: thisActualIdx,
      stepNumber: i + 1,
      redundant,
      argsText: argsPreview(raw.args),
      resultText: resultPreview(raw.result),
      latencyLabel: `${latency.toFixed(2)}s`,
      costLabel: `$${cost.toFixed(3)}`,
      tokens,
      note: redundant
        ? `Redundant: same query as step ${i}, returned identical results. No new information gained — ${tokens} tok & $${cost.toFixed(3)} wasted.`
        : kind === "substitute"
          ? "Substituted tool — expected a different call at this position."
          : kind === "delete"
            ? "Expected step skipped — the agent never made this call."
            : null,
    };

    if (hasActual) priorActual = raw;
    return view;
  });

  const divergenceStep = steps.find((s) => s.kind !== "match") ?? null;

  const firstStep = steps[0];
  if (firstStep === undefined) {
    throw new Error(`trajectory ${detail.taskId} has no steps`);
  }
  const defaultStep = divergenceStep ?? firstStep;

  const counts = {
    match: detail.stepCounts.match,
    insert: detail.stepCounts.insert,
    delete: detail.stepCounts.delete,
    substitute: detail.stepCounts.substitute,
  };

  const accuracyPct = detail.toolSelectionAccuracy * 100;
  const accStr = accuracyPct.toFixed(1); // "90.5"
  const [wholePart, fractionPart] = accStr.split(".");
  const whole = wholePart ?? accStr;
  const fraction = fractionPart ?? "0";

  const firstDivergenceStep = divergenceStep?.stepNumber ?? 0;
  const firstDivergenceLabel =
    divergenceStep == null
      ? "no divergence"
      : divergenceStep.kind === "insert"
        ? "redundant search"
        : divergenceStep.kind === "delete"
          ? "skipped step"
          : "tool confusion";

  const cost = deriveCost(COST_SPENT, COST_BUDGET);

  return {
    taskId: detail.taskId,
    suiteTitle: detail.suiteTitle,
    outcome: detail.outcome,
    versionLabel: "v6",
    headlineStatus: OUTCOME_STATUS[detail.outcome],

    steps,
    divergenceStep,
    defaultStep,

    expectedCount: detail.expectedTools.length,
    actualCount: detail.actualTools.length,
    stepBudget: STEP_BUDGET,

    toolAccuracyWhole: whole,
    toolAccuracyFraction: fraction,
    counts,

    firstDivergenceStep,
    firstDivergenceLabel,

    finalAnswerPass: detail.finalAnswerPass,
    finalAnswerVerdict: detail.finalAnswerPass ? "PASS" : "FAIL",
    judgeScore: detail.finalAnswerPass ? 5 : 2,
    judgeMax: 5,

    costLabel: `$${COST_SPENT.toFixed(3)}`,
    budgetLabel: `$${COST_BUDGET.toFixed(3)}`,
    cost,

    agentFinalAnswer: ANSWER_SEGMENTS,
    rubric: RUBRIC_CRITERIA,
    judgeReasoning:
      "Despite a redundant search call, the agent recovered and produced a correct, complete multi-leg booking confirmation — the outcome is right even though the path wasn't optimal.",
    judgeModel: "claude-opus-4",
    judgeTokens: "1,440",
  };
}

/* The agent's final-answer copy, segment-tagged so the heading-colored spans
   and mono codes match the handoff exactly. */
const ANSWER_SEGMENTS: AnswerSegment[] = [
  { text: "Your multi-leg trip is booked. " },
  { text: "Leg 1", tone: "hi" },
  { text: " — JFK → LHR on Jul 2 (BA178, seat 14A). " },
  { text: "Leg 2", tone: "hi" },
  { text: " — LHR → JFK on Jul 9 (BA179, seat 12C). Confirmation " },
  { text: "PNR X7Q2LM", tone: "mono", color: "var(--violet)" },
  { text: ". Total " },
  { text: "$842.00", tone: "mono", color: "var(--text-hi)" },
  { text: ", charged to card ending 4471. Both seat holds were confirmed before payment." },
];

const RUBRIC_CRITERIA: RubricCriterion[] = [
  { index: 1, label: "All legs booked", verdict: "PASS" },
  { index: 2, label: "Within budget", verdict: "PASS" },
  { index: 3, label: "No redundant work", verdict: "MINOR" },
];
