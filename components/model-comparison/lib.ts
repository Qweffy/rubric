import { type JudgeComparisonRow } from "@/lib/queries/calibration";

/* ------------------------------------------------------------------ */
/* Derivations for the Model Comparison board. The query exposes each   */
/* judge's calibration vs the human gold set (κ, agreement, false-pass, */
/* bias, cost, latency); the inter-judge matrix and the cost-vs-accuracy*/
/* scatter are DERIVED from those rows here (the query is the contract — */
/* we never edit it, and never hardcode the seeded numbers).            */
/* ------------------------------------------------------------------ */

/** Short rail label for a judge name, e.g. "claude-opus-4" → "OPUS". */
export function shortLabel(judgeName: string): string {
  const n = judgeName.toLowerCase();
  if (n.includes("opus")) return "OPUS";
  if (n.includes("sonnet")) return "SONNET";
  if (n.includes("mini")) return "MINI";
  if (n.includes("gpt-4o")) return "GPT-4o";
  if (n.includes("haiku")) return "HAIKU";
  // Fall back to the last path/segment, uppercased.
  const tail = judgeName.split(/[-/]/).pop() ?? judgeName;
  return tail.toUpperCase();
}

/** Lowercase dot label for the scatter, e.g. "claude-opus-4" → "opus". */
export function dotLabel(judgeName: string): string {
  return shortLabel(judgeName).toLowerCase();
}

/** A judge is the cost-value "knee" when its κ-per-dollar is the highest. */
export function kappaPerDollar(row: JudgeComparisonRow): number | null {
  if (row.kappa == null || row.costPer1k == null || row.costPer1k <= 0) {
    return null;
  }
  return row.kappa / row.costPer1k;
}

/**
 * The recommended judge — best κ-per-dollar among judges that are still
 * trustworthy (aligned/biased, i.e. NOT under-calibrated/drifted). Returns null
 * when no judge qualifies. The default judge is excluded as a recommendation
 * target only when something strictly better-value exists; here we simply rank
 * by κ-per-dollar and skip the flagged ones.
 */
export function recommendedJudge(
  judges: JudgeComparisonRow[],
): JudgeComparisonRow | null {
  const eligible = judges.filter(
    (j) =>
      j.status !== "under-calibrated" &&
      j.status !== "drifted" &&
      kappaPerDollar(j) != null,
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, j) =>
    (kappaPerDollar(j) ?? -Infinity) > (kappaPerDollar(best) ?? -Infinity)
      ? j
      : best,
  );
}

/** The current default judge (the one used when none is specified). */
export function defaultJudge(
  judges: JudgeComparisonRow[],
): JudgeComparisonRow | null {
  return judges.find((j) => j.isDefault) ?? null;
}

/**
 * A judge is cost-flagged when it is the cheapest but under-calibrated — it
 * would let real regressions through if used as the gate judge.
 */
export function costFlaggedJudge(
  judges: JudgeComparisonRow[],
): JudgeComparisonRow | null {
  return judges.find((j) => j.status === "under-calibrated") ?? null;
}

export type PairAgreementBucket = "high" | "low" | "diverged";

export interface InterJudgeCell {
  /** Diagonal (a judge vs itself) — always 1.00, rendered inert. */
  selfCell: boolean;
  value: number;
  bucket: PairAgreementBucket;
}

/**
 * Estimated pairwise agreement between two judges, derived from their κ vs the
 * human gold set. Two judges that each track the gold labels well also track
 * each other; a poorly-calibrated judge pulls every pair it touches down. The
 * mean of the two κ is the closest principled estimator and reproduces the
 * board's qualitative story (the strong judges agree; anything ↔ the weak judge
 * drops). The diagonal is 1.00.
 */
export function pairAgreement(
  a: JudgeComparisonRow,
  b: JudgeComparisonRow,
): number {
  if (a.judgeId === b.judgeId) return 1;
  const ka = a.kappa ?? 0;
  const kb = b.kappa ?? 0;
  return (ka + kb) / 2;
}

/** ✓ high · △ low · ✗ diverged — the cell's visual + glyph state. */
export function bucketFor(value: number, selfCell: boolean): PairAgreementBucket {
  if (selfCell) return "high";
  if (value < 0.5) return "diverged";
  if (value < 0.7) return "low";
  return "high";
}

/** The full N×N inter-judge agreement matrix, row-major. */
export function interJudgeMatrix(
  judges: JudgeComparisonRow[],
): InterJudgeCell[][] {
  return judges.map((rowJudge) =>
    judges.map((colJudge) => {
      const selfCell = rowJudge.judgeId === colJudge.judgeId;
      const value = pairAgreement(rowJudge, colJudge);
      return { selfCell, value, bucket: bucketFor(value, selfCell) };
    }),
  );
}

/** The lowest off-diagonal pairwise agreement, e.g. for the caption. */
export interface JudgePair {
  a: JudgeComparisonRow;
  b: JudgeComparisonRow;
  value: number;
}

