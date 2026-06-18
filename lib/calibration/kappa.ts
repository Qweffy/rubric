/* ------------------------------------------------------------------ */
/* Inter-rater agreement between the judge and the human ground truth.  */
/* Two scalars off one confusion matrix:                                */
/*   agreement = raw fraction of cases both raters called the same way  */
/*   cohensKappa = agreement corrected for chance (Cohen's κ)           */
/* Pure, no deps. κ rewards agreement that beats what the marginal      */
/* rates would produce by chance: κ=1 perfect, κ=0 chance-level, κ<0    */
/* worse than chance.                                                   */
/* ------------------------------------------------------------------ */

import { type ConfusionMatrix } from "@/lib/calibration/confusion";

/** Round to `digits` decimal places (default 2). Pure, NaN passes through. */
export function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Total observations in the matrix. */
function total({ tp, tn, fp, fn }: ConfusionMatrix): number {
  return tp + tn + fp + fn;
}

/**
 * Raw observed agreement: the fraction of cases the two raters called the
 * same way, (TP + TN) / n. Returns 0 for an empty matrix.
 */
export function agreement(m: ConfusionMatrix): number {
  const n = total(m);
  if (n === 0) return 0;
  return (m.tp + m.tn) / n;
}

/**
 * Cohen's κ — chance-corrected agreement.
 *
 *   po = (tp + tn) / n                         observed agreement
 *   pe = ((tp+fp)(tp+fn) + (fn+tn)(fp+tn)) / n²  expected by chance
 *   κ  = (po - pe) / (1 - pe)
 *
 * The marginals: rows are the judge (pass = tp+fp, fail = fn+tn), columns
 * are the human (pass = tp+fn, fail = fp+tn). When raters agree perfectly
 * by chance (pe = 1) κ is undefined; we return 1 if they also agree
 * observed (po = 1), else 0. Empty matrix returns 0.
 */
export function cohensKappa(m: ConfusionMatrix): number {
  const n = total(m);
  if (n === 0) return 0;
  const { tp, tn, fp, fn } = m;
  const po = (tp + tn) / n;
  const pe = ((tp + fp) * (tp + fn) + (fn + tn) * (fp + tn)) / (n * n);
  if (pe === 1) return po === 1 ? 1 : 0;
  return (po - pe) / (1 - pe);
}
