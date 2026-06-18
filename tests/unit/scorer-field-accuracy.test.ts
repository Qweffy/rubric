import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { fieldAccuracy } from "@/lib/scorers/field-accuracy";
import { type ScorerContext } from "@/lib/scorers/types";
import { fieldAccuracyScorerSchema } from "@/lib/spec/schema";
import { type FieldAccuracyScorer } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* scorer/field-accuracy — the partial-credit by-path scorer.           */
/*                                                                      */
/* Two layers:                                                          */
/*  1. Pure scorer: matched/total ratio + the 0.95 threshold gate, the  */
/*     core "field accuracy" contract. No DB, no network, no clock.     */
/*  2. DB gate: the suite-level regression gate (getGateStatus) enforces */
/*     the SAME 0.95 field-accuracy threshold on a run's pass-rate. Run  */
/*     against a temp SQLite (RUBRIC_DB), migrated + minimally seeded.   */
/* ------------------------------------------------------------------ */

/** Specs are built through the real zod boundary so defaults match prod. */
function makeSpec(
  fields: string[],
  overrides: { threshold?: number; weight?: number; name?: string } = {},
): FieldAccuracyScorer {
  return fieldAccuracyScorerSchema.parse({
    type: "field-accuracy",
    name: overrides.name ?? "field-accuracy",
    fields,
    ...(overrides.threshold !== undefined
      ? { threshold: overrides.threshold }
      : {}),
    ...(overrides.weight !== undefined ? { weight: overrides.weight } : {}),
  });
}

const CTX: ScorerContext = { caseId: "case-1", suite: "settle-bill-review" };

describe("fieldAccuracy — matched/total ratio", () => {
  it("scores 1.0 and passes when every field matches", async () => {
    const scorer = fieldAccuracy(makeSpec(["total", "currency"]));
    const result = await scorer.score(
      { total: 85400, currency: "USD" },
      { total: 85400, currency: "USD" },
      CTX,
    );
    expect(result.score).toBe(1);
    expect(result.pass).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.detail).toBe("2/2 fields matched");
  });

  it("computes the exact matched/total ratio on a partial hit", async () => {
    // 3 of 4 fields match → 0.75.
    const scorer = fieldAccuracy(
      makeSpec(["a", "b", "c", "d"], { threshold: 0.95 }),
    );
    const result = await scorer.score(
      { a: 1, b: 2, c: 3, d: 999 },
      { a: 1, b: 2, c: 3, d: 4 },
      CTX,
    );
    expect(result.score).toBe(0.75);
    expect(result.pass).toBe(false);
    expect(result.detail).toBe("3/4 fields matched · d mismatch");
    expect(result.errors).toEqual(["$.d — mismatch"]);
  });

  it("scores 0.0 when nothing matches", async () => {
    const scorer = fieldAccuracy(makeSpec(["x", "y"]));
    const result = await scorer.score(
      { x: 1, y: 2 },
      { x: 9, y: 8 },
      CTX,
    );
    expect(result.score).toBe(0);
    expect(result.pass).toBe(false);
    expect(result.errors).toEqual(["$.x — mismatch", "$.y — mismatch"]);
  });

  it("resolves dotted paths and array indices on the actual blob", async () => {
    const scorer = fieldAccuracy(
      makeSpec(["extraction.total", "items.0.sku"]),
    );
    const result = await scorer.score(
      { extraction: { total: 85400 }, items: [{ sku: "A-1" }] },
      { "extraction.total": 85400, "items.0.sku": "A-1" },
      CTX,
    );
    expect(result.score).toBe(1);
    expect(result.pass).toBe(true);
  });

  it("counts a field absent on the actual blob as a miss", async () => {
    const scorer = fieldAccuracy(makeSpec(["present", "missing"]));
    const result = await scorer.score(
      { present: true },
      { present: true, missing: "x" },
      CTX,
    );
    expect(result.score).toBe(0.5);
    expect(result.detail).toBe("1/2 fields matched · missing absent");
    expect(result.errors).toEqual(["$.missing — absent"]);
  });

  it("counts a field with no expected value as a config miss", async () => {
    // "ghost" has no entry in the expect slice → nothing to match against.
    const scorer = fieldAccuracy(makeSpec(["real", "ghost"]));
    const result = await scorer.score(
      { real: 1, ghost: 2 },
      { real: 1 },
      CTX,
    );
    expect(result.score).toBe(0.5);
    expect(result.detail).toBe("1/2 fields matched · ghost missing in fixture");
    expect(result.errors).toEqual(["$.ghost — no expected value in fixture"]);
  });

  it("matches structurally via deepEqual, not by reference", async () => {
    const scorer = fieldAccuracy(makeSpec(["lineItems"]));
    const result = await scorer.score(
      { lineItems: [{ sku: "A", qty: 2 }] },
      { lineItems: [{ qty: 2, sku: "A" }] }, // key order differs
      CTX,
    );
    expect(result.score).toBe(1);
    expect(result.pass).toBe(true);
  });

  it("passes the scorer name and weight through from the spec", () => {
    const scorer = fieldAccuracy(
      makeSpec(["a"], { name: "extraction-fields", weight: 3 }),
    );
    expect(scorer.name).toBe("extraction-fields");
    expect(scorer.weight).toBe(3);
  });
});

