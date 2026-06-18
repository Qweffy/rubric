import { Ajv, type ErrorObject, type ValidateFunction } from "ajv";

import { type JsonSchemaScorer } from "@/lib/spec/types";

import { type Scorer, type ScoreResult } from "./types";

/* ------------------------------------------------------------------ */
/* json-schema scorer.                                                  */
/*                                                                      */
/* Validates the actual output against the JSON Schema carried inline   */
/* on the spec. ajv compilation is the expensive step, so each distinct */
/* schema is compiled once and the validator cached — the same suite    */
/* reuses one validator across every case. ajv errors are rendered as   */
/* "$.path — message" lines for the report.                             */
/* ------------------------------------------------------------------ */

// Shared instance: allowUnionTypes keeps real-world schemas (type: [..]) from
// throwing at compile time. One Ajv owns the validator cache for the process.
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });

// Compiled validators keyed by a stable serialization of the schema object.
// Two scorers with structurally identical schemas share one compiled fn.
const validatorCache = new Map<string, ValidateFunction>();

/** Stable JSON key with object keys sorted, so key order never busts the cache. */
function cacheKey(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, Object.keys(flattenKeys(schema)).sort());
}

// Collect every key name appearing anywhere in the schema so JSON.stringify's
// replacer-array form emits a deterministic, order-independent serialization.
function flattenKeys(value: unknown, acc: Record<string, true> = {}): Record<string, true> {
  if (Array.isArray(value)) {
    for (const item of value) flattenKeys(item, acc);
    return acc;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      acc[key] = true;
      flattenKeys(child, acc);
    }
  }
  return acc;
}

function getValidator(schema: Record<string, unknown>): ValidateFunction {
  const key = cacheKey(schema);
  const cached = validatorCache.get(key);
  if (cached !== undefined) return cached;
  const compiled = ajv.compile(schema);
  validatorCache.set(key, compiled);
  return compiled;
}

/** "$.items.0.sku — must be string" — ajv error path joined onto the message. */
function formatError(error: ErrorObject): string {
  // ajv's instancePath is JSON-pointer-ish ("/items/0/sku"); normalize to "$.x".
  const pointer = error.instancePath.replace(/\//g, ".");
  const path = pointer.length > 0 ? `$${pointer}` : "$";
  const missing =
    error.keyword === "required" && typeof error.params.missingProperty === "string"
      ? `.${error.params.missingProperty}`
      : "";
  return `${path}${missing} — ${error.message ?? "invalid"}`;
}

/** Build a json-schema scorer from its validated spec slice. */
export function jsonSchema(spec: JsonSchemaScorer): Scorer {
  // Compile eagerly at build time so a malformed schema fails fast on startup,
  // not silently on the first case.
  const validate = getValidator(spec.schema);

  return {
    name: spec.name,
    weight: spec.weight,
    score(actual): Promise<ScoreResult> {
      const valid = validate(actual);
      if (valid) {
        return Promise.resolve({
          pass: true,
          score: 1,
          detail: "output satisfies schema",
          errors: [],
        });
      }
      const errors = (validate.errors ?? []).map(formatError);
      return Promise.resolve({
        pass: false,
        score: 0,
        detail:
          errors.length === 1
            ? "1 schema violation"
            : `${errors.length} schema violations`,
        errors,
      });
    },
  };
}
