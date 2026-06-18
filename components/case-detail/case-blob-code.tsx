"use client";

import { type ReactNode } from "react";

/**
 * Render an opaque JSON blob (input / expected / actual) as a line-numbered
 * mono code block, matching the design's INPUT / EXPECTED panes. The blobs are
 * arbitrary JSON validated upstream by the runner, so we pretty-print them and
 * lay each physical line into the `.cl` two-column (line-number · code) grid.
 *
 * `highlightLines` paints a phosphor wash on the given 1-based line numbers
 * (the EXPECTED pane spotlights the `secondary_payment` requirement).
 */
export interface CaseBlobCodeProps {
  /** The decoded JSON value, or null when no output was captured. */
  value: unknown;
  /** 1-based line numbers to spotlight phosphor. */
  highlightLines?: number[];
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function CaseBlobCode({ value, highlightLines = [] }: CaseBlobCodeProps): ReactNode {
  const highlight = new Set(highlightLines);
  const lines = stringify(value).split("\n");

  return (
    <div
      className="rb-code"
      style={{ font: "500 12px/1.7 var(--font-mono)", padding: "10px 12px" }}
    >
      {lines.map((line, i) => {
        const lineNo = i + 1;
        const on = highlight.has(lineNo);
        return (
          <div
            key={lineNo}
            style={{
              display: "grid",
              gridTemplateColumns: "30px 1fr",
              background: on ? "var(--phosphor-08)" : undefined,
            }}
          >
            <span
              style={{
                color: on ? "var(--phosphor)" : "var(--text-low)",
                textAlign: "right",
                paddingRight: 10,
                userSelect: "none",
                font: "500 11px/1.7 var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {lineNo}
            </span>
            <span
              style={{
                color: on ? "var(--phosphor)" : "var(--text-mid)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {line === "" ? " " : line}
            </span>
          </div>
        );
      })}
    </div>
  );
}
