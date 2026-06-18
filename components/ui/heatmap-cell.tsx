"use client";

import { type CSSProperties, type HTMLAttributes, type ReactNode, useId, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Heatmap cell states. The state drives BOTH the fill AND a glyph, and every
 * cell also shows its mono value — so a cell is never decoded by hue alone:
 *
 * - `pass`   ✓ · --phosphor-08 fill · phosphor glyph/value
 * - `fail`   ✗ · --red-14 fill · red glyph/value
 * - `judge`  ◆ · --violet-16 fill (or none) · violet glyph/value
 * - `skip`   − · no fill · cyan
 * - `pending` · no glyph · low-contrast dot/dash handled by the caller's value
 * - `partial` intermediate · opacity-scaled phosphor fill, glyph from `value`
 */
export type HeatmapState = "pass" | "fail" | "judge" | "skip" | "pending" | "partial";

/** A flip vs the comparison run — the corner triangle (redundant with the row rail). */
export type HeatmapFlip = "up" | "down" | "flip";

interface StateStyle {
  glyph: string;
  color: string;
  /** Base fill at full strength; `partial` scales its opacity by `value`. */
  fill: string;
}

const STATE_STYLES: Record<HeatmapState, StateStyle> = {
  pass: { glyph: "✓", color: "var(--phosphor)", fill: "var(--phosphor-08)" },
  fail: { glyph: "✗", color: "var(--red)", fill: "var(--red-14)" },
  judge: { glyph: "◆", color: "var(--violet)", fill: "var(--violet-16)" },
  skip: { glyph: "−", color: "var(--cyan)", fill: "transparent" },
  pending: { glyph: "·", color: "var(--text-low)", fill: "transparent" },
  partial: { glyph: "△", color: "var(--violet)", fill: "var(--violet-16)" },
};

// Corner flip triangles. `flip` (generic state change) uses an outline triangle
// so it reads distinctly from the directional up/down deltas.
const FLIP_GLYPH: Record<HeatmapFlip, string> = {
  up: "▲",
  down: "▼",
  flip: "△",
};
const FLIP_COLOR: Record<HeatmapFlip, string> = {
  up: "var(--phosphor)",
  down: "var(--red)",
  flip: "var(--amber)",
};

export interface HeatmapCellProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  state: HeatmapState;
  /**
   * Mono value rendered in the cell (alongside the glyph). Pass/fail score
   * ("0.71"), judge tally ("4/5"), or leave undefined to show only the glyph.
   * The value is ALWAYS paired with the glyph so the cell is double-encoded.
   */
  value?: ReactNode;
  /** Hide the glyph (e.g. a judge tally cell where ◆ would be redundant). */
  hideGlyph?: boolean;
  /**
   * For `partial`: 0-1 strength scaling the fill opacity. The number itself
   * must still appear in `value` — opacity is never the sole signal.
   */
  strength?: number;
  /** A flip vs the compared run — drawn as a corner triangle. */
  flip?: HeatmapFlip;
  /** Tooltip body shown on hover (glass card). A string or rich content. */
  tooltip?: ReactNode;
  /** Cell height in px. @default 28 */
  size?: number;
  /** Drop the right gridline (last column in a row). */
  lastInRow?: boolean;
  /** Drop the bottom gridline (last row). */
  lastRow?: boolean;
  onSelect?: () => void;
}

/**
 * HeatmapCell — the square matrix-cell primitive for the Run Detail case×scorer
 * matrix and the Judge Calibration confusion matrix. The fill encodes the value
 * (phosphor pass / red fail / violet judge / opacity for intermediate), 1px
 * gridlines separate cells, and the mono value sits centered.
 *
 * REDUNDANT ENCODING: every cell pairs its fill with the mono value AND a glyph
 * (✓ pass / ✗ fail / △ flip / − skip / ◆ judge), so the matrix is fully legible
 * without color. Hovering lifts the border to `--border-strong` and reveals a
 * glass tooltip.
 */
export function HeatmapCell({
  state,
  value,
  hideGlyph = false,
  strength,
  flip,
  tooltip,
  size = 28,
  lastInRow = false,
  lastRow = false,
  onSelect,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: HeatmapCellProps) {
  const [hovered, setHovered] = useState(false);
  const tooltipId = useId();
  const s = STATE_STYLES[state];

  // `partial` scales the violet fill opacity by strength; the value still shows.
  const fill =
    state === "partial" && strength != null
      ? `color-mix(in srgb, var(--violet) ${Math.round(Math.max(0, Math.min(1, strength)) * 32)}%, transparent)`
      : s.fill;

  const cellStyle: CSSProperties = {
    position: "relative",
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    background: fill,
    color: s.color,
    borderRight: lastInRow ? "none" : "1px solid var(--divider)",
    borderBottom: lastRow ? "none" : "1px solid var(--divider)",
    outline: hovered ? "1px solid var(--border-strong)" : undefined,
    outlineOffset: -1,
    font: "var(--mono-sm)",
    fontVariantNumeric: "tabular-nums",
    cursor: onSelect ? "pointer" : tooltip ? "default" : undefined,
    transition: "outline-color var(--dur-fast)",
    ...style,
  };

  const show = (): void => setHovered(true);
  const hide = (): void => setHovered(false);

  return (
    <div
      className={cn(className)}
      style={cellStyle}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-describedby={tooltip && hovered ? tooltipId : undefined}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        show();
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        hide();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        show();
      }}
      onBlur={(e) => {
        onBlur?.(e);
        hide();
      }}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      {...rest}
    >
      {!hideGlyph && (
        <span aria-hidden="true" style={{ lineHeight: 1 }}>
          {s.glyph}
        </span>
      )}
      {value != null && <span>{value}</span>}

      {flip && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 1,
            right: 2,
            fontSize: 8,
            lineHeight: 1,
            color: FLIP_COLOR[flip],
          }}
        >
          {FLIP_GLYPH[flip]}
        </span>
      )}

      {tooltip && hovered && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "var(--z-dropdown)",
            minWidth: 180,
            maxWidth: 300,
            width: "max-content",
            padding: "9px 11px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            background: "var(--glass)",
            backdropFilter: "blur(var(--blur-glass))",
            WebkitBackdropFilter: "blur(var(--blur-glass))",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-control)",
            boxShadow: "var(--shadow-card)",
            font: "var(--mono-sm)",
            color: "var(--text-mid)",
            textAlign: "left",
            pointerEvents: "none",
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
