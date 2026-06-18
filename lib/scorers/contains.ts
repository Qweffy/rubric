import { type ContainsScorer } from "@/lib/spec/types";

import { stringify } from "./internal";
import { type Scorer, type ScoreResult } from "./types";

/* ------------------------------------------------------------------ */
/* contains scorer.                                                     */
/*                                                                      */
/* Asserts the actual output contains a substring (default) or matches  */
/* a regular expression. The actual output is coerced to a string first  */
/* — non-string outputs are JSON-stringified so "contains a field name"  */
/* style checks work against structured blobs too.                      */
/*                                                                      */
/* Regex mode runs an attacker-influenced pattern against possibly       */
/* large model output, so it is a real ReDoS surface (the lint floor     */
/* flags it). Two guards: the pattern length is bounded, and patterns    */
/* with the nested-quantifier shapes that drive catastrophic backtracking */
/* are rejected at build time rather than compiled.                     */
/* ------------------------------------------------------------------ */

// Upper bound on regex source length. Long hand-rolled patterns are the usual
// vehicle for ReDoS; legitimate `contains` patterns are short markers.
const MAX_PATTERN_LENGTH = 200;

// Heuristic for the classic catastrophic-backtracking shapes:
//   (a+)+   (a*)*   (a+)*   (.*)+   (\w+)*   — a quantified group whose body is
// itself quantified. Not exhaustive, but it blocks the patterns that actually
// blow up, and pairs with the length bound + the lint's own unsafe-regex check.
const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*]/;

function compilePattern(pattern: string): RegExp {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(
      `contains pattern exceeds ${MAX_PATTERN_LENGTH.toString()} chars`,
    );
  }
  if (NESTED_QUANTIFIER.test(pattern)) {
    throw new Error("contains pattern has a nested quantifier (ReDoS risk)");
  }
  try {
    // reason: pattern is bounded in length and screened for nested quantifiers
    // above, so this non-literal RegExp is a vetted, not arbitrary, source.
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(pattern);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "unknown error";
    throw new Error(`contains pattern is not a valid regex: ${message}`);
  }
}

/** Build a contains scorer from its validated spec slice. */
export function contains(spec: ContainsScorer): Scorer {
  // Compile eagerly so a bad pattern fails at build time, not per-case.
  const matcher = spec.regex ? compilePattern(spec.pattern) : null;
  const label = spec.regex ? "matches" : "contains";

  return {
    name: spec.name,
    weight: spec.weight,
    score(actual): Promise<ScoreResult> {
      const text = stringify(actual);
      const hit = matcher !== null ? matcher.test(text) : text.includes(spec.pattern);
      if (hit) {
        return Promise.resolve({
          pass: true,
          score: 1,
          detail: `output ${label} /${spec.pattern}/`,
          errors: [],
        });
      }
      return Promise.resolve({
        pass: false,
        score: 0,
        detail: `output does not ${label.replace(/es$/, "")} /${spec.pattern}/`,
        errors: [`$ — expected output to ${label} ${spec.pattern}`],
      });
    },
  };
}
