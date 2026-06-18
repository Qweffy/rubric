import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { lengthBias, positionBias } from "@/lib/calibration/bias";

/* ------------------------------------------------------------------ */
/* bias.ts — least-squares slope of judge score against a confound.     */
/*                                                                      */
/* Two halves:                                                          */
/*   1. The pure OLS math on known samples — slope/n/r² are checked     */
/*      against hand-computed values, so a regression in the closed-    */
/*      form fit is caught deterministically.                           */
/*   2. The DB round-trip — a computed slope is persisted via the real  */
/*      store writer and read back through the real query layer, on a   */
/*      throwaway SQLite file. No network, no API key.                  */
/*                                                                      */
/* The DB half uses a dynamic import: db/index.ts reads RUBRIC_DB at    */
/* module load to choose the SQLite file, so the env var must be set    */
/* BEFORE @/db (or anything that pulls it in) is first imported.        */
/* ------------------------------------------------------------------ */

describe("positionBias (OLS slope on known samples)", () => {
  it("recovers an exact +1 slope from a clean ramp", () => {
    // score = position + 1 → slope is exactly 1, n is the sample count.
    const fit = positionBias([
      { position: 0, score: 1 },
      { position: 1, score: 2 },
      { position: 2, score: 3 },
      { position: 3, score: 4 },
    ]);
    expect(fit.slope).toBe(1);
    expect(fit.n).toBe(4);
  });

  it("recovers a negative slope (a later-slot penalty)", () => {
    // score = 5 - 2*position → cov/var = -2.
    const fit = positionBias([
      { position: 0, score: 5 },
      { position: 1, score: 3 },
      { position: 2, score: 1 },
    ]);
    expect(fit.slope).toBe(-2);
    expect(fit.n).toBe(3);
  });

  it("reports a flat slope when score is independent of position", () => {
    const fit = positionBias([
      { position: 0, score: 3 },
      { position: 1, score: 3 },
      { position: 2, score: 3 },
    ]);
    expect(fit.slope).toBe(0);
  });

  it("matches the textbook cov/var slope on a non-trivial cloud", () => {
    // Hand-computed: x̄=2, ȳ=4. Sxy = Σ(x-x̄)(y-ȳ), Sxx = Σ(x-x̄)².
    // points: (0,2)(1,5)(2,3)(3,4)(4,6) → Sxy=7, Sxx=10 → slope 0.7.
    const fit = positionBias([
      { position: 0, score: 2 },
      { position: 1, score: 5 },
      { position: 2, score: 3 },
      { position: 3, score: 4 },
      { position: 4, score: 6 },
    ]);
    expect(fit.slope).toBeCloseTo(0.7, 10);
    expect(fit.n).toBe(5);
  });

  it("returns a 0 slope when x has no spread (vertical fit is undefined)", () => {
    const fit = positionBias([
      { position: 2, score: 1 },
      { position: 2, score: 9 },
    ]);
    expect(fit.slope).toBe(0);
  });

  it("returns a 0 slope for fewer than two samples", () => {
    expect(positionBias([{ position: 0, score: 9 }]).slope).toBe(0);
    expect(positionBias([]).slope).toBe(0);
    expect(positionBias([]).n).toBe(0);
  });
});

