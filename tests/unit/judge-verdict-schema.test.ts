import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  type JudgeAdapter,
  type JudgeRequest,
  type RawJudgeOutput,
} from "@/lib/judge/types";
import {
  type JudgeVerdict,
  judgeVerdictSchema,
} from "@/lib/judge/verdict-schema";
import { judgeScorer } from "@/lib/scorers/judge";
import { type ScorerContext } from "@/lib/scorers/types";
import { type JudgeScorer } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Judge verdict boundary — the schema every raw judge output is parsed */
/* through before it's trusted. These tests exercise the parse directly  */
/* and through judgeScorer's repair path, driving a MOCK JudgeAdapter so  */
/* nothing touches the network or reads an API key.                       */
/* ------------------------------------------------------------------ */

/** A well-formed verdict the real model is expected to produce. */
const GOOD_VERDICT: JudgeVerdict = {
  score: 5,
  pass: true,
  rubricResults: [
    { criterion: "extracts the vendor name", pass: true },
    { criterion: "totals reconcile", pass: true },
  ],
  reasoning: "all line items reconcile and the vendor is correct",
};

const ctx: ScorerContext = { caseId: "case-1", suite: "demo" };

const spec: JudgeScorer = {
  type: "judge",
  name: "judge",
  rubric: ["extracts the vendor name", "totals reconcile"],
  passScore: 4,
  weight: 1,
};

/**
 * A scripted judge adapter. Each call shifts the next canned raw output off the
 * queue; once exhausted it throws so an over-call is loud rather than silent. No
 * model, no key — `judge()` just hands back whatever the script holds.
 */
class MockJudgeAdapter implements JudgeAdapter {
  readonly model = "mock-judge";
  private readonly queue: RawJudgeOutput[];
  public calls = 0;
  public lastRequest: JudgeRequest | undefined;

  constructor(outputs: RawJudgeOutput[]) {
    this.queue = [...outputs];
  }

  judge(req: JudgeRequest): Promise<RawJudgeOutput> {
    this.calls += 1;
    this.lastRequest = req;
    if (this.queue.length === 0) {
      throw new Error("MockJudgeAdapter: judge() called more times than scripted");
    }
    return Promise.resolve(this.queue.shift());
  }
}

