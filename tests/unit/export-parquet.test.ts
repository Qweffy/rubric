import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/* ------------------------------------------------------------------ */
/* `rubric export <run> --format parquet` round-trips through pyarrow's */
/* on-disk format. We seed a temp libSQL file DB (2 cases × 2 scorers,  */
/* one failing scorer + a judge verdict), export to a real .parquet,    */
/* then read it back with @dsnp/parquetjs and assert the row count and a */
/* known cell. A second assert pins the default CSV path's 11-col header */
/* so the parquet branch never silently changes CSV behavior.           */
/*                                                                      */
/* @/db opens its connection at module load from RUBRIC_DB, so the env   */
/* var is set to a throwaway tmp file BEFORE the first @/db import; the   */
/* command + parquet modules are pulled in dynamically inside beforeAll. */
/* No stdin, network, or API.                                            */
/* ------------------------------------------------------------------ */

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "..", "db", "migrations");

const SUITE_SLUG = "settle-bill-review";
const EXPECTED_ROWS = 4; // 2 cases × 2 scorers

let tmpDir: string;
let runId: number;
let exportRun: typeof import("@/lib/commands/export").exportRun;
let ParquetReader: typeof import("@dsnp/parquetjs").ParquetReader;

beforeAll(async () => {
  // 1. Point RUBRIC_DB at a throwaway file BEFORE any @/db import opens it.
  tmpDir = mkdtempSync(join(tmpdir(), "rubric-export-parquet-"));
  process.env.RUBRIC_DB = join(tmpDir, "test.db");

  // 2. Safe to load the db client, the export command, and the parquet reader.
  const { db, schema } = await import("@/db");
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  ({ exportRun } = await import("@/lib/commands/export"));
  ({ ParquetReader } = await import("@dsnp/parquetjs"));

  // 3. Materialize the schema by running the committed migrations.
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });

  // 4. Seed a minimal run: 2 cases, 2 scorers each, one scorer failing, plus a
  //    judge verdict on the failing case (so the judge LEFT JOIN is exercised).
  const now = new Date("2026-06-18T00:00:00Z");

  const [suite] = await db
    .insert(schema.suites)
    .values({
      slug: SUITE_SLUG,
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
    .values({ suiteId: suite.id, label: "v1", body: "system prompt", createdAt: now })
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
  runId = run.id;

  const caseRows = await db
    .insert(schema.cases)
    .values([
      {
        runId: run.id,
        caseId: "case-pass",
        label: "happy path",
        input: { q: 1 },
        expected: { ok: true },
        actual: { ok: true },
        verdict: "pass",
        score: 1,
      },
      {
        runId: run.id,
        caseId: "case-fail",
        label: null,
        input: { q: 2 },
        expected: { ok: true },
        actual: { ok: false },
        verdict: "fail",
        score: 0,
      },
    ])
    .returning();
  const [passCase, failCase] = caseRows;
  if (passCase === undefined || failCase === undefined) {
    throw new Error("seed: case insert returned nothing");
  }

  await db.insert(schema.caseResults).values([
    { caseRowId: passCase.id, scorerName: "field-accuracy", pass: true, score: 1, errors: [] },
    { caseRowId: passCase.id, scorerName: "schema", pass: true, score: 1, errors: [] },
    { caseRowId: failCase.id, scorerName: "field-accuracy", pass: true, score: 1, errors: [] },
    {
      caseRowId: failCase.id,
      scorerName: "schema",
      pass: false,
      score: 0,
      detail: "missing field",
      errors: ["expected ok=true", "got ok=false"],
    },
  ]);

  const [judge] = await db
    .insert(schema.judges)
    .values({ name: "groq-llama-judge", provider: "groq", createdAt: now })
    .returning();
  if (judge === undefined) throw new Error("seed: judge insert returned nothing");

  await db.insert(schema.judgeVerdicts).values({
    caseRowId: failCase.id,
    judgeId: judge.id,
    score: 2,
    pass: false,
    rubricResults: [{ criterion: "accuracy", pass: false }],
    reasoning: "the output disagrees with the expected total",
    createdAt: now,
  });
});

afterAll(() => {
  delete process.env.RUBRIC_DB;
  if (tmpDir !== undefined) rmSync(tmpDir, { recursive: true, force: true });
});

/** Drain every row from a parquet file via a fresh cursor. */
async function readParquetRows(
  path: string,
): Promise<Record<string, unknown>[]> {
  const reader = await ParquetReader.openFile(path);
  try {
    const cursor = reader.getCursor();
    const rows: Record<string, unknown>[] = [];
    let record = await cursor.next();
    while (record !== null && typeof record === "object") {
      rows.push(record as Record<string, unknown>);
      record = await cursor.next();
    }
    return rows;
  } finally {
    await reader.close();
  }
}

describe("rubric export --format parquet", () => {
  it("writes a real .parquet that reads back to cases × scorers rows", async () => {
    const out = join(tmpDir, "run.parquet");
    const result = await exportRun(String(runId), { format: "parquet", out });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toContain(`${String(EXPECTED_ROWS)} rows`);
    expect(result.data).toContain(out);

    const rows = await readParquetRows(out);
    expect(rows).toHaveLength(EXPECTED_ROWS);

    // Spot-check the failing scorer row: scorer_pass encodes as a real boolean.
    const failingSchema = rows.find(
      (r) => r["case_id"] === "case-fail" && r["scorer"] === "schema",
    );
    expect(failingSchema).toBeDefined();
    expect(failingSchema?.["scorer_pass"]).toBe(false);
    expect(failingSchema?.["errors"]).toBe("expected ok=true | got ok=false");
    // The judge verdict rides on each of the failing case's scorer rows.
    expect(failingSchema?.["judge_model"]).toBe("groq-llama-judge");
    expect(failingSchema?.["judge_score"]).toBe(2);

    // A passing scorer row encodes pass=true and carries no judge verdict.
    const passingField = rows.find(
      (r) => r["case_id"] === "case-pass" && r["scorer"] === "field-accuracy",
    );
    expect(passingField?.["scorer_pass"]).toBe(true);
    expect(passingField?.["judge_model"]).toBeNull();
  });

  it("keeps the default CSV path at the 11-column header", async () => {
    const out = join(tmpDir, "run.csv");
    const result = await exportRun(String(runId), { out });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const text = readFileSync(out, "utf8");
    const [header] = text.split("\n");
    expect(header).toBe(
      "suite,run_id,case_id,label,verdict,case_score,scorer,scorer_pass,scorer_score,detail,errors",
    );
    // 1 header + 4 data rows + trailing newline → 4 data lines of content.
    const dataLines = text.trimEnd().split("\n").slice(1);
    expect(dataLines).toHaveLength(EXPECTED_ROWS);
  });
});
