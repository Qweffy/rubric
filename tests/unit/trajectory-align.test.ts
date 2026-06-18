import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type AlignOp, alignTools } from "@/lib/trajectory/align";

/* ------------------------------------------------------------------ */
/* The canonical book_flight_multi_leg golden case, shared by both the  */
/* pure-alignment suite below and the DB round-trip suite. The agent    */
/* issues a redundant second search_flights before check_seats; that    */
/* redundant insert earns partial credit, pinning the headline to its   */
/* published 90.5% (4 matches + one redundant insert over max length 5).*/
/* ------------------------------------------------------------------ */
const BOOK_FLIGHT_EXPECTED = [
  "search_flights",
  "check_seats",
  "hold_seat",
  "confirm_booking",
];
const BOOK_FLIGHT_ACTUAL = [
  "search_flights",
  "search_flights",
  "check_seats",
  "hold_seat",
  "confirm_booking",
];

const ops = (expected: string[], actual: string[]): AlignOp[] =>
  alignTools(expected, actual).steps.map((s) => s.op);

describe("alignTools", () => {
  it("scores the book_flight_multi_leg golden case at 0.905", () => {
    const { steps, toolSelectionAccuracy } = alignTools(
      BOOK_FLIGHT_EXPECTED,
      BOOK_FLIGHT_ACTUAL,
    );

    expect(toolSelectionAccuracy).toBeCloseTo(0.905, 3);

    // 4 match · 1 insert · 0 del · 0 sub — exactly the published alignment.
    const counts = tally(steps.map((s) => s.op));
    expect(counts).toEqual({ match: 4, insert: 1, delete: 0, substitute: 0 });

    // The redundant call is reported at the divergence point (second position),
    // right after the search_flights it repeats — not absorbed at the head.
    expect(steps[1]).toMatchObject({
      idx: 1,
      op: "insert",
      expectedTool: null,
      actualTool: "search_flights",
    });
    expect(steps[0]?.op).toBe("match");
  });

  it("returns no steps and full accuracy for two empty sequences", () => {
    const { steps, toolSelectionAccuracy } = alignTools([], []);
    expect(steps).toEqual([]);
    expect(toolSelectionAccuracy).toBe(1);
  });

  it("scores a fully empty side as zero", () => {
    expect(alignTools([], ["a"]).toolSelectionAccuracy).toBe(0);
    expect(alignTools(["a"], []).toolSelectionAccuracy).toBe(0);
  });

  it("scores an identical sequence at 1 with all matches", () => {
    const r = alignTools(["a", "b", "c"], ["a", "b", "c"]);
    expect(r.toolSelectionAccuracy).toBe(1);
    expect(r.steps.map((s) => s.op)).toEqual(["match", "match", "match"]);
  });

  it("reports a wrong tool as a substitution, not insert+delete", () => {
    const r = alignTools(["a", "b", "c"], ["a", "x", "c"]);
    expect(ops(["a", "b", "c"], ["a", "x", "c"])).toEqual([
      "match",
      "substitute",
      "match",
    ]);
    expect(r.steps[1]).toMatchObject({
      op: "substitute",
      expectedTool: "b",
      actualTool: "x",
    });
    expect(r.toolSelectionAccuracy).toBeCloseTo(2 / 3, 5);
  });

  it("reports a skipped expected call as a delete with a null actual", () => {
    const r = alignTools(["a", "b", "c"], ["a", "c"]);
    expect(r.steps.map((s) => s.op)).toEqual(["match", "delete", "match"]);
    expect(r.steps[1]).toMatchObject({ op: "delete", actualTool: null });
    expect(r.toolSelectionAccuracy).toBeCloseTo(2 / 3, 5);
  });

  it("reports a non-redundant extra call as an insert with a null expected", () => {
    const r = alignTools(["a", "c"], ["a", "b", "c"]);
    expect(r.steps.map((s) => s.op)).toEqual(["match", "insert", "match"]);
    expect(r.steps[1]).toMatchObject({ op: "insert", expectedTool: null });
    // A non-redundant insert earns no partial credit: 2 matches / max(2, 3).
    expect(r.toolSelectionAccuracy).toBeCloseTo(2 / 3, 5);
  });

  it("places a trailing duplicate insert after the call it repeats", () => {
    const r = alignTools(["a", "b"], ["a", "b", "b"]);
    expect(r.steps.map((s) => s.op)).toEqual(["match", "match", "insert"]);
    expect(r.steps[2]).toMatchObject({ op: "insert", actualTool: "b" });
  });

  it("assigns contiguous idx values across the alignment", () => {
    const { steps } = alignTools(["a", "b"], ["a", "x", "b"]);
    expect(steps.map((s) => s.idx)).toEqual([0, 1, 2]);
  });
});

