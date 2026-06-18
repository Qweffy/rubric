"use client";

import { SCORER_TINT, type CrossTabModel } from "./view-model";

interface ScorerCrossTabProps {
  model: CrossTabModel;
}

/** A mono column-header label, e.g. "missing\n2nd-pay". */
function ColumnHeader({ label }: { label: string }) {
  return (
    <span
      style={{
        font: "600 10px/1.2 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--text-low)",
        textAlign: "center",
      }}
    >
      {label}
    </span>
  );
}

/** A single heat cell — value + ▰-bar strength glyph, double-encoded. */
function HeatCell({
  count,
  accent,
  fill,
  bars,
}: {
  count: number;
  accent: string;
  fill: string | undefined;
  bars: string | null;
}) {
  const empty = count === 0;
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        gap: 3,
        height: 46,
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${fill ? "color-mix(in srgb, " + accent + " 36%, transparent)" : "var(--divider)"}`,
        background: fill ?? "transparent",
        fontFamily: "var(--font-mono)",
      }}
    >
      <span
        style={{
          font: "700 14px/1 var(--font-mono)",
          color: empty ? "var(--text-low)" : accent,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {empty ? "·" : count}
      </span>
      {bars ? (
        <span style={{ font: "500 8px/1 var(--font-mono)", letterSpacing: "0.10em", color: accent }}>
          {bars}
        </span>
      ) : null}
    </div>
  );
}

/** Bold mono total cell. */
function TotalCell({ value, accent }: { value: number; accent?: string }) {
  return (
    <span
      className="text-center"
      style={{
        font: "700 14px/1 var(--font-mono)",
        color: accent ?? "var(--text-hi)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
}

/** ▰-bar strength for a cross-tab cell, scaled against the grand total. */
function cellBars(count: number, grandTotal: number): string | null {
  if (count === 0) return null;
  const ratio = grandTotal > 0 ? count / grandTotal : 0;
  if (ratio > 0.3) return count >= grandTotal * 0.4 ? "▰▰▰ HOT" : "▰▰ HOT";
  return "▰";
}

/**
 * ScorerCrossTab — the scorer × cluster matrix showing where failures
 * concentrate. Each cluster's whole count sits in its dominant-scorer row;
 * the dominant cell is "hot" (tinted + ▰ bars). Row and column totals plus a
 * phosphor grand total close the grid. Column template adapts to cluster count.
 */
export function ScorerCrossTab({ model }: ScorerCrossTabProps) {
  const { columns, rows, grandTotal } = model;
  const gridTemplate = `118px repeat(${String(columns.length)},1fr) 64px`;

  return (
    <div className="grid items-center" style={{ gridTemplateColumns: gridTemplate, gap: 6 }}>
      {/* header row */}
      <div />
      {columns.map((col) => (
        <div key={col.id} className="flex justify-center">
          <ColumnHeader label={col.label} />
        </div>
      ))}
      <div className="flex justify-center">
        <span
          style={{
            font: "600 10px/1 var(--font-mono)",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--text-mid)",
          }}
        >
          total
        </span>
      </div>

      {/* scorer rows */}
      {rows.map((row) => {
        const accent = SCORER_TINT[row.scorer].accent;
        return (
          <ScorerRow
            key={row.scorer}
            label={row.label}
            cells={row.cells.map((cell) => ({
              count: cell.count,
              accent,
              fill: cell.hot ? SCORER_TINT[cell.scorer].cellHot : undefined,
              bars: cell.hot ? cellBars(cell.count, grandTotal) : null,
            }))}
            total={row.total}
          />
        );
      })}

      {/* column totals */}
      <span
        style={{
          font: "600 10px/1 var(--font-mono)",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "var(--text-mid)",
        }}
      >
        total
      </span>
      {columns.map((col) => (
        <div key={col.id} className="flex justify-center">
          <TotalCell value={col.total} />
        </div>
      ))}
      <div className="flex justify-center">
        <TotalCell value={grandTotal} accent="var(--phosphor)" />
      </div>
    </div>
  );
}

interface ScorerRowProps {
  label: string;
  cells: { count: number; accent: string; fill: string | undefined; bars: string | null }[];
  total: number;
}

function ScorerRow({ label, cells, total }: ScorerRowProps) {
  return (
    <>
      <span
        style={{
          font: "600 12px/1 var(--font-mono)",
          color: "var(--text-hi)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {label}
      </span>
      {cells.map((cell, i) => (
        <HeatCell key={i} count={cell.count} accent={cell.accent} fill={cell.fill} bars={cell.bars} />
      ))}
      <div className="flex justify-center">
        <TotalCell value={total} />
      </div>
    </>
  );
}
