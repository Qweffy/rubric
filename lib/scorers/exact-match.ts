import { type ExactMatchScorer } from "@/lib/spec/types";

import { ABSENT, deepEqual, preview, resolvePath } from "./internal";
import { type Scorer, type ScoreResult } from "./types";

/* ------------------------------------------------------------------ */
/* exact-match scorer.                                                  */
/*                                                                      */
/* deep-equal: the whole actual output must structurally equal expect.  */
/* by-path:    every dotted key in expect is resolved on actual and     */
/*             compared leaf-by-leaf. A missing path fails as "absent".  */
/*                                                                      */
/* Binary by nature: score is 0 or 1, pass mirrors score === 1.         */
/* ------------------------------------------------------------------ */

function scoreDeepEqual(actual: unknown, expect: unknown): ScoreResult {
  if (deepEqual(actual, expect)) {
    return { pass: true, score: 1, detail: "output deep-equals expected", errors: [] };
  }
  return {
    pass: false,
    score: 0,
    detail: "output differs from expected",
    errors: [`$ — expected ${preview(expect)}, got ${preview(actual)}`],
  };
}

function scoreByPath(actual: unknown, expect: unknown): ScoreResult {
  // by-path treats `expect` as a flat map of dotted-path -> expected value.
  if (typeof expect !== "object" || expect === null || Array.isArray(expect)) {
    return {
      pass: false,
      score: 0,
      detail: "by-path expects an object of path → value",
      errors: ["$ — expected blob is not a path map"],
    };
  }

  const entries = Object.entries(expect);
  if (entries.length === 0) {
    return { pass: true, score: 1, detail: "no paths to check", errors: [] };
  }

  const errors: string[] = [];
  for (const [path, expectedValue] of entries) {
    const resolved = resolvePath(actual, path);
    if (resolved === ABSENT) {
      errors.push(`$.${path} — absent`);
      continue;
    }
    if (!deepEqual(resolved, expectedValue)) {
      errors.push(
        `$.${path} — expected ${preview(expectedValue)}, got ${preview(resolved)}`,
      );
    }
  }

  if (errors.length === 0) {
    const n = entries.length;
    return {
      pass: true,
      score: 1,
      detail: `${n}/${n} paths matched`,
      errors: [],
    };
  }
  const matched = entries.length - errors.length;
  return {
    pass: false,
    score: 0,
    detail: `${matched}/${entries.length} paths matched`,
    errors,
  };
}

/** Build an exact-match scorer from its validated spec slice. */
export function exactMatch(spec: ExactMatchScorer): Scorer {
  return {
    name: spec.name,
    weight: spec.weight,
    score(actual, expect): Promise<ScoreResult> {
      const result =
        spec.mode === "deep-equal"
          ? scoreDeepEqual(actual, expect)
          : scoreByPath(actual, expect);
      return Promise.resolve(result);
    },
  };
}
