/* ------------------------------------------------------------------ */
/* Confusion matrix — judge verdict vs. human ground truth.             */
/* Pure: a flat list of paired pass/fail calls in, four counts out.     */
/* "Positive" is a `pass` verdict, so the judge is the predictor and    */
/* the human is the reference label:                                    */
/*   TP = judge pass & human pass   (correctly let through)             */
/*   FP = judge pass & human fail   (false alarm — judge too lenient)   */
/*   FN = judge fail & human pass   (miss — judge too strict)           */
/*   TN = judge fail & human fail   (correctly rejected)                */
/* ------------------------------------------------------------------ */

/** One paired observation: the judge's call and the human's call. */
export interface CalibrationPair {
  judge: "pass" | "fail";
  human: "pass" | "fail";
}

/** The four confusion-matrix cells. They always sum to `pairs.length`. */
export interface ConfusionMatrix {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}

/**
 * Tally a confusion matrix from paired judge/human verdicts. Treats `pass`
 * as the positive class. Pure — iterates once, no allocation per cell.
 */
export function buildConfusion(pairs: CalibrationPair[]): ConfusionMatrix {
  const m: ConfusionMatrix = { tp: 0, tn: 0, fp: 0, fn: 0 };
  for (const { judge, human } of pairs) {
    if (judge === "pass" && human === "pass") m.tp += 1;
    else if (judge === "pass") m.fp += 1;
    else if (human === "pass") m.fn += 1;
    else m.tn += 1;
  }
  return m;
}
