import { describe, expect, it } from "vitest";

import { agreement, cohensKappa, round } from "@/lib/calibration/kappa";

/**
 * Golden-set matrix: TP 198 / TN 216 / FP 4 / FN 2 (n = 420).
 *
 * Reconciliation note. Raw agreement is (198 + 216) / 420 = 0.98571…, i.e.
 * 0.99 at 2dp and 0.986 at 3dp. Cohen's κ with the standard marginal formula
 *   pe = ((tp+fp)(tp+fn) + (fn+tn)(fp+tn)) / n²  = 0.5009…
 *   κ  = (0.98571… - 0.5009…) / (1 - 0.5009…)    = 0.9714…
 * yields κ ≈ 0.97 for this (near-balanced) matrix. A κ near 0.81 would
 * require a heavily imbalanced matrix (pe ≈ 0.92), not these counts — so we
 * assert the value the textbook formula actually produces.
 */
const GOLDEN = { tp: 198, tn: 216, fp: 4, fn: 2 } as const;

describe("agreement", () => {
  it("is the raw fraction of matching calls", () => {
    expect(round(agreement(GOLDEN), 3)).toBe(0.986);
    expect(round(agreement(GOLDEN))).toBe(0.99);
  });

  it("is 1 for a perfectly diagonal matrix", () => {
    expect(agreement({ tp: 5, tn: 5, fp: 0, fn: 0 })).toBe(1);
  });

  it("is 0 for an empty matrix", () => {
    expect(agreement({ tp: 0, tn: 0, fp: 0, fn: 0 })).toBe(0);
  });
});

describe("cohensKappa", () => {
  it("matches the standard formula on the golden set", () => {
    expect(round(cohensKappa(GOLDEN))).toBe(0.97);
  });

  it("is 1 when the raters agree perfectly and the classes are mixed", () => {
    expect(cohensKappa({ tp: 10, tn: 10, fp: 0, fn: 0 })).toBe(1);
  });

  it("is 0 at chance-level agreement", () => {
    // Independent raters: each cell equals the product of its marginals.
    expect(cohensKappa({ tp: 25, tn: 25, fp: 25, fn: 25 })).toBe(0);
  });

  it("goes negative below chance", () => {
    expect(cohensKappa({ tp: 0, tn: 0, fp: 10, fn: 10 })).toBeLessThan(0);
  });

  it("returns 1 when both raters always say pass (degenerate, pe = 1)", () => {
    expect(cohensKappa({ tp: 10, tn: 0, fp: 0, fn: 0 })).toBe(1);
  });

  it("returns 0 for an empty matrix", () => {
    expect(cohensKappa({ tp: 0, tn: 0, fp: 0, fn: 0 })).toBe(0);
  });
});

describe("round", () => {
  it("rounds to 2dp by default and honours the digits arg", () => {
    expect(round(0.98571)).toBe(0.99);
    expect(round(0.98571, 3)).toBe(0.986);
    expect(round(0.9713766)).toBe(0.97);
  });
});
