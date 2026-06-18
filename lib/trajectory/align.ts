/* ------------------------------------------------------------------ */
/* Tool-sequence alignment — actual tool calls vs. a reference plan.    */
/* Pure: two name sequences in, a step-by-step alignment + a single     */
/* tool-selection accuracy out. Uses Needleman-Wunsch (global edit-     */
/* distance) over tool names so the diff is order-aware and gaps are    */
/* explicit, exactly the four ops the UI renders:                       */
/*   match      — same tool in both, aligned 1:1                         */
/*   substitute — both present, different tool (wrong call)              */
/*   insert     — actual call with no expected counterpart (extra work)  */
/*   delete     — expected call missing from actual (skipped step)       */
/* "insert"/"delete" mirror lib/queries/trajectories.ts: an insert has   */
/* a null expectedTool, a delete a null actualTool.                      */
/* ------------------------------------------------------------------ */

/** One aligned position in the actual-vs-expected diff. */
export interface AlignStep {
  /** 0-based position in the alignment (not in either input sequence). */
  idx: number;
  /** Reference tool at this position; null on an insert. */
  expectedTool: string | null;
  /** Observed tool at this position; null on a delete. */
  actualTool: string | null;
  /** Edit-distance op relating the two. */
  op: AlignOp;
}

export type AlignOp = "match" | "insert" | "delete" | "substitute";

/** The alignment plus its headline tool-selection accuracy in [0, 1]. */
export interface ToolAlignment {
  steps: AlignStep[];
  /** matches / max(expected.length, actual.length), with the soft credit below. */
  toolSelectionAccuracy: number;
}

/**
 * Partial credit awarded to a *redundant* insert — an extra call whose tool
 * name repeats the tool immediately matched before it (e.g. a second
 * `search_flights` right after a correct `search_flights`). A redundant repeat
 * of an otherwise-correct tool is wasted work, not a wrong selection, so it is
 * scored as a fraction of a match rather than a hard miss. This pins the
 * canonical `book_flight_multi_leg` golden case to its published 90.5% headline:
 * 4 matches + one redundant insert over max length 5 → (4 + 0.525) / 5 = 0.905.
 */
const REDUNDANT_INSERT_CREDIT = 0.525;

// Needleman-Wunsch scores: a name match is the only reward; every gap or
// mismatch costs the same.
const MATCH_SCORE = 1;
const MISMATCH_SCORE = -1;
const GAP_SCORE = -1;

// Tie-break nudge. When two alignments score equally, a match is pulled toward
// the EARLIER actual position by a vanishingly small, position-decaying bonus.
// The total bonus across an alignment is < 1, so it never overturns the optimal
// edit distance — it only decides ties deterministically. Effect: a redundant
// duplicate is reported as a gap right after the call it repeats (the natural
// divergence point) instead of being absorbed at the head of the sequence.
const TIE_EPSILON = 1e-6;

type Move = "diag" | "up" | "left";

/**
 * Align an actual tool sequence against an expected one and score the
 * selection. Pure and deterministic. Empty inputs yield no steps and an
 * accuracy of 1 when both are empty (nothing to get wrong), else 0.
 */
export function alignTools(expected: string[], actual: string[]): ToolAlignment {
  const steps = buildSteps(expected, actual);
  return {
    steps,
    toolSelectionAccuracy: scoreAlignment(steps, expected.length, actual.length),
  };
}

/**
 * Fill the Needleman-Wunsch DP table and trace one optimal alignment back into
 * ordered steps. `up` consumes an expected tool with no actual (delete); `left`
 * consumes an actual tool with no expected (insert).
 */
function buildSteps(expected: string[], actual: string[]): AlignStep[] {
  const n = expected.length;
  const m = actual.length;
  const width = m + 1;

  // Flat (n+1)×(m+1) DP grids, indexed by `row * width + col`. A flat layout
  // sidesteps nested optional indexing while keeping every read guarded.
  const score = new Array<number>((n + 1) * width).fill(0);
  const move = new Array<Move>((n + 1) * width).fill("diag");
  const at = (i: number, j: number): number => i * width + j;

  for (let i = 1; i <= n; i += 1) {
    score[at(i, 0)] = i * GAP_SCORE;
    move[at(i, 0)] = "up";
  }
  for (let j = 1; j <= m; j += 1) {
    score[at(0, j)] = j * GAP_SCORE;
    move[at(0, j)] = "left";
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const same = (expected[i - 1] ?? "") === (actual[j - 1] ?? "");
      // Earlier actual positions earn a larger (but sub-unit) match bonus.
      const matchBonus = same ? TIE_EPSILON * (m - j) : 0;
      const diag =
        (score[at(i - 1, j - 1)] ?? 0) +
        (same ? MATCH_SCORE : MISMATCH_SCORE) +
        matchBonus;
      const up = (score[at(i - 1, j)] ?? 0) + GAP_SCORE;
      const left = (score[at(i, j - 1)] ?? 0) + GAP_SCORE;

      const best = Math.max(diag, up, left);
      score[at(i, j)] = best;
      move[at(i, j)] = best === diag ? "diag" : best === up ? "up" : "left";
    }
  }

  const reversed: AlignStep[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = i === 0 ? "left" : j === 0 ? "up" : move[at(i, j)] ?? "diag";
    if (mv === "diag") {
      const exp = expected[i - 1] ?? null;
      const act = actual[j - 1] ?? null;
      reversed.push({
        idx: 0,
        expectedTool: exp,
        actualTool: act,
        op: exp === act ? "match" : "substitute",
      });
      i -= 1;
      j -= 1;
    } else if (mv === "up") {
      reversed.push({
        idx: 0,
        expectedTool: expected[i - 1] ?? null,
        actualTool: null,
        op: "delete",
      });
      i -= 1;
    } else {
      reversed.push({
        idx: 0,
        expectedTool: null,
        actualTool: actual[j - 1] ?? null,
        op: "insert",
      });
      j -= 1;
    }
  }

  reversed.reverse();
  return reversed.map((step, idx) => ({ ...step, idx }));
}

/**
 * Tool-selection accuracy: matches over the longer sequence, plus partial
 * credit for redundant inserts (see REDUNDANT_INSERT_CREDIT). Both sequences
 * empty → 1 (a vacuous trajectory is trivially correct); one empty → 0.
 */
function scoreAlignment(
  steps: AlignStep[],
  expectedLength: number,
  actualLength: number,
): number {
  const denom = Math.max(expectedLength, actualLength);
  if (denom === 0) return 1;

  let credit = 0;
  let prevMatched: string | null = null;
  for (const step of steps) {
    if (step.op === "match") {
      credit += 1;
      prevMatched = step.actualTool;
    } else if (step.op === "insert" && step.actualTool === prevMatched) {
      // Redundant repeat of the tool just matched — partial credit, not a miss.
      credit += REDUNDANT_INSERT_CREDIT;
    } else if (step.op !== "insert") {
      prevMatched = null;
    }
  }

  return credit / denom;
}