describe("lengthBias (slope + r² on known samples)", () => {
  it("returns the per-char slope and r²=1 for a perfectly linear relation", () => {
    // score = length / 100 → slope 0.01, length explains all the variance.
    const fit = lengthBias([
      { length: 100, score: 1 },
      { length: 200, score: 2 },
      { length: 300, score: 3 },
    ]);
    expect(fit.slope).toBeCloseTo(0.01, 12);
    expect(fit.r2).toBe(1);
    expect(fit.n).toBe(3);
  });

  it("reports r²=1 for a perfect negative relation too", () => {
    const fit = lengthBias([
      { length: 100, score: 4 },
      { length: 200, score: 3 },
      { length: 300, score: 2 },
      { length: 400, score: 1 },
    ]);
    expect(fit.slope).toBeLessThan(0);
    expect(fit.r2).toBeCloseTo(1, 12);
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

  it("returns slope 0 and r²=0 when length has no spread", () => {
    const fit = lengthBias([
      { length: 250, score: 1 },
      { length: 250, score: 5 },
    ]);
    expect(fit.slope).toBe(0);
    expect(fit.r2).toBe(0);
  });

  it("returns zeros for fewer than two samples", () => {
    expect(lengthBias([{ length: 100, score: 1 }])).toEqual({
      slope: 0,
      n: 1,
      r2: 0,
    });
  });
});

/* ------------------------------------------------------------------ */
/* DB round-trip: compute → persist → read, on a throwaway SQLite file. */
/* ------------------------------------------------------------------ */

// Loaded lazily after RUBRIC_DB is set, to honour the load-time DB binding.
type DbModule = typeof import("@/db");
type SchemaModule = typeof import("@/db/schema");
type StoreModule = typeof import("@/lib/store");
type CalibrationQueries = typeof import("@/lib/queries/calibration");

describe("bias persists and round-trips through the real DB layer", () => {
  let tmpDir: string;
  let db: DbModule["db"];
  let schema: SchemaModule;
  let store: StoreModule;
  let queries: CalibrationQueries;
  let suiteId: number;

  beforeAll(async () => {
    // 1. Point the (not-yet-imported) DB client at a throwaway file.
    tmpDir = mkdtempSync(join(tmpdir(), "rubric-bias-"));
    process.env.RUBRIC_DB = join(tmpDir, "bias-test.db");

    // 2. NOW import @/db — its module-load reads the env var we just set.
    const dbMod = await import("@/db");
    db = dbMod.db;
    schema = await import("@/db/schema");
    store = await import("@/lib/store");
    queries = await import("@/lib/queries/calibration");

    // 3. Materialize the schema by running the committed migrations.
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./db/migrations" });

    // 4. Seed a single suite to satisfy the calibration_runs FK.
    const now = new Date();
    const inserted = await db
      .insert(schema.suites)
      .values({
        slug: "bias-suite",
        title: "Bias suite",
        repo: "acme/bias",
        status: "passing",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.suites.id })
      .get();
    suiteId = inserted.id;
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("denormalizes a computed length-bias slope onto the judge and reads it back", async () => {
    // The length slope a calibration pass would have measured, computed by the
    // very function under test from a known, perfectly-linear sample.
    const fit = lengthBias([
      { length: 100, score: 1 },
      { length: 200, score: 2 },
      { length: 300, score: 3 },
    ]);
    expect(fit.slope).toBeCloseTo(0.01, 12);

    const judge = await store.upsertJudge({
      name: "length-biased-judge",
      provider: "recorded",
      isDefault: true,
    });

    await store.persistCalibrationRun({
      suiteId,
      judgeId: judge.id,
      n: fit.n,
      tp: 2,
      tn: 1,
      fp: 0,
      fn: 0,
      kappa: 1,
      agreement: 1,
      posBias: 0,
      lengthBias: fit.slope,
      lengthR2: fit.r2,
      judgeStatus: "biased",
    });

    // Read through the real query layer, not a hand-rolled select.
    const cal = await queries.getCalibration("length-biased-judge");
    expect(cal).not.toBeNull();
    expect(cal?.bias.lengthBias).toBeCloseTo(0.01, 12);
    expect(cal?.bias.lengthR2).toBe(1);
    expect(cal?.bias.posBias).toBe(0);
    expect(cal?.n).toBe(3);

    // The model-comparison board reads the denormalized snapshot off judges.
    const board = await queries.getModelComparison();
    const row = board.find((r) => r.judgeName === "length-biased-judge");
    expect(row).toBeDefined();
    expect(row?.lengthBias).toBeCloseTo(0.01, 12);
  });

  it("persists a negative position-bias slope without sign loss", async () => {
    const fit = positionBias([
      { position: 0, score: 5 },
      { position: 1, score: 3 },
      { position: 2, score: 1 },
    ]);
    expect(fit.slope).toBe(-2);

    const judge = await store.upsertJudge({
      name: "position-biased-judge",
      provider: "recorded",
    });

    await store.persistCalibrationRun({
      suiteId,
      judgeId: judge.id,
      n: fit.n,
      tp: 1,
      tn: 1,
      fp: 1,
      fn: 0,
      kappa: 0.4,
      agreement: 0.7,
      posBias: fit.slope,
      lengthBias: 0,
      lengthR2: 0,
      judgeStatus: "biased",
    });

    const cal = await queries.getCalibration("position-biased-judge");
    expect(cal?.bias.posBias).toBe(-2);
  });

  it("reports null biases for a judge that was never calibrated", async () => {
    await store.upsertJudge({ name: "uncalibrated-judge", provider: "recorded" });

    const cal = await queries.getCalibration("uncalibrated-judge");
    expect(cal).not.toBeNull();
    expect(cal?.bias).toEqual({
      posBias: null,
      lengthBias: null,
      lengthR2: null,
    });
    expect(cal?.n).toBeNull();
  });
});
