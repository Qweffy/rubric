import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  type BaselineMap,
  type CaseInput,
  type CaseOutcome,
  exitCode,
  type Gate,
  scoreCase,
  summarizeRun,
} from "@/lib/scorers/aggregate";
import { type Scorer, type ScoreResult } from "@/lib/scorers/types";

/**
 * Aggregation is the heart of the gate: it folds scorer verdicts into a case
 * verdict, cases into a run pass-rate, detects per-scorer flips vs a baseline,
 * and maps the whole run to a process exit code. These cases pin the
 * load-bearing folds — case verdict, run pass-rate, skip handling, flips, and
 * exit 0/1 — plus the DB-backed gate (getGateStatus) against a temp SQLite file.
 */

/* ------------------------------------------------------------------ */
/* Test scorer factory — a deterministic scorer with a fixed verdict.   */
/* ------------------------------------------------------------------ */

function fixedScorer(
  name: string,
  pass: boolean,
  score: number,
  weight = 1,
): Scorer {
  const result: ScoreResult = {
    pass,
    score,
    detail: pass ? "ok" : "mismatch",
    errors: pass ? [] : [`${name} failed`],
  };
  return {
    name,
    weight,
    score: () => Promise.resolve(result),
  };
}

const ctx = { caseId: "c1", suite: "demo" };

function input(overrides: Partial<CaseInput> = {}): CaseInput {
  return { ctx, actual: {}, expect: {}, ...overrides };
}

describe("scoreCase — case verdict", () => {
  it("passes a case only when every non-skipped scorer passes", async () => {
    const out = await scoreCase(
      [fixedScorer("a", true, 1), fixedScorer("b", true, 1)],
      input(),
    );
    expect(out.verdict).toBe("pass");
  });

  it("fails the case when any scorer fails", async () => {
    const out = await scoreCase(
      [fixedScorer("a", true, 1), fixedScorer("b", false, 0)],
      input(),
    );
    expect(out.verdict).toBe("fail");
  });

  it("passes vacuously when there are no scorers", async () => {
    const out = await scoreCase([], input());
    expect(out.verdict).toBe("pass");
    expect(out.outcomes).toEqual([]);
  });

  it("computes the case score as a weight-weighted mean", async () => {
    // weights 3 and 1, scores 1.0 and 0.0 → (3*1 + 1*0) / 4 = 0.75
    const out = await scoreCase(
      [fixedScorer("a", true, 1, 3), fixedScorer("b", false, 0, 1)],
      input(),
    );
    expect(out.score).toBeCloseTo(0.75, 5);
    expect(out.verdict).toBe("fail");
  });

  it("clamps a negative weight to zero in the mean", async () => {
    // negative weight is dropped → score is the positive-weight scorer alone.
    const out = await scoreCase(
      [fixedScorer("a", true, 1, 2), fixedScorer("b", true, 0, -5)],
      input(),
    );
    expect(out.score).toBeCloseTo(1, 5);
  });

  it("carries the case id from the context", async () => {
    const out = await scoreCase([fixedScorer("a", true, 1)], input());
    expect(out.caseId).toBe("c1");
  });
});

describe("scoreCase — skip", () => {
  it("skips the whole case when the precondition is unmet, running no scorer", async () => {
    let ran = false;
    const spy: Scorer = {
      name: "spy",
      weight: 1,
      score: () => {
        ran = true;
        return Promise.resolve(fixedResult);
      },
    };
    const out = await scoreCase([spy], input({ preconditionMet: false }));
    expect(out.verdict).toBe("skipped");
    expect(out.score).toBe(0);
    expect(ran).toBe(false);
    expect(out.outcomes.every((o) => o.skipped)).toBe(true);
  });

  it("runs the scorers when the precondition is met or absent", async () => {
    const met = await scoreCase(
      [fixedScorer("a", true, 1)],
      input({ preconditionMet: true }),
    );
    const absent = await scoreCase([fixedScorer("a", true, 1)], input());
    expect(met.verdict).toBe("pass");
    expect(absent.verdict).toBe("pass");
  });
});

const fixedResult: ScoreResult = {
  pass: true,
  score: 1,
  detail: "ok",
  errors: [],
};

/* ------------------------------ run level ------------------------------ */

// Build a CaseOutcome directly so run-level folds don't depend on scoreCase.
function caseOutcome(
  caseId: string,
  verdict: CaseOutcome["verdict"],
  outcomes: { name: string; pass: boolean; skipped?: boolean }[],
): CaseOutcome {
  return {
    caseId,
    verdict,
    score: 0,
    outcomes: outcomes.map((o) => ({
      name: o.name,
      weight: 1,
      skipped: o.skipped ?? false,
      result: {
        pass: o.pass,
        score: o.pass ? 1 : 0,
        detail: o.pass ? "ok" : "no",
        errors: [],
      },
    })),
  };
}

