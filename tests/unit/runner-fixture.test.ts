import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { RunnerError } from "@/lib/runner/errors";
import { makeTarget } from "@/lib/runner/factory";
import { interpolatePath, makeFixtureTarget } from "@/lib/runner/fixture";
import { type CaseInput } from "@/lib/runner/types";
import { type CaseSpec, type FixtureTarget } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Fixture runner — interpolatePath + makeFixtureTarget (lib/runner).   */
/* Pure FS, no network, no API key. Fixtures are written to a per-suite  */
/* tmp dir so the test is hermetic and deterministic.                   */
/* ------------------------------------------------------------------ */

/** A minimal case the fixture target can run — only `id`/`input` matter here. */
function caseInput(id: string, input: unknown = {}): CaseInput {
  return { id, input, expect: {} } satisfies CaseSpec;
}

describe("interpolatePath", () => {
  it("substitutes ${case.id} with the concrete case id", () => {
    expect(interpolatePath("fixtures/${case.id}.json", "rec-001")).toBe(
      "fixtures/rec-001.json",
    );
  });

  it("substitutes every occurrence of the token", () => {
    expect(interpolatePath("${case.id}/${case.id}.json", "abc")).toBe(
      "abc/abc.json",
    );
  });

  it("tolerates whitespace inside the braces", () => {
    expect(interpolatePath("out/${ case.id }.json", "x42")).toBe(
      "out/x42.json",
    );
  });

  it("passes a template through unchanged when there is no placeholder", () => {
    expect(interpolatePath("fixtures/static.json", "ignored")).toBe(
      "fixtures/static.json",
    );
  });

  it("throws a RunnerError on an unknown placeholder", () => {
    expect(() => interpolatePath("${case.name}.json", "x")).toThrow(RunnerError);
    expect(() => interpolatePath("${case.name}.json", "x")).toThrow(
      /unknown placeholder/,
    );
  });
});

describe("makeFixtureTarget", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "rubric-fixture-"));
    writeFileSync(
      join(dir, "rec-001.json"),
      JSON.stringify({ ok: true, total: 4200, lines: [{ sku: "A1", qty: 2 }] }),
      "utf8",
    );
    writeFileSync(join(dir, "broken.json"), "{ not valid json", "utf8");
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reads and JSON-parses the per-case fixture file", async () => {
    const spec: FixtureTarget = {
      kind: "fixture",
      path: join(dir, "${case.id}.json"),
    };
    const target = makeFixtureTarget(spec);

    const out = await target.run(caseInput("rec-001"));

    expect(out).toEqual({
      ok: true,
      total: 4200,
      lines: [{ sku: "A1", qty: 2 }],
    });
  });

  it("interpolates ${case.id} from the case, not from the input payload", async () => {
    const spec: FixtureTarget = {
      kind: "fixture",
      path: join(dir, "${case.id}.json"),
    };
    const target = makeFixtureTarget(spec);

    // input is unrelated to the id — the path must resolve off id alone.
    const out = await target.run(caseInput("rec-001", { id: "decoy" }));

    expect(out).toMatchObject({ ok: true });
  });

  it("rejects with a RunnerError when the fixture file is missing", async () => {
    const spec: FixtureTarget = {
      kind: "fixture",
      path: join(dir, "${case.id}.json"),
    };
    const target = makeFixtureTarget(spec);

    await expect(target.run(caseInput("does-not-exist"))).rejects.toThrow(
      RunnerError,
    );
    await expect(target.run(caseInput("does-not-exist"))).rejects.toThrow(
      /cannot read fixture/,
    );
  });

  it("rejects with a RunnerError when the fixture is not valid JSON", async () => {
    const spec: FixtureTarget = {
      kind: "fixture",
      path: join(dir, "${case.id}.json"),
    };
    const target = makeFixtureTarget(spec);

    await expect(target.run(caseInput("broken"))).rejects.toThrow(RunnerError);
    await expect(target.run(caseInput("broken"))).rejects.toThrow(
      /not valid JSON/,
    );
  });

  it("rejects with a RunnerError on an unknown placeholder in the path", async () => {
    const spec: FixtureTarget = {
      kind: "fixture",
      path: join(dir, "${case.slug}.json"),
    };
    const target = makeFixtureTarget(spec);

    await expect(target.run(caseInput("rec-001"))).rejects.toThrow(
      /unknown placeholder/,
    );
  });
});

