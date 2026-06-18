"use client";

import { type ReactNode } from "react";

/**
 * Unified line diff of the ACTUAL output against a comparison side (the EXPECTED
 * blob, or the previous run's actual). Lines present in `compare` but absent in
 * `actual` render as removals (`−`, red, struck); lines only in `actual` render
 * as additions (`+`, phosphor); shared lines are context. This reproduces the
 * design's ACTUAL pane where the removed `secondary_payment` line is the
 * regression story.
 *
 * The blobs are opaque JSON, so we diff their pretty-printed textual lines —
 * the same surface the runner serializes. No external diff lib: a short LCS
 * over physical lines keeps it deterministic and SSR-stable.
 */
export interface CaseActualDiffProps {
  /** The decoded actual output, or null when nothing was captured. */
  actual: unknown;
  /** The side actual is compared against (expected blob or prior actual). */
  compare: unknown;
}

type DiffKind = "context" | "add" | "remove";
interface DiffRow {
  kind: DiffKind;
  text: string;
  /** 1-based number on the compare/actual axis; omitted on additions. */
  num?: number;
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Minimal LCS line diff: emits removals (compare-only), additions, context. */
function diffLines(compareText: string, actualText: string): DiffRow[] {
  const a = compareText.split("\n");
  const b = actualText.split("\n");
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = longest common subsequence length of a[i:] and b[j:].
  const lcs: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i -= 1) {
    const rowI = lcs[i] ?? [];
    const rowNext = lcs[i + 1] ?? [];
    for (let j = m - 1; j >= 0; j -= 1) {
      const match = (rowNext[j + 1] ?? 0) + 1;
      const skip = Math.max(rowNext[j] ?? 0, rowI[j + 1] ?? 0);
      rowI[j] = a[i] === b[j] ? match : skip;
    }
    lcs[i] = rowI;
  }

  const at = (i: number, j: number): number => lcs[i]?.[j] ?? 0;
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let num = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      num += 1;
      rows.push({ kind: "context", text: a[i] ?? "", num });
      i += 1;
      j += 1;
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      num += 1;
      rows.push({ kind: "remove", text: a[i] ?? "", num });
      i += 1;
    } else {
      rows.push({ kind: "add", text: b[j] ?? "" });
      j += 1;
    }
  }
  while (i < n) {
    num += 1;
    rows.push({ kind: "remove", text: a[i] ?? "", num });
    i += 1;
  }
  while (j < m) {
    rows.push({ kind: "add", text: b[j] ?? "" });
    j += 1;
  }
  return rows;
}

const GLYPH: Record<DiffKind, string> = { context: " ", add: "+", remove: "−" };
const GLYPH_COLOR: Record<DiffKind, string> = {
  context: "var(--text-low)",
  add: "var(--phosphor)",
  remove: "var(--red)",
};
const ROW_BG: Record<DiffKind, string | undefined> = {
  context: undefined,
  add: "var(--phosphor-08)",
  remove: "var(--red-14)",
};
const NUM_COLOR: Record<DiffKind, string> = {
  context: "var(--text-low)",
  add: "var(--phosphor)",
  remove: "var(--red)",
};

export function CaseActualDiff({ actual, compare }: CaseActualDiffProps): ReactNode {
  const rows = diffLines(stringify(compare), stringify(actual));

  return (
    <div style={{ font: "500 12px/1.7 var(--font-mono)", padding: "10px 12px" }}>
      {rows.map((row, idx) => {
        const codeColor =
          row.kind === "context" ? "var(--text-mid)" : "var(--text-hi)";
        return (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "30px 16px 1fr",
              alignItems: "baseline",
              background: ROW_BG[row.kind],
            }}
          >
            <span
              style={{
                color: NUM_COLOR[row.kind],
                textAlign: "right",
                paddingRight: 8,
                userSelect: "none",
                font: "500 11px/1.7 var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.num ?? " "}
            </span>
            <span
              style={{
                color: GLYPH_COLOR[row.kind],
                textAlign: "center",
                userSelect: "none",
                fontWeight: 700,
              }}
            >
              {GLYPH[row.kind]}
            </span>
            <span
              style={{
                color: codeColor,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                textDecoration: row.kind === "remove" ? "line-through" : undefined,
                textDecorationColor:
                  row.kind === "remove"
                    ? "color-mix(in srgb, var(--red) 70%, transparent)"
                    : undefined,
              }}
            >
              {row.text === "" ? " " : row.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
