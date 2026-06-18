"use client";

import { type CSSProperties } from "react";

import { type JudgeComparisonRow } from "@/lib/queries/calibration";

import {
  type InterJudgeCell,
  type PairAgreementBucket,
  interJudgeMatrix,
  shortLabel,
  strongestPair,
} from "./lib";

interface BucketStyle {
  background: string;
  color: string;
  glyph: string | null;
}

// Cell fill + glyph by bucket. The value AND a glyph (✓ high / △ low / ✗
// diverged) are always shown, so the matrix is legible without color. The high
// bucket scales its phosphor fill toward the value so stronger pairs read
// brighter, matching the .dc.html (0.88 brighter than 0.82).
function highStyle(value: number): BucketStyle {
  // Map ~0.70–0.90 onto a 22%–34% phosphor mix.
  const mix = Math.round(22 + Math.max(0, Math.min(1, (value - 0.7) / 0.2)) * 12);
  return {
    background: `color-mix(in srgb, var(--phosphor) ${mix}%, transparent)`,
    color: "var(--bg-void)",
    glyph: "✓",
  };
}

const LOW_STYLE: BucketStyle = {
  background: "var(--amber-14)",
  color: "var(--amber)",
  glyph: "△",
};

const DIVERGED_STYLE: BucketStyle = {
  background: "var(--red-14)",
  color: "var(--red)",
  glyph: "✗",
};

const SELF_STYLE: BucketStyle = {
  background: "var(--surface-panel)",
  color: "var(--text-low)",
  glyph: null,
};

function styleFor(cell: InterJudgeCell): BucketStyle {
  if (cell.selfCell) return SELF_STYLE;
  const bucket: PairAgreementBucket = cell.bucket;
  if (bucket === "diverged") return DIVERGED_STYLE;
  if (bucket === "low") return LOW_STYLE;
  return highStyle(cell.value);
}

function HeaderLabel({ label }: { label: string }) {
  return (
    <div
      className="hr-label"
      style={{
        textAlign: "center",
        font: "600 9px/1.2 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--text-low)",
        paddingBottom: 6,
      }}
    >
      {label}
    </div>
  );
}

function RowLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-end" style={{ paddingRight: 7 }}>
      <span
        className="hr-label"
        style={{
          font: "600 9px/1.2 var(--font-mono)",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: active ? "var(--phosphor)" : "var(--text-low)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function MatrixCell({
  cell,
  emphasized,
}: {
  cell: InterJudgeCell;
  emphasized: boolean;
}) {
  const s = styleFor(cell);
  const cellStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    aspectRatio: "1",
    border: "1px solid var(--bg-void)",
    outline: emphasized ? "1px solid var(--border-strong)" : undefined,
    outlineOffset: -1,
    background: s.background,
    color: s.color,
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div style={cellStyle}>
      <span style={{ fontWeight: 600, fontSize: 16 }}>
        {cell.value.toFixed(2)}
      </span>
      {s.glyph ? (
        <span aria-hidden="true" style={{ fontSize: 10, lineHeight: 1 }}>
          {s.glyph}
        </span>
      ) : null}
    </div>
  );
}

export interface InterJudgeMatrixProps {
  judges: JudgeComparisonRow[];
  selectedJudgeId: number | null;
}

/**
 * The N×N inter-judge agreement heatmap. Each off-diagonal cell is the estimated
 * pairwise agreement (derived from the two judges' κ); ✓ high pairs glow
 * phosphor, △ low pairs go amber, the diagonal is an inert 1.00. The caption
 * names the strongest agreeing pair. Hovering the selected judge lifts its row +
 * column.
 */
export function InterJudgeMatrix({ judges, selectedJudgeId }: InterJudgeMatrixProps) {
  const matrix = interJudgeMatrix(judges);
  const strongest = strongestPair(judges);
  const selectedIndex = judges.findIndex((j) => j.judgeId === selectedJudgeId);

  // 64px row-label gutter + one equal column per judge.
  const gridTemplate = `64px ${judges.map(() => "1fr").join(" ")}`;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 0 }}>
        <div />
        {judges.map((judge) => (
          <HeaderLabel key={`h-${judge.judgeId}`} label={shortLabel(judge.judgeName)} />
        ))}

        {matrix.map((cells, rowIdx) => {
          const rowJudge = judges[rowIdx];
          if (rowJudge === undefined) return null;
          return (
            <RowFragment
              key={`r-${rowJudge.judgeId}`}
              label={shortLabel(rowJudge.judgeName)}
              rowActive={rowIdx === selectedIndex}
              cells={cells}
              selectedIndex={selectedIndex}
              rowIdx={rowIdx}
            />
          );
        })}
      </div>

      <p
        className="mono m-0"
        style={{
          font: "500 11px/1.5 var(--font-mono)",
          color: "var(--text-muted)",
          marginTop: 12,
        }}
      >
        {strongest ? (
          <>
            {shortLabel(strongest.a.judgeName).toLowerCase()} ↔{" "}
            {shortLabel(strongest.b.judgeName).toLowerCase()}{" "}
            {strongest.value.toFixed(2)} · anything ↔ the weakest judge drops to
            amber. ✓ high · △ low.
          </>
        ) : (
          <>✓ high · △ low.</>
        )}
      </p>
    </div>
  );
}

function RowFragment({
  label,
  rowActive,
  cells,
  selectedIndex,
  rowIdx,
}: {
  label: string;
  rowActive: boolean;
  cells: InterJudgeCell[];
  selectedIndex: number;
  rowIdx: number;
}) {
  return (
    <>
      <RowLabel label={label} active={rowActive} />
      {cells.map((cell, colIdx) => (
        <MatrixCell
          key={colIdx}
          cell={cell}
          emphasized={
            selectedIndex >= 0 && (rowIdx === selectedIndex || colIdx === selectedIndex)
          }
        />
      ))}
    </>
  );
}