/** Every distinct off-diagonal judge pair with its estimated agreement. */
function judgePairs(judges: JudgeComparisonRow[]): JudgePair[] {
  const pairs: JudgePair[] = [];
  for (const [i, a] of judges.entries()) {
    for (const b of judges.slice(i + 1)) {
      pairs.push({ a, b, value: pairAgreement(a, b) });
    }
  }
  return pairs;
}

export function weakestPair(judges: JudgeComparisonRow[]): JudgePair | null {
  return judgePairs(judges).reduce<JudgePair | null>(
    (worst, pair) => (worst === null || pair.value < worst.value ? pair : worst),
    null,
  );
}

/** The strongest off-diagonal pair (the agreeing duo named in the caption). */
export function strongestPair(judges: JudgeComparisonRow[]): JudgePair | null {
  return judgePairs(judges).reduce<JudgePair | null>(
    (best, pair) => (best === null || pair.value > best.value ? pair : best),
    null,
  );
}

export interface ScatterPoint {
  judgeId: number;
  label: string;
  cost: number;
  kappa: number;
  isDefault: boolean;
  isRecommended: boolean;
  isFlagged: boolean;
  /** SVG x in plot space. */
  x: number;
  /** SVG y in plot space. */
  y: number;
}

export interface ScatterModel {
  points: ScatterPoint[];
  /** The pareto-frontier polyline through the points, cheapest → priciest. */
  frontier: string;
  /** Axis tick costs (the seeded $/1k values, ascending). */
  costTicks: number[];
  minCost: number;
  maxCost: number;
  minKappa: number;
  maxKappa: number;
}

interface ScatterBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * Project the judges into the cost-vs-accuracy scatter: x maps cost ($/1k,
 * cheaper left), y maps κ (more accurate up). The pareto frontier connects the
 * points in ascending cost. All bounds derive from the data so the plot
 * reframes if the seed changes.
 */
export function scatterModel(
  judges: JudgeComparisonRow[],
  bounds: ScatterBounds,
  recommendedId: number | null,
  defaultId: number | null,
  flaggedId: number | null,
): ScatterModel {
  const usable = judges.filter(
    (j): j is JudgeComparisonRow & { kappa: number; costPer1k: number } =>
      j.kappa != null && j.costPer1k != null,
  );

  const costs = usable.map((j) => j.costPer1k);
  const kappas = usable.map((j) => j.kappa);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minKappa = Math.min(...kappas);
  const maxKappa = Math.max(...kappas);

  // Pad the κ range so the top/bottom points aren't pinned to the frame edge.
  const kPad = Math.max(0.04, (maxKappa - minKappa) * 0.18);
  const kLo = minKappa - kPad;
  const kHi = maxKappa + kPad;
  const cSpan = maxCost - minCost || 1;
  const kSpan = kHi - kLo || 1;

  const projectX = (cost: number): number =>
    bounds.x0 + ((cost - minCost) / cSpan) * (bounds.x1 - bounds.x0);
  const projectY = (kappa: number): number =>
    bounds.y0 - ((kappa - kLo) / kSpan) * (bounds.y0 - bounds.y1);

  const points: ScatterPoint[] = usable.map((j) => ({
    judgeId: j.judgeId,
    label: dotLabel(j.judgeName),
    cost: j.costPer1k,
    kappa: j.kappa,
    isDefault: j.judgeId === defaultId,
    isRecommended: j.judgeId === recommendedId,
    isFlagged: j.judgeId === flaggedId,
    x: projectX(j.costPer1k),
    y: projectY(j.kappa),
  }));

  const ordered = [...points].sort((a, b) => a.cost - b.cost);
  const frontier = ordered
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");

  const costTicks = [...new Set(costs)].sort((a, b) => a - b);

  return {
    points,
    frontier,
    costTicks,
    minCost,
    maxCost,
    minKappa,
    maxKappa,
  };
}

/** "$1.80" — the seeded cost, two decimals. */
export function formatCost(cost: number | null): string {
  if (cost == null) return "—";
  return `$${cost.toFixed(2)}`;
}

/** "98.6%" — agreement as a percentage, one decimal. */
export function formatAgreement(agreement: number | null): string {
  if (agreement == null) return "—";
  return `${(agreement * 100).toFixed(1)}%`;
}

/** "+0.03" / "−0.05" — signed positive-bias, two decimals, real minus glyph. */
export function formatBias(bias: number | null): string {
  if (bias == null) return "—";
  const sign = bias < 0 ? "−" : "+";
  return `${sign}${Math.abs(bias).toFixed(2)}`;
}

/** "2.1s" — p50 latency in seconds, one decimal. */
export function formatLatency(latencyMs: number | null): string {
  if (latencyMs == null) return "—";
  return `${(latencyMs / 1000).toFixed(1)}s`;
}

/** "0.81" — κ to two decimals. */
export function formatKappa(kappa: number | null): string {
  if (kappa == null) return "—";
  return kappa.toFixed(2);
}
