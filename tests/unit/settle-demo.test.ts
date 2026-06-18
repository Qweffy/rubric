import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/* ------------------------------------------------------------------ */
/* End-to-end M1: `rubric run examples/settle-bill-review` offline.     */
/*                                                                      */
/* This exercises the real run command against the real fixture target  */
/* — no API key, no network, no judge. The settle suite replays a        */
/* recorded {extraction, flags} blob (fixtures/inv-1046.json) through    */
/* the fixture target and scores it with three deterministic scorers     */
/* (json-schema, exact-match, field-accuracy). The golden case          */
/* (case_071, "split-tender checkout") must PASS, the gate must go       */
/* GREEN, and the process exit code must be 0.                          */
/*                                                                      */
/* @/db opens a SQLite connection at module load reading RUBRIC_DB, so   */
/* the env var is set to a throwaway tmp file BEFORE the first import of  */
/* anything that touches @/db. Every such import is therefore a dynamic   */
/* import inside beforeAll, after the env is in place. The schema is      */
/* materialized by running the committed Drizzle migrations against that  */
/* tmp DB — the same SQL the CLI runs against — so persistence is real.   */
/* ------------------------------------------------------------------ */

const REPO_ROOT = resolve(__dirname, "..", "..");
const SUITE_PATH = join(
  REPO_ROOT,
  "examples",
  "settle-bill-review",
  "suite.yaml",
);
const MIGRATIONS_DIR = join(REPO_ROOT, "db", "migrations");

// The recorded fixture's invariants — what an offline replay must reproduce.
const EXPECTED_TOTAL = 85_400;
const EXPECTED_LINE_ITEMS = 4;
const EXPECTED_FLAGS = 4;
const EXPECTED_INVOICE = "INV-1046";
const CASE_ID = "case_071";

// Dynamically-imported bindings — populated in beforeAll once RUBRIC_DB is set.
type RunFn = typeof import("@/lib/commands/run").run;
let run: RunFn;
let db: typeof import("@/db").db;
let casesTable: typeof import("@/db/schema").cases;
let eq: typeof import("drizzle-orm").eq;

let dbDir: string;

// The persisted `actual` blob has an unknown shape off the DB — narrow it with
// a tiny guard rather than reaching for `any`.
interface RecordedOutput {
  extraction: { invoiceNumber: string; total: number; lineItems: unknown[] };
  flags: unknown[];
}

function isRecordedOutput(value: unknown): value is RecordedOutput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const extraction = v["extraction"];
  if (typeof extraction !== "object" || extraction === null) return false;
  const e = extraction as Record<string, unknown>;
  return (
    typeof e["invoiceNumber"] === "string" &&
    typeof e["total"] === "number" &&
    Array.isArray(e["lineItems"]) &&
    Array.isArray(v["flags"])
  );
}

beforeAll(async () => {
  // 1. Point RUBRIC_DB at a throwaway file BEFORE any @/db import opens it.
  dbDir = mkdtempSync(join(tmpdir(), "rubric-settle-"));
  process.env.RUBRIC_DB = join(dbDir, "test.db");

  // 2. Now it is safe to load the db client and the run command.
  const dbMod = await import("@/db");
  const schemaMod = await import("@/db/schema");
  const drizzleMod = await import("drizzle-orm");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const runMod = await import("@/lib/commands/run");

  db = dbMod.db;
  casesTable = schemaMod.cases;
  eq = drizzleMod.eq;
  run = runMod.run;

  // 3. Materialize the schema by running the committed migrations.
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
});

afterAll(() => {
  delete process.env.RUBRIC_DB;
  if (dbDir !== undefined) rmSync(dbDir, { recursive: true, force: true });
});

describe("settle-bill-review (M1 offline end-to-end)", () => {
  it("passes the golden case with exit 0 and a green gate — no API, no network", async () => {
    const result = await run(SUITE_PATH, { noColor: true });

    expect(result.ok).toBe(true);
    if (!result.ok) return; // narrow for the type checker; the assert above fails first.

    // The gate decides the process exit code CI reads — green run is exit 0.
    expect(result.data.exitCode).toBe(0);

    // The run persisted (store enabled) → a real run id came back.
    expect(result.data.runId).not.toBeNull();

    // The rendered report shows the case as PASS and the gate as GREEN.
    const report = result.data.report;
    expect(report).toContain(CASE_ID);
    expect(report).toContain("PASS");
    expect(report).toContain("gate GREEN");
    expect(report).toContain("exit 0");
    expect(report).toContain("1 pass · 0 fail");

    // Every deterministic scorer column is present and contributed.
    expect(report).toContain("schema");
    expect(report).toContain("exact-match");
    expect(report).toContain("field-accuracy");

    // Offline by construction: a fixture target makes zero API calls. The header
    // names the fixture, and there is no judge column.
    expect(report).toContain("fixture");
    expect(report).not.toContain("judge");
  });

  it("replays the recorded INV-1046 blob: total 85400, 4 line items, 4 flags", async () => {
    // Re-run with the same tmp DB, then read the persisted `actual` back to
    // assert the offline replay reproduced the fixture's invariants end-to-end.
    const result = await run(SUITE_PATH, { noColor: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const runId = result.data.runId;
    expect(runId).not.toBeNull();
    if (runId === null) return;

    const row = db
      .select({ actual: casesTable.actual, verdict: casesTable.verdict })
      .from(casesTable)
      .where(eq(casesTable.runId, runId))
      .get();

    expect(row).toBeDefined();
    expect(row?.verdict).toBe("pass");

    const actual = row?.actual;
    expect(isRecordedOutput(actual)).toBe(true);
    if (!isRecordedOutput(actual)) return;

    expect(actual.extraction.invoiceNumber).toBe(EXPECTED_INVOICE);
    expect(actual.extraction.total).toBe(EXPECTED_TOTAL);
    expect(actual.extraction.lineItems).toHaveLength(EXPECTED_LINE_ITEMS);
    expect(actual.flags).toHaveLength(EXPECTED_FLAGS);
  });

  it("passes with --no-store too: exit 0 and no run persisted", async () => {
    const result = await run(SUITE_PATH, { noColor: true, noStore: true });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.exitCode).toBe(0);
    // --no-store leaves the store untouched, so no run id is returned.
    expect(result.data.runId).toBeNull();
    expect(result.data.report).toContain("gate GREEN");
  });
});
