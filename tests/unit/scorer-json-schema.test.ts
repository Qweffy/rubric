import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { jsonSchema } from "@/lib/scorers/json-schema";
import { buildScorer } from "@/lib/scorers/registry";
import { type ScorerContext } from "@/lib/scorers/types";
import { type JsonSchemaScorer } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* json-schema scorer — ajv validation + structured error rendering.    */
/*                                                                      */
/* The scorer itself is pure (ajv only, no DB), so the bulk of the      */
/* suite drives lib/scorers/json-schema.ts directly. The final block    */
/* exercises the persistence seam: the formatted ajv error lines must   */
/* survive a round-trip through the case_results.errors JSON column, so  */
/* it stands up a throwaway file-backed SQLite DB (RUBRIC_DB → tmp),     */
/* runs the real migration, and writes/reads via the real store.        */
/* ------------------------------------------------------------------ */

const ctx: ScorerContext = { caseId: "case-1", suite: "settle-bill-review" };

/** The record_invoice-style object schema the scorer validates against. */
const invoiceSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["vendor", "total", "lineItems"],
  properties: {
    vendor: { type: "string", minLength: 1 },
    total: { type: "number" },
    currency: { type: "string", enum: ["USD", "EUR", "ARS"] },
    lineItems: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sku", "qty"],
        properties: {
          sku: { type: "string" },
          qty: { type: "integer", minimum: 1 },
        },
      },
    },
  },
};

function spec(overrides: Partial<JsonSchemaScorer> = {}): JsonSchemaScorer {
  return {
    type: "json-schema",
    name: "invoice-shape",
    schema: invoiceSchema,
    weight: 1,
    ...overrides,
  };
}

const validInvoice = {
  vendor: "Acme Supplies",
  total: 142.5,
  currency: "USD",
  lineItems: [{ sku: "A-100", qty: 2 }],
};

describe("jsonSchema scorer — passing output", () => {
  it("passes a fully valid output with score 1 and no errors", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score(validInvoice, undefined, ctx);
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
    expect(r.errors).toEqual([]);
    expect(r.detail).toBe("output satisfies schema");
  });

  it("ignores optional properties that are absent", async () => {
    const scorer = jsonSchema(spec());
    const noCurrency = {
      vendor: validInvoice.vendor,
      total: validInvoice.total,
      lineItems: validInvoice.lineItems,
    };
    const r = await scorer.score(noCurrency, undefined, ctx);
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it("carries the spec name and weight onto the scorer", () => {
    const scorer = jsonSchema(spec({ name: "my-shape", weight: 3 }));
    expect(scorer.name).toBe("my-shape");
    expect(scorer.weight).toBe(3);
  });
});

describe("jsonSchema scorer — structured errors", () => {
  it("fails with score 0 and a structured error for a wrong type", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score(
      { ...validInvoice, total: "142.50" },
      undefined,
      ctx,
    );
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0);
    expect(r.errors).toHaveLength(1);
    // "$.total — must be number" — the path is rooted at $ and dotted.
    expect(r.errors[0]).toBe("$.total — must be number");
    expect(r.detail).toBe("1 schema violation");
  });

  it("renders a missing required property as $.<prop>", async () => {
    const scorer = jsonSchema(spec());
    const noVendor = {
      total: validInvoice.total,
      currency: validInvoice.currency,
      lineItems: validInvoice.lineItems,
    };
    const r = await scorer.score(noVendor, undefined, ctx);
    expect(r.pass).toBe(false);
    expect(r.errors).toContain("$.vendor — must have required property 'vendor'");
  });

  it("renders nested array paths with the index segment", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score(
      { ...validInvoice, lineItems: [{ sku: "A-100", qty: 0 }] },
      undefined,
      ctx,
    );
    expect(r.pass).toBe(false);
    // ajv instancePath "/lineItems/0/qty" normalizes to "$.lineItems.0.qty".
    expect(r.errors).toContain("$.lineItems.0.qty — must be >= 1");
  });

  it("rejects additional properties (additionalProperties: false)", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score(
      { ...validInvoice, sneaky: true },
      undefined,
      ctx,
    );
    expect(r.pass).toBe(false);
    expect(
      r.errors.some((e) => e.includes("must NOT have additional properties")),
    ).toBe(true);
  });

  it("rejects an out-of-enum value with a $-rooted path", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score(
      { ...validInvoice, currency: "GBP" },
      undefined,
      ctx,
    );
    expect(r.pass).toBe(false);
    expect(r.errors.some((e) => e.startsWith("$.currency — "))).toBe(true);
  });

  it("uses '$' (no path) for a root-level type violation", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score("not an object", undefined, ctx);
    expect(r.pass).toBe(false);
    expect(r.errors).toContain("$ — must be object");
  });

  it("collects every violation at once (allErrors) and pluralizes detail", async () => {
    const scorer = jsonSchema(spec());
    // Two independent failures: total wrong type AND vendor missing.
    const r = await scorer.score(
      {
        total: "142.50",
        currency: validInvoice.currency,
        lineItems: validInvoice.lineItems,
      },
      undefined,
      ctx,
    );
    expect(r.pass).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(2);
    expect(r.detail).toBe(`${r.errors.length} schema violations`);
    expect(r.errors).toContain("$.total — must be number");
    expect(r.errors).toContain("$.vendor — must have required property 'vendor'");
  });

  it("formats every error as '<path> — <message>'", async () => {
    const scorer = jsonSchema(spec());
    const r = await scorer.score(
      { vendor: "", total: "x", lineItems: [] },
      undefined,
      ctx,
    );
    expect(r.pass).toBe(false);
    for (const line of r.errors) {
      expect(line).toMatch(/^\$.* — .+$/);
    }
  });
});