describe("makeTarget", () => {
  it("dispatches a fixture spec to a working fixture target", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rubric-factory-"));
    try {
      writeFileSync(join(dir, "c1.json"), JSON.stringify({ via: "factory" }), "utf8");
      const target = makeTarget({
        kind: "fixture",
        path: join(dir, "${case.id}.json"),
      });

      await expect(target.run(caseInput("c1"))).resolves.toEqual({
        via: "factory",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ------------------------------------------------------------------ */
/* End-to-end seam: fixture output → store → read back, on a temp DB.   */
/* RUBRIC_DB is pointed at a fresh tmp file BEFORE @/db is loaded, so    */
/* the store's libSQL singleton binds to it. The schema is              */
/* materialized by running the real drizzle migrations. No network.      */
/* ------------------------------------------------------------------ */

describe("fixture output persisted to a temp SQLite DB", () => {
  let dbDir: string;
  let fixtureDir: string;

  beforeAll(() => {
    // Must be set before the dynamic import of @/db below — the client reads
    // process.env.RUBRIC_DB at module-load time.
    dbDir = mkdtempSync(join(tmpdir(), "rubric-db-"));
    process.env.RUBRIC_DB = join(dbDir, "test.db");
    fixtureDir = mkdtempSync(join(tmpdir(), "rubric-e2e-"));
    writeFileSync(
      join(fixtureDir, "rec-001.json"),
      JSON.stringify({ ok: true, total: 4200 }),
      "utf8",
    );
  });

  afterAll(() => {
    rmSync(dbDir, { recursive: true, force: true });
    rmSync(fixtureDir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  it("runs a fixture, seeds minimal rows, persists the run and reads it back", async () => {
    // Dynamic imports so @/db initializes against the tmp RUBRIC_DB above.
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const { db } = await import("@/db");
    const { runs } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { upsertSuite, upsertPromptVersion, persistRun } = await import(
      "@/lib/store"
    );

    await migrate(db, {
      migrationsFolder: join(process.cwd(), "db", "migrations"),
    });

    // Minimal parent rows the run FKs require.
    const suite = await upsertSuite({
      slug: "settle-bill-review",
      title: "Settle Bill Review",
      repo: "rubric",
    });
    const promptVersionId = await upsertPromptVersion({
      suiteId: suite.id,
      label: "v1",
      body: "system prompt",
    });

    // Drive a real fixture target to produce the case's actual output.
    const target = makeFixtureTarget({
      kind: "fixture",
      path: join(fixtureDir, "${case.id}.json"),
    });
    const actual = await target.run(caseInput("rec-001"));

    const { runId, caseCount, scorerCount } = await persistRun({
      suiteId: suite.id,
      promptVersionId,
      sha: "abc1234",
      branch: "main",
      costUsd: 0,
      wallMs: 12,
      startedAt: new Date("2026-06-17T00:00:00Z"),
      suiteStatus: "passing",
      cases: [
        {
          caseId: "rec-001",
          input: {},
          expected: { ok: true, total: 4200 },
          actual,
          verdict: "pass",
          score: 1,
          scorers: [
            { scorerName: "exact-match", pass: true, score: 1, errors: [] },
          ],
        },
      ],
    });

    expect(caseCount).toBe(1);
    expect(scorerCount).toBe(1);

    const row = await db.select().from(runs).where(eq(runs.id, runId)).get();
    expect(row).toBeDefined();
    expect(row?.suiteId).toBe(suite.id);
    expect(row?.total).toBe(1);
    expect(row?.passCount).toBe(1);
    expect(row?.passRate).toBe(1);
    expect(row?.status).toBe("completed");

    // The fixture's parsed output round-trips through the JSON column.
    const { cases: casesTable } = await import("@/db/schema");
    const caseRow = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.runId, runId))
      .get();
    expect(caseRow?.actual).toEqual({ ok: true, total: 4200 });
  });
});
