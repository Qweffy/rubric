import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  buildConfusion,
  type CalibrationPair,
  type ConfusionMatrix,
} from "@/lib/calibration/confusion";
import { agreement, cohensKappa, round } from "@/lib/calibration/kappa";

/* ------------------------------------------------------------------ */
/* Golden-set inter-rater agreement: judge vs. human ground truth.      */
/*                                                                      */
/* Counts: TP 198 / TN 216 / FP 4 / FN 2  (n = 420).                    */
/*                                                                      */
/* Raw agreement  = (198 + 216) / 420 = 0.985714…  → 0.986 at 3dp.      */
/* Cohen's κ with the standard marginal formula:                        */
/*   pe = ((tp+fp)(tp+fn) + (fn+tn)(fp+tn)) / n² = 0.50090…             */
/*   κ  = (po - pe) / (1 - pe)                    = 0.97137…  → 0.97.    */
/*                                                                      */
/* Reconciliation note: a κ near 0.81 is NOT achievable from these      */
/* near-balanced counts — it would need a heavily imbalanced matrix     */
/* (pe ≈ 0.92). The real `cohensKappa` returns 0.97 here, so that is    */
/* what we assert. These tests pin the value the textbook formula —     */
/* and the shipped code — actually produce.                             */
/* ------------------------------------------------------------------ */
const GOLDEN: ConfusionMatrix = { tp: 198, tn: 216, fp: 4, fn: 2 } as const;
const GOLDEN_N = 420;

function rep(value: CalibrationPair, times: number): CalibrationPair[] {
  return Array.from({ length: times }, () => value);
}

/** The golden set rebuilt from explicit paired verdicts, not hand-tallied. */
function goldenPairs(): CalibrationPair[] {
  return [
    ...rep({ judge: "pass", human: "pass" }, GOLDEN.tp),
    ...rep({ judge: "fail", human: "fail" }, GOLDEN.tn),
    ...rep({ judge: "pass", human: "fail" }, GOLDEN.fp),
    ...rep({ judge: "fail", human: "pass" }, GOLDEN.fn),
  ];
}

describe("agreement", () => {
  it("is the raw fraction of matching calls on the golden set", () => {
    expect(round(agreement(GOLDEN), 3)).toBe(0.986);
    expect(round(agreement(GOLDEN))).toBe(0.99);
    expect(agreement(GOLDEN)).toBeCloseTo(414 / 420, 12);
  });

  it("is 1 for a perfectly diagonal matrix", () => {
    expect(agreement({ tp: 5, tn: 5, fp: 0, fn: 0 })).toBe(1);
  });

  it("is 0 for an empty matrix", () => {
    expect(agreement({ tp: 0, tn: 0, fp: 0, fn: 0 })).toBe(0);
  });

  it("equals (tp + tn) / n", () => {
    const m: ConfusionMatrix = { tp: 7, tn: 3, fp: 5, fn: 5 };
    expect(agreement(m)).toBe(10 / 20);
  });
});

describe("cohensKappa", () => {
  it("matches the standard formula on the golden set", () => {
    // po = 0.985714…, pe = 0.500907…, κ = 0.971376… → 0.97 at 2dp.
    expect(round(cohensKappa(GOLDEN))).toBe(0.97);
    expect(cohensKappa(GOLDEN)).toBeCloseTo(0.9713766, 6);
  });

  it("stays well clear of 0.81 for this balanced matrix", () => {
    // Guards the reconciliation note: the balanced golden counts cannot
    // produce κ ≈ 0.81 — that target needs a heavily imbalanced matrix.
    expect(round(cohensKappa(GOLDEN))).not.toBe(0.81);
    expect(cohensKappa(GOLDEN)).toBeGreaterThan(0.81);
  });

  it("does drop near 0.81 once the matrix is heavily imbalanced", () => {
    // Same n (420), same FP/FN cells, same raw agreement (414/420) as GOLDEN,
    // but the TP/TN split is skewed so pe climbs to ≈0.90. κ ≈ 0.8051 → 0.81.
    // This shows the 0.81 figure is a property of the marginals, not the code.
    const skewed: ConfusionMatrix = { tp: 401, tn: 13, fp: 4, fn: 2 };
    expect(agreement(skewed)).toBeCloseTo(agreement(GOLDEN), 12);
    expect(round(cohensKappa(skewed))).toBe(0.81);
  });

  it("is 1 when the raters agree perfectly and the classes are mixed", () => {
    expect(cohensKappa({ tp: 10, tn: 10, fp: 0, fn: 0 })).toBe(1);
  });

  it("is 0 at chance-level agreement (independent raters)", () => {
    // Each cell equals the product of its marginals → κ = 0.
    expect(cohensKappa({ tp: 25, tn: 25, fp: 25, fn: 25 })).toBe(0);
  });

  it("goes negative below chance", () => {
    expect(cohensKappa({ tp: 0, tn: 0, fp: 10, fn: 10 })).toBeLessThan(0);
  });

  it("returns 1 in the degenerate all-pass case (pe = 1, po = 1)", () => {
    expect(cohensKappa({ tp: 10, tn: 0, fp: 0, fn: 0 })).toBe(1);
  });

  it("returns 0 for an empty matrix", () => {
    expect(cohensKappa({ tp: 0, tn: 0, fp: 0, fn: 0 })).toBe(0);
  });
});

