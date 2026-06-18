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
  let getGateStatus: typeof import("@/lib/queries/gating").getGateStatus;
  let GATE_THRESHOLDS: typeof import("@/lib/queries/gating").GATE_THRESHOLDS;
  let rawDb: import("better-sqlite3").Database;

  beforeAll(async () => {
    dbDir = mkdtempSync(join(tmpdir(), "rubric-field-acc-"));
    process.env.RUBRIC_DB = join(dbDir, "test.db");

    // @/db reads RUBRIC_DB at module load — import only now.
    const { db } = await import("@/db");
    rawDb = db.$client;

    // Apply the generated migration DDL to the fresh temp DB.
    const { readFileSync } = await import("node:fs");
    const migration = readFileSync(
      join(process.cwd(), "db/migrations/0000_grey_rocket_racer.sql"),
      "utf8",
    );
    for (const stmt of migration.split("--> statement-breakpoint")) {
      const sql = stmt.trim();
      if (sql.length > 0) rawDb.exec(sql);
    }

    const gating = await import("@/lib/queries/gating");
    getGateStatus = gating.getGateStatus;
    GATE_THRESHOLDS = gating.GATE_THRESHOLDS;
  });

  afterAll(() => {
    rawDb.close();
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  /**
   * Seed one completed run whose field-accuracy scorer passes `pass` of
   * `total` cases, then return the gate's field-accuracy metric.
   */
  function seedRunAndGate(
    slug: string,
    pass: number,
    total: number,
  ): { runId: number } {
    const now = Math.floor(Date.now() / 1000);
    const suite = rawDb
      .prepare(
        "INSERT INTO suites (slug, title, repo, status, created_at, updated_at) VALUES (?,?,?,?,?,?) RETURNING id",
      )
      .get(slug, slug, "acme/repo", "passing", now, now) as { id: number };

    const pv = rawDb
      .prepare(
        "INSERT INTO prompt_versions (suite_id, label, body, created_at) VALUES (?,?,?,?) RETURNING id",
      )
      .get(suite.id, "v1", "you are a judge", now) as { id: number };

    const passRate = total > 0 ? pass / total : 0;
    const run = rawDb
      .prepare(
        `INSERT INTO runs (suite_id, prompt_version_id, sha, branch, trigger, status, total, pass_count, fail_count, pass_rate, started_at, finished_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
      )
      .get(
        suite.id,
        pv.id,
        "abc123",
        "main",
        "ci",
        "completed",
        total,
        pass,
        total - pass,
        passRate,
        now,
        now,
      ) as { id: number };

    const insertCase = rawDb.prepare(
      "INSERT INTO cases (run_id, case_id, input, expected, verdict, score) VALUES (?,?,?,?,?,?) RETURNING id",
    );
    const insertResult = rawDb.prepare(
      "INSERT INTO case_results (case_row_id, scorer_name, pass, score, errors) VALUES (?,?,?,?,?)",
    );

    for (let i = 0; i < total; i++) {
      const passes = i < pass;
      const c = insertCase.get(
        run.id,
        `c-${i}`,
        "{}",
        "{}",
        passes ? "pass" : "fail",
        passes ? 1 : 0,
      ) as { id: number };
      insertResult.run(
        c.id,
        "field-accuracy",
        passes ? 1 : 0,
        passes ? 1 : 0,
        "[]",
      );
    }

    return { runId: run.id };
  }

  it("mirrors the scorer default in GATE_THRESHOLDS", () => {
    expect(GATE_THRESHOLDS["field-accuracy"]).toBe(0.95);
  });

  it("passes the gate at exactly 0.95 (19/20 cases)", async () => {
    seedRunAndGate("gate-pass", 19, 20);
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
    seedRunAndGate("gate-fail", 18, 20);
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
