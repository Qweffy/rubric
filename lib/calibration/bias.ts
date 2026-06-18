/* ------------------------------------------------------------------ */
/* Judge bias probes — does the score track something it shouldn't?     */
/* Two confounds a pairwise/listwise judge is prone to:                 */
/*   position bias — the slot a candidate sits in nudges its score      */
/*   length  bias — longer answers score higher regardless of quality   */
/* Each is a least-squares fit of score against the confound; a slope   */
/* far from 0 is the smell. Pure, no deps — just the closed-form OLS.   */
/* ------------------------------------------------------------------ */

/** A scored sample keyed by its slot index (0-based) in the comparison. */
export interface PositionSample {
  position: number;
  score: number;
}

/** A scored sample keyed by output length (chars, tokens — caller's unit). */
export interface LengthSample {
  length: number;
  score: number;
}

/** Result of a univariate OLS fit of `y` on `x`. */
export interface BiasFit {
  /** Least-squares slope: score change per unit of the confound. */
  slope: number;
  /** Number of samples the fit was computed over. */
  n: number;
}

/** A length fit also reports r² — how much of the variance length explains. */
export interface LengthBiasFit extends BiasFit {
  /** Coefficient of determination in [0, 1]; 0 when undefined. */
  r2: number;
}

/**
 * Least-squares slope of `y` on `x`: cov(x, y) / var(x). Returns 0 when
 * there are fewer than two points or `x` has no spread (a vertical fit is
 * undefined — no bias signal to report).
 */
function slopeOf(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = mean(xs);
  const meanY = mean(ys);
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = (xs[i] ?? 0) - meanX;
    sxx += dx * dx;
    sxy += dx * ((ys[i] ?? 0) - meanY);
  }
  if (sxx === 0) return 0;
  return sxy / sxx;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let sum = 0;
  for (const x of xs) sum += x;
  return sum / xs.length;
}

/**
 * Position bias: OLS slope of score against slot index. A non-trivial slope
 * means the judge favours (or penalises) a position irrespective of content.
 */
export function positionBias(samples: PositionSample[]): BiasFit {
  const xs = samples.map((s) => s.position);
  const ys = samples.map((s) => s.score);
  return { slope: slopeOf(xs, ys), n: samples.length };
}

/**
 * Length bias: OLS slope of score against output length, plus r². A positive
 * slope with high r² is the verbosity-rewards-itself failure mode. r² is the
 * squared Pearson correlation; it is 0 when either variable has no spread.
 */
export function lengthBias(samples: LengthSample[]): LengthBiasFit {
  const xs = samples.map((s) => s.length);
  const ys = samples.map((s) => s.score);
  const n = samples.length;
  const slope = slopeOf(xs, ys);
  return { slope, n, r2: rSquared(xs, ys) };
}

/**
 * Coefficient of determination for a univariate fit, computed as the squared
 * Pearson correlation. Returns 0 when n < 2 or either variable is constant.
 */
function rSquared(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = mean(xs);
  const meanY = mean(ys);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = (xs[i] ?? 0) - meanX;
    const dy = (ys[i] ?? 0) - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (sxx === 0 || syy === 0) return 0;
  const r = sxy / Math.sqrt(sxx * syy);
  return r * r;
}
