import { describe, expect, it } from "vitest";

import {
  buildConfusion,
  type CalibrationPair,
} from "@/lib/calibration/confusion";

describe("buildConfusion", () => {
  it("maps each judge/human pairing to the right cell", () => {
    const m = buildConfusion([
      { judge: "pass", human: "pass" }, // tp
      { judge: "pass", human: "fail" }, // fp
      { judge: "fail", human: "pass" }, // fn
      { judge: "fail", human: "fail" }, // tn
    ]);
    expect(m).toEqual({ tp: 1, fp: 1, fn: 1, tn: 1 });
  });

  it("returns an all-zero matrix for no pairs", () => {
    expect(buildConfusion([])).toEqual({ tp: 0, tn: 0, fp: 0, fn: 0 });
  });

  it("counts always sum to the number of pairs", () => {
    const pairs = [
      { judge: "pass", human: "pass" },
      { judge: "pass", human: "pass" },
      { judge: "fail", human: "fail" },
      { judge: "pass", human: "fail" },
    ] as const;
    const { tp, tn, fp, fn } = buildConfusion([...pairs]);
    expect(tp + tn + fp + fn).toBe(pairs.length);
    expect({ tp, tn, fp, fn }).toEqual({ tp: 2, tn: 1, fp: 1, fn: 0 });
  });

  it("reproduces the golden-set confusion counts", () => {
    const pairs: CalibrationPair[] = [
      ...rep({ judge: "pass", human: "pass" }, 198),
      ...rep({ judge: "fail", human: "fail" }, 216),
      ...rep({ judge: "pass", human: "fail" }, 4),
      ...rep({ judge: "fail", human: "pass" }, 2),
    ];
    expect(buildConfusion(pairs)).toEqual({ tp: 198, tn: 216, fp: 4, fn: 2 });
  });
});

function rep(value: CalibrationPair, times: number): CalibrationPair[] {
  return Array.from({ length: times }, () => value);
}