describe("summarizeRun — pass-rate", () => {
  it("counts pass/fail/skipped and computes pass-rate over scored cases only", () => {
    const summary = summarizeRun([
      caseOutcome("c1", "pass", [{ name: "a", pass: true }]),
      caseOutcome("c2", "pass", [{ name: "a", pass: true }]),
      caseOutcome("c3", "fail", [{ name: "a", pass: false }]),
      caseOutcome("c4", "skipped", [{ name: "a", pass: false, skipped: true }]),
    ]);
    expect(summary.total).toBe(4);
    expect(summary.passCount).toBe(2);
    expect(summary.failCount).toBe(1);
    expect(summary.skippedCount).toBe(1);
    // 2 pass / (2 pass + 1 fail) = 2/3 — skipped excluded from the denominator.
    expect(summary.passRate).toBeCloseTo(2 / 3, 5);
  });

  it("reports a pass-rate of 0 when every case skipped", () => {
    const summary = summarizeRun([
      caseOutcome("c1", "skipped", [{ name: "a", pass: false, skipped: true }]),
    ]);
    expect(summary.passRate).toBe(0);
    expect(summary.skippedCount).toBe(1);
  });

  it("excludes skipped scorers from per-scorer pass-rates", () => {
    const summary = summarizeRun([
      caseOutcome("c1", "pass", [{ name: "a", pass: true }]),
      caseOutcome("c2", "skipped", [{ name: "a", pass: false, skipped: true }]),
    ]);
    const a = summary.scorers.find((s) => s.name === "a");
    // The scorer ran on exactly one case (the skipped one doesn't count).
    expect(a).toMatchObject({ name: "a", ran: 1, passed: 1, passRate: 1 });
  });

  it("preserves first-seen scorer order for stable report columns", () => {
    const summary = summarizeRun([
      caseOutcome("c1", "pass", [
        { name: "field-accuracy", pass: true },
        { name: "schema", pass: true },
      ]),
    ]);
    expect(summary.scorers.map((s) => s.name)).toEqual([
      "field-accuracy",
      "schema",
    ]);
  });
});

describe("summarizeRun — flips vs baseline", () => {
  const cases = [
    caseOutcome("c1", "fail", [{ name: "a", pass: false }]),
    caseOutcome("c2", "pass", [{ name: "a", pass: true }]),
  ];

  it("flags a scorer whose verdict differs from the baseline", () => {
    // c1 was pass in baseline, now fails → one flip.
    const baseline: BaselineMap = { c1: { a: "pass" }, c2: { a: "pass" } };
    const summary = summarizeRun(cases, baseline);
    expect(summary.flips).toEqual([
      { scorer: "a", caseId: "c1", from: "pass", to: "fail" },
    ]);
  });

  it("reports no flips when the baseline matches the current verdicts", () => {
    const baseline: BaselineMap = { c1: { a: "fail" }, c2: { a: "pass" } };
    expect(summarizeRun(cases, baseline).flips).toEqual([]);
  });

  it("reports no flips for a missing baseline entry (no prior)", () => {
    // c1 has no prior verdict for scorer 'a' → cannot flip.
    const baseline: BaselineMap = { c2: { a: "pass" } };
    expect(summarizeRun(cases, baseline).flips).toEqual([]);
  });

  it("reports no flips when no baseline is given at all", () => {
    expect(summarizeRun(cases).flips).toEqual([]);
  });
});

