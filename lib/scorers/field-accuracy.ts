import { type FieldAccuracyScorer } from "@/lib/spec/types";

import { ABSENT, deepEqual, lookupFlat, resolvePath } from "./internal";
import { type Scorer, type ScoreResult } from "./types";

/* ------------------------------------------------------------------ */
/* field-accuracy scorer.                                               */
/*                                                                      */
/* Partial-credit cousin of exact-match by-path. For each configured    */
/* field path the actual leaf (resolved by dotted path) is compared to   */
/* its expected value (read by flat dotted key out of the expect slice). */
/* The score is matched / total. Unlike exact-match, one miss does not    */
/* zero the case — it passes once the ratio clears `threshold` (0.95).   */
/*                                                                      */
/* A field with no value in the expect slice is a config error for that  */
/* field (nothing to match against) and counts as a miss. The detail     */
/* names the first miss, e.g. "6/8 fields matched · secondary_payment    */
/* absent".                                                              */
/* ------------------------------------------------------------------ */

interface FieldMiss {
  field: string;
  /** Last path segment — the terse name surfaced in the detail line. */
  leaf: string;
  reason: "absent" | "mismatch" | "no-expected";
}

function leafOf(path: string): string {
  const segments = path.split(".");
  return segments[segments.length - 1] ?? path;
}

/** Build a field-accuracy scorer from its validated spec slice. */
export function fieldAccuracy(spec: FieldAccuracyScorer): Scorer {
  const fields = spec.fields;
  const total = fields.length;

  return {
    name: spec.name,
    weight: spec.weight,
    score(actual, expect): Promise<ScoreResult> {
      let matched = 0;
      const misses: FieldMiss[] = [];

      for (const path of fields) {
        const expected = lookupFlat(expect, path);
        if (expected === ABSENT) {
          misses.push({ field: path, leaf: leafOf(path), reason: "no-expected" });
          continue;
        }
        const got = resolvePath(actual, path);
        if (got === ABSENT) {
          misses.push({ field: path, leaf: leafOf(path), reason: "absent" });
          continue;
        }
        if (deepEqual(got, expected)) {
          matched += 1;
          continue;
        }
        misses.push({ field: path, leaf: leafOf(path), reason: "mismatch" });
      }

      // total is >= 1 by schema (fields has .min(1)), so this never divides by 0.
      const score = matched / total;
      const pass = score >= spec.threshold;
      const errors = misses.map(formatMiss);
      const first = misses[0];
      const detail =
        first !== undefined
          ? `${matched}/${total} fields matched · ${first.leaf} ${missWord(first.reason)}`
          : `${matched}/${total} fields matched`;

      return Promise.resolve({ pass, score, detail, errors });
    },
  };
}

function missWord(reason: FieldMiss["reason"]): string {
  if (reason === "no-expected") return "missing in fixture";
  return reason;
}

function formatMiss(miss: FieldMiss): string {
  if (miss.reason === "no-expected") {
    return `$.${miss.field} — no expected value in fixture`;
  }
  return `$.${miss.field} — ${miss.reason}`;
}