describe("fieldAccuracy — 0.95 threshold gate", () => {
  it("defaults the threshold to 0.95 via the schema", () => {
    expect(makeSpec(["a"]).threshold).toBe(0.95);
  });

  it("fails just under the gate: 19/20 = 0.95 passes, 18/20 = 0.90 fails", async () => {
    const fields = Array.from({ length: 20 }, (_, i) => `f${i}`);
    const scorer = fieldAccuracy(makeSpec(fields)); // threshold 0.95

    // Expected has all 20; actual matches a configurable count.
    const expected = Object.fromEntries(fields.map((f) => [f, f]));
    const actualWith = (matches: number): Record<string, string> =>
      Object.fromEntries(
        fields.map((f, i) => [f, i < matches ? f : "WRONG"]),
      );

    const exact = await scorer.score(actualWith(19), expected, CTX);
    expect(exact.score).toBe(0.95);
    expect(exact.pass).toBe(true); // score >= threshold

    const below = await scorer.score(actualWith(18), expected, CTX);
    expect(below.score).toBe(0.9);
    expect(below.pass).toBe(false);
  });

  it("respects a custom threshold override", async () => {
    const scorer = fieldAccuracy(
      makeSpec(["a", "b"], { threshold: 0.5 }),
    );
    // 1/2 = 0.5, which clears the lowered gate.
    const result = await scorer.score(
      { a: 1, b: 0 },
      { a: 1, b: 2 },
      CTX,
    );
    expect(result.score).toBe(0.5);
    expect(result.pass).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* DB-backed gate — the suite regression gate reuses the 0.95 field-    */
/* accuracy threshold against a run's per-scorer pass-rate (matched     */
/* cases / total cases). Temp SQLite, migrated DDL, minimal seed.       */
/* ------------------------------------------------------------------ */

describe("getGateStatus — 0.95 field-accuracy gate over a run", () => {
  let dbDir: string;
  // Imported dynamically AFTER RUBRIC_DB is set so @/db opens the temp file.
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let getGateStatus: typeof import("@/lib/queries/gating").getGateStatus;
  let GATE_THRESHOLDS: typeof import("@/lib/queries/gating").GATE_THRESHOLDS;

  beforeAll(async () => {
    dbDir = mkdtempSync(join(tmpdir(), "rubric-field-acc-"));
    process.env.RUBRIC_DB = join(dbDir, "test.db");

    // @/db reads RUBRIC_DB at module load — import only now.
    const dbMod = await import("@/db");
    db = dbMod.db;
    schema = await import("@/db/schema");

    // Materialize the schema by running the committed migrations.
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: join(process.cwd(), "db", "migrations") });

    const gating = await import("@/lib/queries/gating");
    getGateStatus = gating.getGateStatus;
    GATE_THRESHOLDS = gating.GATE_THRESHOLDS;
  });

  afterAll(() => {
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  /**
   * Seed one completed run whose field-accuracy scorer passes `pass` of
   * `total` cases, then return the gate's field-accuracy metric. Writes go
   * through the drizzle query builder (async on libSQL).
   */
  async function seedRunAndGate(
    slug: string,
    pass: number,
    total: number,
  ): Promise<{ runId: number }> {
    const now = new Date();
    const [suite] = await db
      .insert(schema.suites)
      .values({ slug, title: slug, repo: "acme/repo", status: "passing", createdAt: now, updatedAt: now })
      .returning({ id: schema.suites.id });
    if (suite === undefined) throw new Error("seed: suite insert returned nothing");

    const [pv] = await db
      .insert(schema.promptVersions)
      .values({ suiteId: suite.id, label: "v1", body: "you are a judge", createdAt: now })
      .returning({ id: schema.promptVersions.id });
    if (pv === undefined) throw new Error("seed: prompt version insert returned nothing");

    const passRate = total > 0 ? pass / total : 0;
    const [run] = await db
      .insert(schema.runs)
      .values({
        suiteId: suite.id,
        promptVersionId: pv.id,
        sha: "abc123",
        branch: "main",
        trigger: "ci",
        status: "completed",
        total,
        passCount: pass,
        failCount: total - pass,
        passRate,
        startedAt: now,
        finishedAt: now,
      })
      .returning({ id: schema.runs.id });
    if (run === undefined) throw new Error("seed: run insert returned nothing");

    for (let i = 0; i < total; i++) {
      const passes = i < pass;
      const [c] = await db
        .insert(schema.cases)
        .values({
          runId: run.id,
          caseId: `c-${i}`,
          input: {},
          expected: {},
          verdict: passes ? "pass" : "fail",
          score: passes ? 1 : 0,
        })
        .returning({ id: schema.cases.id });
      if (c === undefined) throw new Error("seed: case insert returned nothing");
      await db.insert(schema.caseResults).values({
        caseRowId: c.id,
        scorerName: "field-accuracy",
        pass: passes,
        score: passes ? 1 : 0,
        errors: [],
      });
    }

    return { runId: run.id };
  }

  it("mirrors the scorer default in GATE_THRESHOLDS", () => {
    expect(GATE_THRESHOLDS["field-accuracy"]).toBe(0.95);
  });

  it("passes the gate at exactly 0.95 (19/20 cases)", async () => {
    await seedRunAndGate("gate-pass", 19, 20);
    const status = await getGateStatus();
    const gate = status.gates.find((g) => g.suiteSlug === "gate-pass");
    expect(gate).toBeDefined();
    const metric = gate?.metrics.find((m) => m.metric === "field-accuracy");
    expect(metric).toBeDefined();
    expect(metric?.value).toBe(0.95);
    expect(metric?.threshold).toBe(0.95);
    expect(metric?.status).toBe("pass");
    expect(gate?.passing).toBe(true);
  });

  it("trips the gate just below 0.95 (18/20 cases)", async () => {
    await seedRunAndGate("gate-fail", 18, 20);
    const status = await getGateStatus();
    const gate = status.gates.find((g) => g.suiteSlug === "gate-fail");
    expect(gate).toBeDefined();
    const metric = gate?.metrics.find((m) => m.metric === "field-accuracy");
    expect(metric?.value).toBe(0.9);
    expect(metric?.status).toBe("fail");
    expect(metric?.margin).toBeCloseTo(-0.05, 10);
    expect(gate?.passing).toBe(false);
    expect(status.allPassing).toBe(false);
    expect(status.blockingCount).toBeGreaterThanOrEqual(1);
  });
});
