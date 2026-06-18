import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { stringify as toYaml } from "yaml";

import { loadSuite } from "@/lib/spec/load";
import {
  caseSpecSchema,
  scorerSpecSchema,
  suiteSpecSchema,
  targetSpecSchema,
} from "@/lib/spec/schema";

/* ------------------------------------------------------------------ */
/* Spec-load tests — the on-disk YAML → validated SuiteSpec boundary.   */
/*                                                                      */
/* Covers two layers of lib/spec:                                       */
/*  1. the zod schema (lib/spec/schema.ts) accepts golden shapes and    */
/*     rejects malformed ones (strictObject, discriminated unions,      */
/*     min/positive constraints, the version literal).                  */
/*  2. loadSuite (lib/spec/load.ts) reads real YAML off disk, inlines   */
/*     glob cases, dedupes ids, anchors paths, and returns ActionResult */
/*     errors instead of throwing.                                      */
/*                                                                      */
/* Everything runs against a temp dir on the real filesystem — no       */
/* network, no API key, deterministic.                                  */
/* ------------------------------------------------------------------ */

/** A minimal, valid suite spec that exercises every required field. */
function goldenSuite(): Record<string, unknown> {
  return {
    version: 1,
    suite: "settle-bill-review",
    title: "Settle — AP bill review",
    repo: "nicomastakas/settle",
    prompt: { version: "ocr-v1", ref: "settle/lib/ocr.ts" },
    target: { kind: "fixture", path: "./fixtures/inv-1046.json" },
    scorers: [
      { type: "exact-match", name: "exact-match", mode: "by-path" },
      {
        type: "field-accuracy",
        name: "field-accuracy",
        fields: ["extraction.invoiceNumber", "extraction.total"],
      },
    ],
    cases: [goldenCase()],
  };
}

/** A minimal, valid inline case spec. */
function goldenCase(): Record<string, unknown> {
  return {
    id: "case_071",
    label: "split-tender checkout",
    input: { document: "INV-1046.pdf" },
    expect: {
      "exact-match": { "extraction.invoiceNumber": "INV-1046" },
    },
  };
}

