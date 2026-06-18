"use client";

import { type CSSProperties } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Tool-confusion matrix.                                              */
/* The list query exposes no confusion-matrix field, so the cell grid  */
/* is derived here from the canonical refund-agent tool set — the      */
/* design (.dc.html) is the data contract for this illustrative panel. */
/* expected ↓ vs. actual →; the hot cell is the redundant search call. */
/* ------------------------------------------------------------------ */

/** Actual-tool columns (→). "escal" / "none" are abbreviated in the header. */
const COLUMNS = ["search", "seats", "hold", "confirm", "escal", "none"] as const;

type CellTone = "correct" | "drift" | "safety" | "empty";

interface Cell {
  value: number | "·";
  tone: CellTone;
  /** Hover tooltip body, e.g. the redundant-search callout. */
  title?: string;
}

interface MatrixRow {
  /** Expected tool (↓). */
  label: string;
  /** Emphasise the expected label (the loud check_seats row). */
  loud?: boolean;
  cells: Cell[];
}

const EMPTY: Cell = { value: "·", tone: "empty" };

/** Canonical confusion grid — values mirror the design's seeded matrix. */
const ROWS: MatrixRow[] = [
  {
    label: "search_flights",
    cells: [
      { value: 34, tone: "correct" },
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
    ],
  },
  {
    label: "check_seats",
    loud: true,
    cells: [
      { value: 6, tone: "safety", title: "6 tasks called an extra search_flights" },
      { value: 28, tone: "correct" },
      EMPTY,
      EMPTY,
      EMPTY,
      { value: 2, tone: "drift" },
    ],
  },
  {
    label: "hold_seat",
    cells: [EMPTY, EMPTY, { value: 22, tone: "correct" }, { value: 1, tone: "drift" }, EMPTY, EMPTY],
  },
  {
    label: "confirm_booking",
    cells: [EMPTY, EMPTY, EMPTY, { value: 30, tone: "correct" }, EMPTY, { value: 3, tone: "safety", title: "3 tasks stopped without confirming" }],
  },
  {
    label: "escalate",
    cells: [EMPTY, EMPTY, EMPTY, EMPTY, { value: 8, tone: "correct" }, { value: 1, tone: "drift" }],
  },
  {
    label: "none",
    cells: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, { value: 12, tone: "correct" }],
  },
];

const GRID_COLS = "74px repeat(6,1fr)";

const TONE_STYLE: Record<CellTone, CSSProperties> = {
  correct: {
    background: "var(--phosphor-12)",
    border: "1px solid var(--border-strong)",
  },
  drift: {
    background: "var(--amber-14)",
    border: "1px solid transparent",
  },
  safety: {
    background: "color-mix(in srgb, var(--red) 22%, transparent)",
    border: "1px solid var(--red)",
    boxShadow: "var(--glow-red)",
  },
  empty: {
    background: "rgba(255,255,255,0.015)",
    border: "1px solid transparent",
  },
};

const TONE_GLYPH: Record<Exclude<CellTone, "empty">, { glyph: string; color: string }> = {
  correct: { glyph: "✓", color: "var(--phosphor)" },
  drift: { glyph: "✗", color: "var(--amber)" },
  safety: { glyph: "✗", color: "var(--red)" },
};

function MatrixCell({ cell }: { cell: Cell }) {
  const cellStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    height: 46,
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
    ...TONE_STYLE[cell.tone],
  };

  if (cell.tone === "empty") {
    return (
      <div style={cellStyle}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-low)" }}>·</span>
      </div>
    );
  }

  const g = TONE_GLYPH[cell.tone];
  return (
    <div style={cellStyle} title={cell.title}>
      <span style={{ fontSize: 13, fontWeight: 600, color: g.color }}>{cell.value}</span>
      <span style={{ fontSize: 10, lineHeight: 1, color: g.color }}>{g.glyph}</span>
    </div>
  );
}

const COL_HEADER: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  color: "var(--text-low)",
  textAlign: "center",
};

function rowLabelStyle(loud?: boolean): CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: 9.5,
    color: loud ? "var(--text-hi)" : "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 6,
  };
}

function LegendSwatch({ style }: { style: CSSProperties }) {
  return (
    <span
      style={{ width: 11, height: 11, borderRadius: 2, flex: "none", ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * ToolConfusion — the expected-vs-actual tool confusion heatmap. The diagonal
 * is phosphor (correct), off-diagonal cells are amber (minor drift) or red
 * (safety-relevant), and every cell pairs its fill with the mono count AND a
 * glyph so the matrix reads without color. Below it: the redundant-search
 * callout and the three-state legend.
 */
export function ToolConfusion() {
  return (
    <Card
      header="TOOL CONFUSION"
      actions={
        <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}>
          expected ↓ · actual →
        </span>
      }
      padding={false}
    >
      <div style={{ padding: "14px 16px 16px" }}>
        {/* column headers */}
        <div
          className="grid"
          style={{ gridTemplateColumns: GRID_COLS, gap: 4, marginBottom: 4 }}
        >
          <div />
          {COLUMNS.map((c) => (
            <div key={c} style={{ ...COL_HEADER, whiteSpace: "nowrap" }}>
              {c}
            </div>
          ))}
        </div>

        {/* rows */}
        <div className="flex flex-col" style={{ gap: 4 }}>
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="grid"
              style={{ gridTemplateColumns: GRID_COLS, gap: 4 }}
            >
              <div style={rowLabelStyle(row.loud)}>{row.label}</div>
              {row.cells.map((cell, i) => (
                <MatrixCell key={`${row.label}-${i}`} cell={cell} />
              ))}
            </div>
          ))}
        </div>

        {/* callout */}
        <div
          className="flex items-start"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            gap: 9,
            background: "var(--red-14)",
            border: "1px solid color-mix(in srgb, var(--red) 32%, transparent)",
            borderRadius: "var(--radius-control)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.3,
              color: "var(--red)",
            }}
            aria-hidden="true"
          >
            ✗
          </span>
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-hi)" }}>
              check_seats → search_flights · 6
            </span>
            <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}>
              6 tasks called an extra search_flights
            </span>
          </div>
        </div>

        {/* legend */}
        <div className="flex flex-wrap" style={{ marginTop: 12, gap: 14 }}>
          <span
            className={cn("flex items-center")}
            style={{ font: "var(--mono-sm)", fontSize: 10, gap: 5, color: "var(--text-muted)" }}
          >
            <LegendSwatch style={TONE_STYLE.correct} />✓ correct
          </span>
          <span
            className="flex items-center"
            style={{ font: "var(--mono-sm)", fontSize: 10, gap: 5, color: "var(--text-muted)" }}
          >
            <LegendSwatch style={TONE_STYLE.drift} />✗ minor drift
          </span>
          <span
            className="flex items-center"
            style={{ font: "var(--mono-sm)", fontSize: 10, gap: 5, color: "var(--text-muted)" }}
          >
            <LegendSwatch style={TONE_STYLE.safety} />✗ safety
          </span>
        </div>
      </div>
    </Card>
  );
}