describe("exitCode — gate", () => {
  function summaryWith(passRate: number, scorers: { name: string; passRate: number }[]) {
    return {
      total: 1,
      passCount: 0,
      failCount: 0,
      skippedCount: 0,
      passRate,
      scorers: scorers.map((s) => ({ name: s.name, ran: 1, passed: 0, passRate: s.passRate })),
      flips: [],
    };
  }

  it("returns 0 when the run clears the floor and every scorer clears its floor", () => {
    const gate: Gate = { floor: 0.9, scorerFloors: { "field-accuracy": 0.95 } };
    const summary = summaryWith(0.96, [{ name: "field-accuracy", passRate: 0.97 }]);
    expect(exitCode(summary, gate)).toBe(0);
  });

  it("returns 1 when the run pass-rate is below the global floor", () => {
    const gate: Gate = { floor: 0.9 };
    expect(exitCode(summaryWith(0.85, []), gate)).toBe(1);
  });

  it("returns 1 when a scorer is below its explicit floor even though the run clears", () => {
    const gate: Gate = { floor: 0.9, scorerFloors: { "field-accuracy": 0.95 } };
    const summary = summaryWith(0.99, [{ name: "field-accuracy", passRate: 0.94 }]);
    expect(exitCode(summary, gate)).toBe(1);
  });

  it("applies the shared scorerFloor to a scorer with no explicit floor", () => {
    const gate: Gate = { floor: 0.5, scorerFloor: 0.8 };
    const below = summaryWith(0.9, [{ name: "schema", passRate: 0.79 }]);
    const above = summaryWith(0.9, [{ name: "schema", passRate: 0.81 }]);
    expect(exitCode(below, gate)).toBe(1);
    expect(exitCode(above, gate)).toBe(0);
  });

  it("leaves a scorer unconstrained when no floor applies", () => {
    const gate: Gate = { floor: 0.5 };
    expect(exitCode(summaryWith(0.6, [{ name: "schema", passRate: 0 }]), gate)).toBe(0);
  });

  it("prefers the explicit per-scorer floor over the shared default", () => {
    const gate: Gate = { floor: 0.5, scorerFloor: 0.99, scorerFloors: { schema: 0.5 } };
    // schema's explicit 0.5 wins over the 0.99 default → passes at 0.6.
    expect(exitCode(summaryWith(0.6, [{ name: "schema", passRate: 0.6 }]), gate)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* DB-backed gate — getGateStatus reads case_results from a real SQLite */
/* file and folds them into per-scorer pass-rates checked against gate   */
/* thresholds. This is the persisted twin of exitCode: a metric below    */
/* threshold blocks the suite (the gate goes red).                       */
/*                                                                      */
/* db/index.ts is a module singleton that reads RUBRIC_DB at load, so we */
/* set the env to a temp file BEFORE dynamically importing @/db. The     */
/* drizzle migrator builds the schema; we then seed minimal rows. No     */
/* network, no API key.                                                  */
/* ------------------------------------------------------------------ */

describe("getGateStatus — DB-backed gate", () => {
  let tmpDir: string;
  // Loaded after RUBRIC_DB is set, via dynamic import.
  let getGateStatus: typeof import("@/lib/queries/gating").getGateStatus;

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "rubric-aggregate-"));
    process.env.RUBRIC_DB = join(tmpDir, "test.db");

    const { db, schema } = await import("@/db");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, {
      migrationsFolder: join(import.meta.dirname, "..", "..", "db", "migrations"),
    });

    const now = new Date("2026-06-17T00:00:00Z");
    const [suite] = await db
      .insert(schema.suites)
      .values({
        slug: "settle-bill-review",
        title: "Settle Bill Review",
        repo: "rubric/examples",
        status: "passing",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (suite === undefined) throw new Error("seed: suite insert returned nothing");

    const [prompt] = await db
      .insert(schema.promptVersions)
      .values({
        suiteId: suite.id,
        label: "v1",
        body: "system prompt",
        createdAt: now,
      })
      .returning();
    if (prompt === undefined) throw new Error("seed: prompt insert returned nothing");

    const [run] = await db
      .insert(schema.runs)
      .values({
        suiteId: suite.id,
        promptVersionId: prompt.id,
        sha: "abc1234",
        branch: "main",
        status: "completed",
        total: 2,
        passCount: 1,
        failCount: 1,
        passRate: 0.5,
        startedAt: now,
        finishedAt: now,
      })
      .returning();
    if (run === undefined) throw new Error("seed: run insert returned nothing");

    const caseRows = await db
      .insert(schema.cases)
      .values([
        {
          runId: run.id,
          caseId: "case-pass",
          input: {},
          expected: {},
          actual: {},
          verdict: "pass",
          score: 1,
        },
        {
          runId: run.id,
          caseId: "case-fail",
          input: {},
          expected: {},
          actual: {},
          verdict: "fail",
          score: 0,
        },
      ])
      .returning();
    const [passCase, failCase] = caseRows;
    if (passCase === undefined || failCase === undefined) {
      throw new Error("seed: case insert returned nothing");
    }

    // field-accuracy passes on both cases (rate 1.0 ≥ 0.95 floor → metric pass).
    // schema passes on one of two cases (rate 0.5 < 0.90 floor → metric fail).
    await db.insert(schema.caseResults).values([
      { caseRowId: passCase.id, scorerName: "field-accuracy", pass: true, score: 1, errors: [] },
      { caseRowId: failCase.id, scorerName: "field-accuracy", pass: true, score: 1, errors: [] },
      { caseRowId: passCase.id, scorerName: "schema", pass: true, score: 1, errors: [] },
      { caseRowId: failCase.id, scorerName: "schema", pass: false, score: 0, errors: ["bad"] },
    ]);

    ({ getGateStatus } = await import("@/lib/queries/gating"));
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  it("blocks a suite whose schema scorer falls below its threshold", async () => {
    const status = await getGateStatus();

    expect(status.suiteCount).toBe(1);
    expect(status.blockingCount).toBe(1);
    expect(status.allPassing).toBe(false);

    const [gate] = status.gates;
    if (gate === undefined) throw new Error("expected one gate");
    expect(gate.suiteSlug).toBe("settle-bill-review");
    expect(gate.passing).toBe(false);

    const schema = gate.metrics.find((m) => m.metric === "schema");
    const fieldAccuracy = gate.metrics.find((m) => m.metric === "field-accuracy");

    // schema: 1/2 = 0.5 below the 0.90 threshold → fail, negative margin.
    expect(schema).toMatchObject({ value: 0.5, threshold: 0.9, status: "fail" });
    expect(schema?.margin).toBeCloseTo(-0.4, 5);

    // field-accuracy: 2/2 = 1.0 clears the 0.95 threshold → pass.
    expect(fieldAccuracy).toMatchObject({ value: 1, threshold: 0.95, status: "pass" });

    // Failing metrics bubble to the front of the per-suite metric list.
    expect(gate.metrics[0]?.status).toBe("fail");
  });
});