describe("suiteSpecSchema", () => {
  it("accepts a golden suite spec", () => {
    expect(suiteSpecSchema.safeParse(goldenSuite()).success).toBe(true);
  });

  it("applies scorer defaults (weight, threshold)", () => {
    const parsed = suiteSpecSchema.parse(goldenSuite());
    const [exact, fieldAcc] = parsed.scorers;
    expect(exact?.weight).toBe(1);
    if (fieldAcc?.type === "field-accuracy") {
      expect(fieldAcc.threshold).toBe(0.95);
      expect(fieldAcc.weight).toBe(1);
    } else {
      throw new Error("expected a field-accuracy scorer");
    }
  });

  it("rejects an unknown version literal", () => {
    expect(
      suiteSpecSchema.safeParse({ ...goldenSuite(), version: 2 }).success,
    ).toBe(false);
  });

  it("rejects unknown top-level keys (strictObject)", () => {
    expect(
      suiteSpecSchema.safeParse({ ...goldenSuite(), sneaky: true }).success,
    ).toBe(false);
  });

  it("rejects an empty suite slug", () => {
    expect(
      suiteSpecSchema.safeParse({ ...goldenSuite(), suite: "" }).success,
    ).toBe(false);
  });

  it("rejects an empty scorers array", () => {
    expect(
      suiteSpecSchema.safeParse({ ...goldenSuite(), scorers: [] }).success,
    ).toBe(false);
  });

  it("rejects a missing required field (prompt)", () => {
    const noPrompt: Record<string, unknown> = { ...goldenSuite() };
    delete noPrompt.prompt;
    expect(suiteSpecSchema.safeParse(noPrompt).success).toBe(false);
  });

  it("accepts a glob string for cases", () => {
    const parsed = suiteSpecSchema.safeParse({
      ...goldenSuite(),
      cases: "./cases/*.yaml",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("targetSpecSchema", () => {
  it("accepts a fixture target", () => {
    expect(
      targetSpecSchema.safeParse({ kind: "fixture", path: "./x.json" }).success,
    ).toBe(true);
  });

  it("applies exec target defaults", () => {
    const parsed = targetSpecSchema.parse({
      kind: "exec",
      command: "node run.js",
    });
    expect(parsed).toMatchObject({
      input: "stdin",
      parseStdout: "json",
      timeoutMs: 30000,
    });
  });

  it("rejects an unknown target kind (discriminated union)", () => {
    expect(
      targetSpecSchema.safeParse({ kind: "http", url: "http://x" }).success,
    ).toBe(false);
  });

  it("rejects a fixture target with an empty path", () => {
    expect(
      targetSpecSchema.safeParse({ kind: "fixture", path: "" }).success,
    ).toBe(false);
  });

  it("rejects a non-positive exec timeout", () => {
    expect(
      targetSpecSchema.safeParse({
        kind: "exec",
        command: "node run.js",
        timeoutMs: 0,
      }).success,
    ).toBe(false);
  });
});

describe("scorerSpecSchema", () => {
  it("accepts every scorer type", () => {
    const scorers = [
      { type: "exact-match", name: "em", mode: "deep-equal" },
      { type: "json-schema", name: "js", schema: { type: "object" } },
      { type: "field-accuracy", name: "fa", fields: ["a.b"] },
      { type: "contains", name: "c", pattern: "needle" },
      { type: "judge", name: "j", rubric: ["is correct"] },
    ];
    for (const s of scorers) {
      expect(scorerSpecSchema.safeParse(s).success).toBe(true);
    }
  });

  it("rejects an unknown scorer type", () => {
    expect(
      scorerSpecSchema.safeParse({ type: "bleu", name: "b" }).success,
    ).toBe(false);
  });

  it("rejects an exact-match scorer with a bad mode", () => {
    expect(
      scorerSpecSchema.safeParse({
        type: "exact-match",
        name: "em",
        mode: "fuzzy",
      }).success,
    ).toBe(false);
  });

  it("rejects a field-accuracy scorer with no fields", () => {
    expect(
      scorerSpecSchema.safeParse({
        type: "field-accuracy",
        name: "fa",
        fields: [],
      }).success,
    ).toBe(false);
  });

  it("rejects a judge scorer with an empty rubric", () => {
    expect(
      scorerSpecSchema.safeParse({ type: "judge", name: "j", rubric: [] })
        .success,
    ).toBe(false);
  });
});

describe("caseSpecSchema", () => {
  it("accepts a golden case", () => {
    expect(caseSpecSchema.safeParse(goldenCase()).success).toBe(true);
  });

  it("rejects a case with an empty id", () => {
    expect(
      caseSpecSchema.safeParse({ ...goldenCase(), id: "" }).success,
    ).toBe(false);
  });

  it("rejects unknown keys on a case (strictObject)", () => {
    expect(
      caseSpecSchema.safeParse({ ...goldenCase(), extra: 1 }).success,
    ).toBe(false);
  });
});

describe("loadSuite", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "rubric-spec-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeYaml(name: string, value: unknown): string {
    const path = join(dir, name);
    writeFileSync(path, toYaml(value), "utf8");
    return path;
  }

  it("loads a golden suite with inline cases", () => {
    const path = writeYaml("suite.yaml", goldenSuite());
    const res = loadSuite(path);
    if (!res.ok) throw new Error(res.error);
    expect(res.data.spec.suite).toBe("settle-bill-review");
    expect(res.data.cases).toHaveLength(1);
    expect(res.data.cases[0]?.id).toBe("case_071");
    expect(res.data.suitePath).toBe(path);
    expect(res.data.suiteDir).toBe(dir);
  });

  it("inlines cases from a glob, sorted deterministically", () => {
    writeGlobCases(dir);
    const suite = { ...goldenSuite(), cases: "./cases/*.yaml" };
    const path = writeYaml("suite.yaml", suite);

    const res = loadSuite(path);
    if (!res.ok) throw new Error(res.error);
    // Files written b.yaml then a.yaml; loader sorts by absolute path.
    expect(res.data.cases.map((c) => c.id)).toEqual(["case_a", "case_b"]);
  });

  it("errors when a glob matches no files", () => {
    const suite = { ...goldenSuite(), cases: "./cases/*.yaml" };
    const path = writeYaml("suite.yaml", suite);
    const res = loadSuite(path);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("matched no files");
  });

  it("errors on a duplicate inline case id", () => {
    const dup = {
      ...goldenSuite(),
      cases: [goldenCase(), { ...goldenCase() }],
    };
    const path = writeYaml("suite.yaml", dup);
    const res = loadSuite(path);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("duplicate case id");
  });

  it("errors on a schema-invalid suite instead of throwing", () => {
    const bad = { ...goldenSuite(), version: 99 };
    const path = writeYaml("suite.yaml", bad);
    const res = loadSuite(path);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("suite");
  });

  it("errors on invalid YAML instead of throwing", () => {
    const path = join(dir, "suite.yaml");
    writeFileSync(path, "version: 1\n  : : bad", "utf8");
    const res = loadSuite(path);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("not valid YAML");
  });

  it("errors when the suite file is missing", () => {
    const res = loadSuite(join(dir, "does-not-exist.yaml"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("cannot read");
  });

  function writeGlobCases(suiteDir: string): void {
    const casesDir = join(suiteDir, "cases");
    mkdirSync(casesDir, { recursive: true });
    // Write out of order so the deterministic sort is actually exercised.
    writeFileSync(
      join(casesDir, "b.yaml"),
      toYaml({ ...goldenCase(), id: "case_b", label: "b" }),
      "utf8",
    );
    writeFileSync(
      join(casesDir, "a.yaml"),
      toYaml({ ...goldenCase(), id: "case_a", label: "a" }),
      "utf8",
    );
  }
});

/* ------------------------------------------------------------------ */
/* DB round-trip — proves the spec's case shape persists through the    */
/* real drizzle schema. Uses a tmp file SQLite DB (RUBRIC_DB) built by   */
/* the real migrator; no network, no API key.                           */
/*                                                                      */
/* db/index.ts is a module singleton that reads RUBRIC_DB at load, so we */
/* set the env to a temp file BEFORE dynamically importing @/db and do   */
/* it ONCE in beforeAll (mirrors aggregate.test.ts). Re-importing per    */
/* test would race other DB test files for the shared singleton.         */
/* ------------------------------------------------------------------ */

describe("spec → db round-trip", () => {
  type DbModule = typeof import("@/db");
  let tmpDir: string;
  let db: DbModule["db"];
  let schema: DbModule["schema"];
  let runId: number;
  let goldenCaseSpec: ReturnType<typeof caseSpecSchema.parse>;

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "rubric-spec-db-"));
    process.env.RUBRIC_DB = join(tmpDir, "test.db");

    const dbMod = await import("@/db");
    db = dbMod.db;
    schema = dbMod.schema;
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, {
      migrationsFolder: join(import.meta.dirname, "..", "..", "db", "migrations"),
    });

    // Seed the FK chain a case needs: suite → prompt version → run.
    const spec = suiteSpecSchema.parse(goldenSuite());
    const now = new Date("2026-06-17T00:00:00Z");

    const [suite] = await db
      .insert(schema.suites)
      .values({
        slug: spec.suite,
        title: spec.title,
        repo: spec.repo ?? "unknown/repo",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (suite === undefined) throw new Error("seed: suite insert returned nothing");

    const [prompt] = await db
      .insert(schema.promptVersions)
      .values({
        suiteId: suite.id,
        label: spec.prompt.version,
        ref: spec.prompt.ref ?? null,
        body: "system prompt body",
        createdAt: now,
      })
      .returning();
    if (prompt === undefined) throw new Error("seed: prompt insert returned nothing");

    const [run] = await db
      .insert(schema.runs)
      .values({
        suiteId: suite.id,
        promptVersionId: prompt.id,
        sha: "deadbeef",
        branch: "main",
        status: "completed",
        startedAt: now,
      })
      .returning();
    if (run === undefined) throw new Error("seed: run insert returned nothing");
    runId = run.id;

    // Persist the golden case through the real schema.
    goldenCaseSpec = caseSpecSchema.parse(goldenCase());
    await db.insert(schema.cases).values({
      runId: run.id,
      caseId: goldenCaseSpec.id,
      label: goldenCaseSpec.label ?? null,
      input: goldenCaseSpec.input,
      expected: goldenCaseSpec.expect,
      verdict: "pass",
      score: 1,
    });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  it("reads back the persisted golden case verbatim", async () => {
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(schema.cases)
      .where(eq(schema.cases.runId, runId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.caseId).toBe("case_071");
    expect(rows[0]?.label).toBe("split-tender checkout");
    expect(rows[0]?.verdict).toBe("pass");
    expect(rows[0]?.score).toBe(1);
  });

  it("round-trips the input/expected JSON blobs unchanged", async () => {
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .select()
      .from(schema.cases)
      .where(eq(schema.cases.runId, runId));
    if (row === undefined) throw new Error("expected a seeded case row");

    // JSON columns serialize/deserialize the original spec blobs faithfully.
    expect(row.input).toEqual(goldenCaseSpec.input);
    expect(row.expected).toEqual(goldenCaseSpec.expect);
  });
});
