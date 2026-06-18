/* ------------------------------------------------------------------ */
/* Scorer internals — deterministic helpers shared by the concrete      */
/* scorers. No I/O, no LLM, no Date.now(): pure functions so the scorers */
/* stay unit-testable. Not part of the public scorer seam (types.ts).    */
/* ------------------------------------------------------------------ */

/** A path segment is missing on the actual blob (vs. present-but-different). */
export const ABSENT = Symbol("absent");

/**
 * What {@link resolvePath} yields: the leaf value, or the {@link ABSENT}
 * sentinel when a segment was missing. `unknown` already subsumes the sentinel,
 * so this alias is documentation, not a wider type.
 */
export type Resolved = unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolve a dotted path like `extraction.total` or `items.0.sku` against an
 * arbitrary blob. Returns {@link ABSENT} when any segment is missing so the
 * caller can distinguish "absent" from "present but undefined". Numeric
 * segments index into arrays; everything else indexes object keys.
 */
export function resolvePath(root: unknown, path: string): Resolved {
  const segments = path.split(".");
  let current: unknown = root;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return ABSENT;
      }
      current = current[index];
      continue;
    }
    if (isRecord(current)) {
      if (!Object.prototype.hasOwnProperty.call(current, segment)) return ABSENT;
      current = current[segment];
      continue;
    }
    // Primitive (or null) reached before the path was exhausted.
    return ABSENT;
  }
  return current;
}

/**
 * Read a flat dotted key out of an `expect` slice. The path-based scorers'
 * expected blob is a *flat* map — `{ "extraction.total": 85400 }` — where the
 * dotted string is a literal key, NOT a nested path. Returns {@link ABSENT}
 * when the slice is not a record or the key is missing.
 */
export function lookupFlat(slice: unknown, key: string): Resolved {
  if (!isRecord(slice)) return ABSENT;
  if (!Object.prototype.hasOwnProperty.call(slice, key)) return ABSENT;
  return slice[key];
}

/**
 * Structural deep equality. Order-insensitive on object keys, order-sensitive
 * on arrays. NaN equals NaN (so numeric fixtures round-trip); -0 equals 0.
 * Functions, symbols and class instances compare by reference. No cycles are
 * expected in JSON-derived blobs, so this does not guard against them.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // NaN is the one primitive where `===` lies.
  if (typeof a === "number" && typeof b === "number") {
    return Number.isNaN(a) && Number.isNaN(b);
  }

  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;

  if (aIsArray && bIsArray) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (!isRecord(a) || !isRecord(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Total string coercion that never returns undefined. JSON.stringify yields
 * undefined for `undefined`, functions and symbols, so those are coerced via
 * String() up front; everything else round-trips through JSON.
 */
export function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    // Unserializable (e.g. circular). A stable marker beats "[object Object]".
    return "[unserializable]";
  }
}

/** Compact one-line preview of a value for failure messages. Bounded length. */
export function preview(value: unknown, max = 60): string {
  const text = stringify(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
