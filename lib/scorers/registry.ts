import {
  containsScorerSchema,
  exactMatchScorerSchema,
  fieldAccuracyScorerSchema,
  jsonSchemaScorerSchema,
} from "@/lib/spec/schema";
import { type ScorerSpec } from "@/lib/spec/types";
import { parseOrThrow } from "@/lib/validation";

import { contains } from "./contains";
import { exactMatch } from "./exact-match";
import { fieldAccuracy } from "./field-accuracy";
import { jsonSchema } from "./json-schema";
import { type Scorer } from "./types";

/* ------------------------------------------------------------------ */
/* Scorer registry — the single place that maps a validated scorer spec */
/* to a concrete Scorer. buildScorer re-validates the spec's own config  */
/* slice through its zod schema (defense in depth: the suite parser      */
/* already ran, but a programmatically constructed spec might not have)  */
/* before handing it to the factory.                                    */
/*                                                                      */
/* `judge` is part of the spec union but is built elsewhere (it needs an */
/* LLM client this deterministic registry has no business owning), so it */
/* throws a precise error here instead of being silently dropped.       */
/* ------------------------------------------------------------------ */

/** Thrown when a scorer spec cannot be turned into a runnable scorer. */
export class ScorerBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScorerBuildError";
  }
}

/**
 * Build one Scorer from its spec. Re-parses the config slice through the
 * matching zod schema so a malformed spec fails loudly at the boundary.
 */
export function buildScorer(spec: ScorerSpec): Scorer {
  switch (spec.type) {
    case "exact-match":
      return exactMatch(parseOrThrow(exactMatchScorerSchema, spec));
    case "json-schema":
      return jsonSchema(parseOrThrow(jsonSchemaScorerSchema, spec));
    case "field-accuracy":
      return fieldAccuracy(parseOrThrow(fieldAccuracyScorerSchema, spec));
    case "contains":
      return contains(parseOrThrow(containsScorerSchema, spec));
    case "judge":
      throw new ScorerBuildError(
        `scorer "${spec.name}": judge scorers are built by the judge runner, not the deterministic registry`,
      );
  }
}

/**
 * Build every scorer in a suite, preserving order. Scorer names must be unique
 * within a suite — duplicates would collide on the (caseRowId, scorerName)
 * persistence key — so a repeat is a build error.
 */
export function buildScorers(specs: readonly ScorerSpec[]): Scorer[] {
  const seen = new Set<string>();
  const scorers: Scorer[] = [];
  for (const spec of specs) {
    if (seen.has(spec.name)) {
      throw new ScorerBuildError(`duplicate scorer name "${spec.name}"`);
    }
    seen.add(spec.name);
    scorers.push(buildScorer(spec));
  }
  return scorers;
}
