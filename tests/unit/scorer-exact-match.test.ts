import { describe, expect, it } from "vitest";

import { exactMatch } from "@/lib/scorers/exact-match";
import { buildScorer } from "@/lib/scorers/registry";
import { type ScorerContext } from "@/lib/scorers/types";
import { exactMatchScorerSchema } from "@/lib/spec/schema";
import { type ExactMatchScorer } from "@/lib/spec/types";
import { parseOrThrow } from "@/lib/validation";

/* ------------------------------------------------------------------ */
/* exact-match scorer — deterministic, pure (no DB / no network).       */
/*                                                                      */
/* Two modes, both binary (score 0 or 1, pass mirrors score === 1):     */
/*   deep-equal: the whole actual blob must structurally equal expect.   */
/*   by-path:    expect is a FLAT map of dotted-path → value; each path   */
/*               is resolved on actual and compared leaf-by-leaf.        */
/* ------------------------------------------------------------------ */

const CTX: ScorerContext = { caseId: "case-1", suite: "demo" };

function deepEqualSpec(overrides: Partial<ExactMatchScorer> = {}): ExactMatchScorer {
  return { type: "exact-match", name: "eq", mode: "deep-equal", weight: 1, ...overrides };
}

function byPathSpec(overrides: Partial<ExactMatchScorer> = {}): ExactMatchScorer {
  return { type: "exact-match", name: "paths", mode: "by-path", weight: 1, ...overrides };
}

describe("exactMatch — scorer shape", () => {
  it("carries name and weight from the spec", () => {
    const scorer = exactMatch(deepEqualSpec({ name: "my-scorer", weight: 3 }));
    expect(scorer.name).toBe("my-scorer");
    expect(scorer.weight).toBe(3);
  });

  it("scores asynchronously (returns a promise)", async () => {
    const scorer = exactMatch(deepEqualSpec());
    const result = scorer.score(1, 1, CTX);
    expect(result).toBeInstanceOf(Promise);
    expect((await result).pass).toBe(true);
  });
});

describe("exactMatch — deep-equal mode", () => {
  const scorer = exactMatch(deepEqualSpec());

  it("passes when actual structurally equals expect (nested object)", async () => {
    const blob = { extraction: { total: 85400, items: [{ sku: "A" }, { sku: "B" }] } };
    const result = await scorer.score(
      { extraction: { total: 85400, items: [{ sku: "A" }, { sku: "B" }] } },
      blob,
      CTX,
    );
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.detail).toBe("output deep-equals expected");
  });

  it("is order-insensitive on object keys", async () => {
    const result = await scorer.score({ a: 1, b: 2 }, { b: 2, a: 1 }, CTX);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1);
  });

  it("fails when actual differs, reporting a single $-rooted error", async () => {
    const result = await scorer.score({ total: 1 }, { total: 2 }, CTX);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
    expect(result.detail).toBe("output differs from expected");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("$ — expected");
    expect(result.errors[0]).toContain('{"total":2}');
    expect(result.errors[0]).toContain('{"total":1}');
  });

  it("is order-SENSITIVE on arrays", async () => {
    const ok = await scorer.score([1, 2, 3], [1, 2, 3], CTX);
    expect(ok.pass).toBe(true);
    const reordered = await scorer.score([1, 2, 3], [3, 2, 1], CTX);
    expect(reordered.pass).toBe(false);
  });

  it("fails on length mismatch and array-vs-object mismatch", async () => {
    expect((await scorer.score([1, 2], [1, 2, 3], CTX)).pass).toBe(false);
    expect((await scorer.score({ "0": 1 }, [1], CTX)).pass).toBe(false);
  });

  it("treats NaN as equal to NaN", async () => {
    expect((await scorer.score(NaN, NaN, CTX)).pass).toBe(true);
    expect((await scorer.score({ x: NaN }, { x: NaN }, CTX)).pass).toBe(true);
  });

  it("treats -0 and 0 as equal (=== identity)", async () => {
    expect((await scorer.score(-0, 0, CTX)).pass).toBe(true);
  });

  it("distinguishes null from a missing/undefined-shaped value", async () => {
    expect((await scorer.score(null, null, CTX)).pass).toBe(true);
    expect((await scorer.score({ a: null }, { a: undefined }, CTX)).pass).toBe(false);
  });

  it("matches scalars and empty containers", async () => {
    expect((await scorer.score("hi", "hi", CTX)).pass).toBe(true);
    expect((await scorer.score("hi", "bye", CTX)).pass).toBe(false);
    expect((await scorer.score({}, {}, CTX)).pass).toBe(true);
    expect((await scorer.score([], [], CTX)).pass).toBe(true);
  });
});