/* ------------------------------------------------------------------ */
/* DB round trip: persist the aligned book_flight_multi_leg trajectory  */
/* through the real write helper and read it back through the real      */
/* query. The 0.905 headline and the 4-match/1-insert op tally must     */
/* survive the SQLite round trip exactly. Runs against a throwaway      */
/* on-disk SQLite DB (RUBRIC_DB) migrated from the checked-in schema —  */
/* no network, no API key. RUBRIC_DB and the migration must be in place */
/* before the db singleton (and the modules that import it) are loaded, */
/* so the store/query modules are pulled in via dynamic import after    */
/* beforeAll has wired up the temp database.                            */
/* ------------------------------------------------------------------ */
describe("book_flight_multi_leg trajectory persistence", () => {
  let tmpDir = "";

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "rubric-trajectory-"));
    const dbPath = join(tmpDir, "trajectory.db");
    process.env.RUBRIC_DB = dbPath;

    // Migrate a fresh client up to the checked-in schema, then close it; the
    // db singleton reopens the same file on first import below.
    const client = createClient({ url: `file:${dbPath}` });
    await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
    client.close();
  });

  afterAll(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("persists the aligned trajectory and reads back 0.905 with correct ops", async () => {
    const { upsertSuite, persistTrajectoryTask } = await import("@/lib/store");
    const { getTrajectoryDetail } = await import("@/lib/queries/trajectories");

    // Derive the steps from the real aligner so the persisted shape is exactly
    // what the scorer produced — the DB never sees hand-faked ops.
    const { steps, toolSelectionAccuracy } = alignTools(
      BOOK_FLIGHT_EXPECTED,
      BOOK_FLIGHT_ACTUAL,
    );
    expect(toolSelectionAccuracy).toBeCloseTo(0.905, 3);

    const suite = await upsertSuite({
      slug: "refund-agent",
      title: "Refund Agent",
      repo: "rubric/refund-agent",
    });

    const { taskRowId, stepCount } = await persistTrajectoryTask({
      suiteId: suite.id,
      runId: null,
      taskId: "book_flight_multi_leg",
      expectedTools: BOOK_FLIGHT_EXPECTED,
      toolSelectionAccuracy,
      finalAnswerPass: true,
      outcome: "diverged-but-correct",
      steps: steps.map((s) => ({
        idx: s.idx,
        expectedTool: s.expectedTool,
        actualTool: s.actualTool,
        args: {},
        result: {},
        match: s.op,
      })),
    });
    expect(taskRowId).toBeGreaterThan(0);
    expect(stepCount).toBe(5);

    const detail = await getTrajectoryDetail("book_flight_multi_leg");
    expect(detail).not.toBeNull();
    if (detail === null) throw new Error("trajectory detail missing");

    expect(detail.suiteSlug).toBe("refund-agent");
    expect(detail.outcome).toBe("diverged-but-correct");
    expect(detail.finalAnswerPass).toBe(true);
    expect(detail.expectedTools).toEqual(BOOK_FLIGHT_EXPECTED);

    // The headline accuracy survives the SQLite round trip.
    expect(detail.toolSelectionAccuracy).toBeCloseTo(0.905, 3);

    // 4 match · 1 insert · 0 del · 0 sub — tallied from the persisted rows.
    expect(detail.stepCounts).toEqual({
      match: 4,
      insert: 1,
      delete: 0,
      substitute: 0,
    });

    // The actual sequence is reconstructed from the persisted steps in order,
    // including the redundant second search_flights.
    expect(detail.actualTools).toEqual(BOOK_FLIGHT_ACTUAL);

    // The redundant call lands at idx 1 as an insert with no expected tool.
    expect(detail.steps[1]).toMatchObject({
      idx: 1,
      match: "insert",
      expectedTool: null,
      actualTool: "search_flights",
    });
    expect(detail.steps[0]?.match).toBe("match");
  });

  it("re-persisting the same trajectory converges instead of duplicating", async () => {
    const { upsertSuite, persistTrajectoryTask } = await import("@/lib/store");
    const { getTrajectoryDetail } = await import("@/lib/queries/trajectories");

    const { steps, toolSelectionAccuracy } = alignTools(
      BOOK_FLIGHT_EXPECTED,
      BOOK_FLIGHT_ACTUAL,
    );
    const suite = await upsertSuite({
      slug: "refund-agent",
      title: "Refund Agent",
      repo: "rubric/refund-agent",
    });

    // Persist a second time — idempotent on (taskId, idx); steps converge.
    await persistTrajectoryTask({
      suiteId: suite.id,
      runId: null,
      taskId: "book_flight_multi_leg",
      expectedTools: BOOK_FLIGHT_EXPECTED,
      toolSelectionAccuracy,
      finalAnswerPass: true,
      outcome: "diverged-but-correct",
      steps: steps.map((s) => ({
        idx: s.idx,
        expectedTool: s.expectedTool,
        actualTool: s.actualTool,
        args: {},
        result: {},
        match: s.op,
      })),
    });

    const detail = await getTrajectoryDetail("book_flight_multi_leg");
    expect(detail).not.toBeNull();
    if (detail === null) throw new Error("trajectory detail missing");

    // Still exactly 5 steps and the same headline — no duplicate rows.
    expect(detail.steps).toHaveLength(5);
    expect(detail.toolSelectionAccuracy).toBeCloseTo(0.905, 3);
    expect(detail.stepCounts).toEqual({
      match: 4,
      insert: 1,
      delete: 0,
      substitute: 0,
    });
  });
});

function tally(opList: AlignOp[]): Record<AlignOp, number> {
  const counts: Record<AlignOp, number> = {
    match: 0,
    insert: 0,
    delete: 0,
    substitute: 0,
  };
  for (const op of opList) counts[op] += 1;
  return counts;
}