describe("round", () => {
  it("rounds to 2dp by default and honours the digits arg", () => {
    expect(round(0.985714)).toBe(0.99);
    expect(round(0.985714, 3)).toBe(0.986);
    expect(round(0.9713766)).toBe(0.97);
  });

  it("lets NaN pass through", () => {
    expect(Number.isNaN(round(NaN))).toBe(true);
  });
});

describe("buildConfusion → kappa pipeline (golden set)", () => {
  it("tallies the golden counts and derives the agreement metrics", () => {
    const m = buildConfusion(goldenPairs());
    expect(m).toEqual(GOLDEN);
    expect(m.tp + m.tn + m.fp + m.fn).toBe(GOLDEN_N);
    expect(round(agreement(m), 3)).toBe(0.986);
    expect(round(cohensKappa(m))).toBe(0.97);
  });
});

/* ------------------------------------------------------------------ */
/* DB round-trip: persist the golden calibration through the real       */
/* drizzle store and read it back via the real `getCalibration` query.  */
/* RUBRIC_DB is pointed at a throwaway file BEFORE @/db is imported, so  */
/* the singleton opens against the tmp database. No network, no key.     */
/* ------------------------------------------------------------------ */
describe("getCalibration (tmp SQLite, real query)", () => {
  let dir: string;
  let dbPath: string;
  // Resolved after the dynamic import so @/db binds to the tmp file.
  let getCalibration: (
    name: string,
  ) => Promise<{
    kappa: number | null;
    agreement: number | null;
    confusion: ConfusionMatrix | null;
    n: number | null;
  } | null>;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "rubric-kappa-"));
    dbPath = join(dir, "test.db");
    process.env.RUBRIC_DB = dbPath;

    // Import only after RUBRIC_DB is set: db/index.ts opens the connection at
    // module-load time, so these dynamic imports must come first-touch here.
    const { db } = await import("@/db");
    const schema = await import("@/db/schema");
    const queries = await import("@/lib/queries/calibration");
    getCalibration = queries.getCalibration;

    // Create the tables directly from the drizzle schema's SQL. We pull the
    // underlying better-sqlite3 handle and exec the same DDL drizzle-kit emits.
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    migrate(db, { migrationsFolder: "db/migrations" });

    const now = new Date("2026-06-17T00:00:00Z");

    const [suite] = await db
      .insert(schema.suites)
      .values({
        slug: "golden",
        title: "Golden set",
        repo: "rubric",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!suite) throw new Error("suite insert returned no row");

    const [judge] = await db
      .insert(schema.judges)
      .values({
        name: "golden-judge",
        provider: "recorded",
        kappa: round(cohensKappa(GOLDEN)),
        agreement: round(agreement(GOLDEN), 3),
        falsePass: GOLDEN.fp,
        falseFail: GOLDEN.fn,
        status: "aligned",
        isDefault: true,
        createdAt: now,
      })
      .returning();
    if (!judge) throw new Error("judge insert returned no row");

    await db.insert(schema.calibrationRuns).values({
      suiteId: suite.id,
      judgeId: judge.id,
      n: GOLDEN_N,
      tp: GOLDEN.tp,
      tn: GOLDEN.tn,
      fp: GOLDEN.fp,
      fn: GOLDEN.fn,
      kappa: round(cohensKappa(GOLDEN)),
      agreement: round(agreement(GOLDEN), 3),
      createdAt: now,
    });
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  it("reads back the persisted golden confusion matrix and metrics", async () => {
    const cal = await getCalibration("golden-judge");
    expect(cal).not.toBeNull();
    if (!cal) return; // narrow for TS; the assertion above already failed if null
    expect(cal.n).toBe(GOLDEN_N);
    expect(cal.confusion).toEqual(GOLDEN);
    expect(cal.agreement).toBe(0.986);
    expect(cal.kappa).toBe(0.97);
  });

  it("returns null for an unknown judge", async () => {
    expect(await getCalibration("no-such-judge")).toBeNull();
  });
});