describe("exactMatch — by-path mode", () => {
  const scorer = exactMatch(byPathSpec());

  const actual = {
    extraction: { total: 85400, currency: "USD" },
    items: [{ sku: "A-1" }, { sku: "B-2" }],
    flag: false,
  };

  it("passes when every dotted path resolves and matches, reporting n/n", async () => {
    const result = await scorer.score(
      actual,
      { "extraction.total": 85400, "items.1.sku": "B-2", flag: false },
      CTX,
    );
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.detail).toBe("3/3 paths matched");
  });

  it("resolves numeric segments as array indices", async () => {
    const result = await scorer.score(actual, { "items.0.sku": "A-1" }, CTX);
    expect(result.pass).toBe(true);
  });

  it("fails a present-but-different leaf with an expected/got error", async () => {
    const result = await scorer.score(actual, { "extraction.total": 99999 }, CTX);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
    expect(result.detail).toBe("0/1 paths matched");
    expect(result.errors).toEqual([
      "$.extraction.total — expected 99999, got 85400",
    ]);
  });

  it("fails a missing path as 'absent' (distinct from a value mismatch)", async () => {
    const result = await scorer.score(actual, { "extraction.tax": 0 }, CTX);
    expect(result.pass).toBe(false);
    expect(result.errors).toEqual(["$.extraction.tax — absent"]);
  });

  it("treats an out-of-range array index as absent", async () => {
    const result = await scorer.score(actual, { "items.5.sku": "Z" }, CTX);
    expect(result.pass).toBe(false);
    expect(result.errors).toEqual(["$.items.5.sku — absent"]);
  });

  it("treats descending past a primitive as absent", async () => {
    const result = await scorer.score(actual, { "flag.deeper": 1 }, CTX);
    expect(result.pass).toBe(false);
    expect(result.errors).toEqual(["$.flag.deeper — absent"]);
  });

  it("reports a mixed pass/fail tally with one error per failing path", async () => {
    const result = await scorer.score(
      actual,
      {
        "extraction.total": 85400, // ok
        "extraction.currency": "EUR", // mismatch
        "items.9.sku": "Z", // absent
      },
      CTX,
    );
    expect(result.pass).toBe(false);
    expect(result.detail).toBe("1/3 paths matched");
    // preview() returns raw strings verbatim (no JSON quoting), so EUR not "EUR".
    expect(result.errors).toEqual([
      "$.extraction.currency — expected EUR, got USD",
      "$.items.9.sku — absent",
    ]);
  });

  it("compares a path leaf with deep equality (nested object value)", async () => {
    const root = { extraction: { meta: { lines: [1, 2] } } };
    const pass = await scorer.score(root, { "extraction.meta": { lines: [1, 2] } }, CTX);
    expect(pass.pass).toBe(true);
    const fail = await scorer.score(root, { "extraction.meta": { lines: [2, 1] } }, CTX);
    expect(fail.pass).toBe(false);
  });

  it("passes vacuously on an empty path map", async () => {
    const result = await scorer.score(actual, {}, CTX);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1);
    expect(result.detail).toBe("no paths to check");
  });

  it("rejects a non-object expect blob (array / scalar / null)", async () => {
    for (const bad of [["extraction.total"], 42, "x", null]) {
      const result = await scorer.score(actual, bad, CTX);
      expect(result.pass).toBe(false);
      expect(result.score).toBe(0);
      expect(result.detail).toBe("by-path expects an object of path → value");
      expect(result.errors).toEqual(["$ — expected blob is not a path map"]);
    }
  });
});

describe("buildScorer — registry path", () => {
  it("builds an exact-match scorer from a spec and runs it", async () => {
    const scorer = buildScorer(deepEqualSpec({ name: "registry-eq", weight: 2 }));
    expect(scorer.name).toBe("registry-eq");
    expect(scorer.weight).toBe(2);
    expect((await scorer.score({ a: 1 }, { a: 1 }, CTX)).pass).toBe(true);
    expect((await scorer.score({ a: 1 }, { a: 2 }, CTX)).pass).toBe(false);
  });

  it("applies the weight default (1) when omitted from the raw spec", () => {
    // A raw spec without `weight`: zod fills the default, the registry re-parses,
    // and the built scorer carries weight 1.
    const raw: unknown = { type: "exact-match", name: "defaulted", mode: "by-path" };
    const spec = parseOrThrow(exactMatchScorerSchema, raw);
    expect(spec.weight).toBe(1);
    expect(buildScorer(spec).weight).toBe(1);
  });
});
