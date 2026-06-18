import { describe, expect, it } from "vitest";

import { lengthBias, positionBias } from "@/lib/calibration/bias";
import { round } from "@/lib/calibration/kappa";

describe("positionBias", () => {
  it("recovers a clean positive slope", () => {
    const fit = positionBias([
      { position: 0, score: 1 },
      { position: 1, score: 2 },
      { position: 2, score: 3 },
      { position: 3, score: 4 },
    ]);
    expect(fit.slope).toBe(1);
    expect(fit.n).toBe(4);
  });

  it("recovers a negative slope (later slots scored lower)", () => {
    const fit = positionBias([
      { position: 0, score: 5 },
      { position: 1, score: 3 },
      { position: 2, score: 1 },
    ]);
    expect(fit.slope).toBe(-2);
  });

  it("reports ~0 slope when score is independent of position", () => {
    const fit = positionBias([
      { position: 0, score: 3 },
      { position: 1, score: 3 },
      { position: 2, score: 3 },
    ]);
    expect(fit.slope).toBe(0);
  });

  it("returns a 0 slope for fewer than two samples", () => {
    expect(positionBias([{ position: 0, score: 9 }]).slope).toBe(0);
    expect(positionBias([]).slope).toBe(0);
  });
});

describe("lengthBias", () => {
  it("returns slope and r²=1 for a perfectly linear relation", () => {
    const fit = lengthBias([
      { length: 100, score: 1 },
      { length: 200, score: 2 },
      { length: 300, score: 3 },
    ]);
    expect(round(fit.slope, 3)).toBe(0.01);
    expect(fit.r2).toBe(1);
    expect(fit.n).toBe(3);
  });

  it("reports a low r² when length barely explains the score", () => {
    const fit = lengthBias([
      { length: 100, score: 3 },
      { length: 200, score: 1 },
      { length: 300, score: 4 },
      { length: 400, score: 2 },
    ]);
    expect(fit.r2).toBeLessThan(0.2);
    expect(fit.r2).toBeGreaterThanOrEqual(0);
  });

  it("returns r²=0 when length has no spread", () => {
    const fit = lengthBias([
      { length: 250, score: 1 },
      { length: 250, score: 5 },
    ]);
    expect(fit.slope).toBe(0);
    expect(fit.r2).toBe(0);
  });

  it("returns zeros for fewer than two samples", () => {
    const fit = lengthBias([{ length: 100, score: 1 }]);
    expect(fit).toEqual({ slope: 0, n: 1, r2: 0 });
  });
});
