/* ------------------------------------------------------------------ */
/* Tool confusion matrix — which expected tool got swapped for which.   */
/* Pure: a flat list of (expected, actual) tool pairings in, a nested   */
/* count map out. Rows are the expected (reference) tool, columns the   */
/* actual tool the agent called. The diagonal (expected === actual) is  */
/* correct selections; off-diagonal cells are the substitution patterns */
/* the Error Workbench surfaces — "check_seats" mistaken for "hold_seat" */
/* and so on. A null on either side marks an unmatched gap:             */
/*   expected null → an inserted call with no reference                 */
/*   actual   null → a deleted (skipped) expected call                  */
/* Gaps are bucketed under the GAP key so they never collide with a     */
/* real tool name.                                                      */
/* ------------------------------------------------------------------ */

/** Sentinel column/row for an unmatched gap (insert with no expected, or vice versa). */
export const GAP = "∅";

/** One aligned pairing: the expected tool and the tool actually called. */
export interface ToolPair {
  /** Reference tool, or null when the actual call was an insert. */
  expected: string | null;
  /** Observed tool, or null when the expected call was deleted. */
  actual: string | null;
}

/**
 * Nested count map: `matrix[expectedTool][actualTool]` is how many times that
 * expected tool was paired with that actual tool. Missing keys mean a zero
 * count. Unmatched sides are keyed by GAP.
 */
export type ConfusionMap = Record<string, Record<string, number>>;

/**
 * Tally a tool confusion matrix from aligned (expected, actual) pairings. Pure —
 * one pass, lazily creating rows. The counts across all cells equal `pairs.length`.
 * Null on either side is folded into the GAP bucket so inserts/deletes are
 * countable without clobbering a tool named after the sentinel.
 */
export function toolConfusion(pairs: ToolPair[]): ConfusionMap {
  const matrix: ConfusionMap = {};
  for (const { expected, actual } of pairs) {
    const row = expected ?? GAP;
    const col = actual ?? GAP;
    const cells = (matrix[row] ??= {});
    cells[col] = (cells[col] ?? 0) + 1;
  }
  return matrix;
}