describe("judgeVerdictSchema", () => {
  it("parses a well-formed verdict", () => {
    const r = judgeVerdictSchema.safeParse(GOOD_VERDICT);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.score).toBe(5);
      expect(r.data.pass).toBe(true);
      expect(r.data.rubricResults).toHaveLength(2);
    }
  });

  it("parses JSON.parse output (the model returns a JSON string)", () => {
    const raw: unknown = JSON.parse(JSON.stringify(GOOD_VERDICT));
    expect(judgeVerdictSchema.safeParse(raw).success).toBe(true);
  });

  it("accepts an empty rubricResults array", () => {
    const r = judgeVerdictSchema.safeParse({
      score: 0,
      pass: false,
      rubricResults: [],
      reasoning: "nothing matched",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an extra hallucinated key (strictObject)", () => {
    const r = judgeVerdictSchema.safeParse({
      ...GOOD_VERDICT,
      confidence: 0.9,
    });
    expect(r.success).toBe(false);
  });

  it("rejects a rubric entry with an extra key (nested strictObject)", () => {
    const r = judgeVerdictSchema.safeParse({
      ...GOOD_VERDICT,
      rubricResults: [{ criterion: "x", pass: true, weight: 2 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a non-integer score", () => {
    const r = judgeVerdictSchema.safeParse({ ...GOOD_VERDICT, score: 4.5 });
    expect(r.success).toBe(false);
  });

  it("rejects a score above the 0..5 range", () => {
    expect(judgeVerdictSchema.safeParse({ ...GOOD_VERDICT, score: 6 }).success).toBe(
      false,
    );
  });

  it("rejects a score below 0", () => {
    expect(judgeVerdictSchema.safeParse({ ...GOOD_VERDICT, score: -1 }).success).toBe(
      false,
    );
  });

  it("rejects a missing pass field", () => {
    const { score, rubricResults, reasoning } = GOOD_VERDICT;
    const r = judgeVerdictSchema.safeParse({ score, rubricResults, reasoning });
    expect(r.success).toBe(false);
  });

  it("rejects a string score (no coercion across the boundary)", () => {
    expect(judgeVerdictSchema.safeParse({ ...GOOD_VERDICT, score: "5" }).success).toBe(
      false,
    );
  });

  it("rejects a top-level non-object", () => {
    expect(judgeVerdictSchema.safeParse("not json").success).toBe(false);
    expect(judgeVerdictSchema.safeParse(null).success).toBe(false);
    expect(judgeVerdictSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("judgeScorer with a mock adapter — happy path", () => {
  it("scores a good verdict on the first call, no repair", async () => {
    const adapter = new MockJudgeAdapter([GOOD_VERDICT]);
    const scorer = judgeScorer(spec, adapter);

    const result = await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.calls).toBe(1);
    expect(result.pass).toBe(true);
    // score is normalized to [0,1] as verdict.score / 5.
    expect(result.score).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.detail).toBe(GOOD_VERDICT.reasoning);
  });

  it("fails the case when the verdict scores below passScore", async () => {
    const adapter = new MockJudgeAdapter([
      {
        score: 3,
        pass: false,
        rubricResults: [
          { criterion: "extracts the vendor name", pass: true },
          { criterion: "totals reconcile", pass: false },
        ],
        reasoning: "totals do not reconcile",
      },
    ]);
    const scorer = judgeScorer(spec, adapter);

    const result = await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.calls).toBe(1);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(3 / 5);
    // errors enumerate the failed criteria.
    expect(result.errors).toEqual(["totals reconcile"]);
  });

  it("threads the case I/O into the JudgeRequest (expect→input, actual→output)", async () => {
    const adapter = new MockJudgeAdapter([GOOD_VERDICT]);
    const scorer = judgeScorer(spec, adapter);

    await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.lastRequest).toBeDefined();
    expect(adapter.lastRequest?.rubric).toEqual(spec.rubric);
    expect(adapter.lastRequest?.output).toEqual({ vendor: "Acme" });
    expect(adapter.lastRequest?.input).toBe("Acme");
    // expectedAnswer is pulled from a string expected blob.
    expect(adapter.lastRequest?.expectedAnswer).toBe("Acme");
  });
});

describe("judgeScorer with a mock adapter — repair path", () => {
  it("retries once when the first output fails validation, then succeeds", async () => {
    // First call: a malformed verdict (extra key trips strictObject). Second
    // call: the corrected verdict the repair retry asks for.
    const adapter = new MockJudgeAdapter([
      { ...GOOD_VERDICT, confidence: 0.9 },
      GOOD_VERDICT,
    ]);
    const scorer = judgeScorer(spec, adapter);

    const result = await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.calls).toBe(2);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it("repairs when the first output is the wrong shape entirely", async () => {
    const adapter = new MockJudgeAdapter([
      "I think this looks good to me!",
      GOOD_VERDICT,
    ]);
    const scorer = judgeScorer(spec, adapter);

    const result = await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.calls).toBe(2);
    expect(result.pass).toBe(true);
  });

  it("fails the case loudly when validation fails twice", async () => {
    const adapter = new MockJudgeAdapter([
      { score: 99, pass: "yes" },
      { not: "a verdict" },
    ]);
    const scorer = judgeScorer(spec, adapter);

    const result = await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.calls).toBe(2);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
    expect(result.detail).toContain("judge output failed validation twice");
    expect(result.errors).toHaveLength(1);
  });

  it("does not retry when the first output is already valid", async () => {
    // A second scripted output exists, but a valid first parse must short-circuit
    // before it's ever pulled.
    const adapter = new MockJudgeAdapter([GOOD_VERDICT, GOOD_VERDICT]);
    const scorer = judgeScorer(spec, adapter);

    await scorer.score({ vendor: "Acme" }, "Acme", ctx);

    expect(adapter.calls).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* DB round-trip — a parsed verdict persists through the real store on a  */
/* throwaway SQLite file. RUBRIC_DB must be set BEFORE @/db is imported   */
/* (it opens the connection at module load), so @/db + the store + the    */
/* migrator are pulled in dynamically inside beforeAll, after the env is   */
/* pointed at the temp path. No network, no key.                          */
/* ------------------------------------------------------------------ */

describe("parsed verdict persists to a temp SQLite via the store", () => {
  let tmpDir: string;
  let caseRowId: number;
  let judgeId: number;
  type DbModule = typeof import("@/db");
  type StoreModule = typeof import("@/lib/store");
  let db: DbModule["db"];
  let store: StoreModule;

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "rubric-judge-test-"));
    process.env.RUBRIC_DB = join(tmpDir, "test.db");

    // Dynamic imports: @/db reads RUBRIC_DB at module-eval time, so it must
    // resolve only after the env var above is set.
    const dbModule = await import("@/db");
    db = dbModule.db;
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    migrate(db, { migrationsFolder: "./db/migrations" });

    store = await import("@/lib/store");

    // Minimal seed: a suite → prompt version → run → one case, plus a judge.
    const now = new Date();
    const suiteId = store.insertSuite({
      slug: "demo-suite",
      title: "Demo suite",
      repo: "acme/demo",
      status: "passing",
      latestRunId: null,
      createdAt: now,
      updatedAt: now,
    });
    const promptVersionId = store.insertPromptVersion({
      suiteId,
      label: "v1",
      ref: null,
      body: "extract the invoice",
      createdAt: now,
    });
    const runId = store.insertRun({
      suiteId,
      promptVersionId,
      sha: "deadbeef",
      branch: "main",
      trigger: "manual",
      triggeredBy: null,
      status: "completed",
      total: 1,
      passCount: 1,
      failCount: 0,
      skippedCount: 0,
      passRate: 1,
      costUsd: 0,
      wallMs: 0,
      startedAt: now,
      finishedAt: now,
    });
    caseRowId = store.insertCase({
      runId,
      caseId: "case-1",
      label: "demo case",
      input: { vendor: "Acme" },
      expected: "Acme",
      actual: { vendor: "Acme" },
      verdict: "pass",
      score: 1,
      precondition: null,
    });
    judgeId = store.upsertJudge({
      name: "mock-judge",
      provider: "recorded",
      status: "under-calibrated",
    }).id;
  });

  afterAll(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("round-trips a verdict that first passed through judgeVerdictSchema", async () => {
    // The value persisted is the PARSED verdict — the schema is the boundary the
    // store sits behind.
    const verdict = judgeVerdictSchema.parse(GOOD_VERDICT);

    const verdictId = store.persistJudgeVerdict({
      caseRowId,
      judgeId,
      score: verdict.score,
      pass: verdict.pass,
      rubricResults: verdict.rubricResults,
      reasoning: verdict.reasoning,
    });
    expect(verdictId).toBeGreaterThan(0);

    const { judgeVerdicts } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const row = db
      .select()
      .from(judgeVerdicts)
      .where(eq(judgeVerdicts.id, verdictId))
      .get();

    expect(row).toBeDefined();
    expect(row?.score).toBe(5);
    expect(row?.pass).toBe(true);
    expect(row?.rubricResults).toEqual(GOOD_VERDICT.rubricResults);
    expect(row?.reasoning).toBe(GOOD_VERDICT.reasoning);
  });
});