describe("jsonSchema scorer — union types", () => {
  it("compiles and validates a schema with a union type (allowUnionTypes)", async () => {
    const scorer = jsonSchema(
      spec({
        name: "union-shape",
        schema: {
          type: "object",
          properties: { id: { type: ["string", "number"] } },
          required: ["id"],
        },
      }),
    );
    expect((await scorer.score({ id: "abc" }, undefined, ctx)).pass).toBe(true);
    expect((await scorer.score({ id: 7 }, undefined, ctx)).pass).toBe(true);
    const bad = await scorer.score({ id: true }, undefined, ctx);
    expect(bad.pass).toBe(false);
    expect(bad.errors.some((e) => e.startsWith("$.id — "))).toBe(true);
  });
});

describe("jsonSchema scorer — validator cache", () => {
  it("reuses one compiled validator for structurally identical schemas", () => {
    // Same keys, different insertion order — the cache key sorts keys, so both
    // resolve to one compiled fn. We can't read the cache directly, but a
    // re-compile of a malformed schema would throw; identical schemas never do.
    const a = jsonSchema(spec({ name: "a" }));
    const b = jsonSchema(
      spec({
        name: "b",
        schema: {
          properties: invoiceSchema.properties,
          required: invoiceSchema.required,
          additionalProperties: false,
          type: "object",
        },
      }),
    );
    expect(a.name).toBe("a");
    expect(b.name).toBe("b");
  });
});

describe("jsonSchema scorer — registry wiring", () => {
  it("builds a working scorer through buildScorer (re-validated spec)", async () => {
    const scorer = buildScorer(spec({ name: "via-registry" }));
    expect(scorer.name).toBe("via-registry");
    expect((await scorer.score(validInvoice, undefined, ctx)).pass).toBe(true);
    const bad = await scorer.score({ ...validInvoice, total: null }, undefined, ctx);
    expect(bad.pass).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* Persistence round-trip — the formatted errors survive SQLite.        */
/*                                                                      */
/* @/db reads RUBRIC_DB at module-load time, so the env var is set       */
/* BEFORE the dynamic imports inside beforeAll. Vitest would hoist a     */
/* static `import "@/db"` above this assignment, so we import lazily.    */
/* ------------------------------------------------------------------ */

describe("jsonSchema scorer — errors persist through case_results", () => {
  let tmpDir: string;
  // Lazily-imported store + schema handles (typed via the real modules).
  let store: typeof import("@/lib/store");
  let dbSchema: typeof import("@/db/schema");
  let formattedErrors: string[];

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "rubric-json-schema-"));
    process.env.RUBRIC_DB = join(tmpDir, "test.db");

    // Import AFTER RUBRIC_DB is set so the libSQL client opens the tmp file.
    const dbModule = await import("@/db");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    // Anchor the migrations folder to the repo root (this file is at
    // tests/unit/), so the run is independent of the process cwd.
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
    await migrate(dbModule.db, { migrationsFolder: join(repoRoot, "db", "migrations") });

    store = await import("@/lib/store");
    dbSchema = await import("@/db/schema");

    // Produce real scorer output to persist — not a hand-written array.
    const result = await jsonSchema(spec()).score(
      { ...validInvoice, total: "142.50", lineItems: [{ sku: "A-100", qty: 0 }] },
      undefined,
      ctx,
    );
    formattedErrors = result.errors;
    expect(formattedErrors.length).toBeGreaterThan(0);
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.RUBRIC_DB;
  });

  it("round-trips the structured ajv errors through the JSON column", async () => {
    const now = new Date();
    const suiteId = await store.insertSuite({
      slug: "settle-bill-review",
      title: "Settle Bill Review",
      repo: "rubric",
      status: "passing",
      createdAt: now,
      updatedAt: now,
    });
    const promptVersionId = await store.insertPromptVersion({
      suiteId,
      label: "v1",
      body: "extract the invoice",
      createdAt: now,
    });
    const runId = await store.insertRun({
      suiteId,
      promptVersionId,
      sha: "deadbeef",
      branch: "main",
      status: "completed",
      startedAt: now,
    });
    const caseRowId = await store.insertCase({
      runId,
      caseId: ctx.caseId,
      input: { receipt: "..." },
      expected: validInvoice,
      actual: { ...validInvoice, total: "142.50" },
      verdict: "fail",
      score: 0,
    });

    await store.insertCaseResult({
      caseRowId,
      scorerName: "invoice-shape",
      pass: false,
      score: 0,
      detail: `${formattedErrors.length} schema violations`,
      errors: formattedErrors,
    });

    const row = await store.db
      .select()
      .from(dbSchema.caseResults)
      .where(eq(dbSchema.caseResults.caseRowId, caseRowId))
      .get();

    expect(row).toBeDefined();
    expect(row?.pass).toBe(false);
    expect(row?.score).toBe(0);
    // The string[] survives the JSON serialize/parse round-trip intact.
    expect(row?.errors).toEqual(formattedErrors);
    expect(row?.errors).toContain("$.total — must be number");
    expect(row?.errors).toContain("$.lineItems.0.qty — must be >= 1");
  });
});
