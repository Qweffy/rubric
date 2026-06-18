import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Diff line kinds. The kind drives BOTH the gutter glyph and the fill, so the
 * meaning never rides on hue alone:
 *
 * - `context`  unchanged  · no glyph · no fill
 * - `add`      added      · "+" gutter · phosphor text on --phosphor-08
 * - `remove`   removed    · "−" gutter · red text on --red-14
 * - `cause`    annotation · "↑" gutter · amber text on --amber-14 (points at the
 *              line above as the likely cause of a regression)
 */
export type DiffLineKind = "context" | "add" | "remove" | "cause";

interface KindStyle {
  /** The gutter glyph — a real character, the primary (non-hue) signal. */
  glyph: string;
  glyphColor: string;
  bg: string;
  codeColor: string;
}

const KIND_STYLES: Record<DiffLineKind, KindStyle> = {
  context: {
    glyph: " ",
    glyphColor: "var(--text-low)",
    bg: "transparent",
    codeColor: "var(--text-mid)",
  },
  add: {
    glyph: "+",
    glyphColor: "var(--phosphor)",
    bg: "var(--phosphor-08)",
    codeColor: "var(--text-hi)",
  },
  remove: {
    glyph: "−",
    glyphColor: "var(--red)",
    bg: "var(--red-14)",
    codeColor: "var(--text-hi)",
  },
  cause: {
    glyph: "↑",
    glyphColor: "var(--amber)",
    bg: "var(--amber-14)",
    codeColor: "var(--text-hi)",
  },
};

const FONT_DIFF = "500 12.5px/1.7 var(--font-mono)";

/** One column of a side-by-side line: number + glyph + code, or a blank gutter. */
interface SideCell {
  /** Line number; omit for a blank (no counterpart on this side). */
  num?: number;
  kind: DiffLineKind;
  code?: ReactNode;
  /** Render this side as an empty placeholder (the other side changed). */
  empty?: boolean;
}

const numStyle: CSSProperties = {
  padding: "1px 6px",
  textAlign: "right",
  color: "var(--text-low)",
  userSelect: "none",
  background: "rgba(255,255,255,0.012)",
  whiteSpace: "pre",
  overflow: "hidden",
  fontVariantNumeric: "tabular-nums",
};

const glyphStyle: CSSProperties = {
  padding: "1px 6px",
  textAlign: "center",
  userSelect: "none",
  fontWeight: 700,
  whiteSpace: "pre",
  overflow: "hidden",
};

const codeStyle: CSSProperties = {
  padding: "1px 6px",
  whiteSpace: "pre",
  overflow: "hidden",
};

const EMPTY_BG = "rgba(0,0,0,0.22)";

function renderSide(cell: SideCell, key: string): ReactNode[] {
  const s = KIND_STYLES[cell.kind];
  if (cell.empty) {
    return [
      <div key={`${key}-n`} style={{ ...numStyle, background: EMPTY_BG }}>
        {" "}
      </div>,
      <div key={`${key}-g`} style={{ ...glyphStyle, background: EMPTY_BG }}>
        {" "}
      </div>,
      <div key={`${key}-c`} style={{ ...codeStyle, background: EMPTY_BG }}>
        {" "}
      </div>,
    ];
  }
  return [
    <div key={`${key}-n`} style={{ ...numStyle, background: cell.kind === "context" ? numStyle.background : s.bg }}>
      {cell.num ?? " "}
    </div>,
    <div key={`${key}-g`} style={{ ...glyphStyle, color: s.glyphColor, background: s.bg }}>
      {s.glyph}
    </div>,
    <div key={`${key}-c`} style={{ ...codeStyle, color: s.codeColor, background: s.bg }}>
      {cell.code}
    </div>,
  ];
}

export interface DiffLineProps extends HTMLAttributes<HTMLDivElement> {
  /** `side-by-side` (default) renders BASE | HEAD; `unified` is single-column. */
  variant?: "side-by-side" | "unified";

  // --- side-by-side ---
  /** Left (BASE) column. */
  base?: SideCell;
  /** Right (HEAD) column. */
  head?: SideCell;

  // --- unified ---
  /** Line kind (unified). */
  kind?: DiffLineKind;
  /** Old-side line number (unified). Blank on additions. */
  oldNum?: number;
  /** New-side line number (unified). Blank on removals. */
  newNum?: number;
  /** Line content (unified). */
  code?: ReactNode;
}

/**
 * DiffLine — the monospace diff row primitive behind the Regression Diff prompt
 * diff. Line-numbered, with a meaning-bearing gutter glyph (`+` / `−` / `↑`)
 * that carries the add/remove/cause signal redundantly with the fill, so the
 * row never depends on color alone.
 *
 * `side-by-side` lays out BASE and HEAD columns (each a number · glyph · code
 * triple, with `empty` placeholders where a side has no counterpart). `unified`
 * collapses to a single column with paired old/new line numbers.
 */
export function DiffLine({
  variant = "side-by-side",
  base,
  head,
  kind = "context",
  oldNum,
  newNum,
  code,
  className,
  style,
  ...rest
}: DiffLineProps) {
  if (variant === "unified") {
    const s = KIND_STYLES[kind];
    return (
      <div
        className={cn(className)}
        style={{
          display: "grid",
          gridTemplateColumns: "38px 38px 20px 1fr",
          font: FONT_DIFF,
          background: s.bg,
          ...style,
        }}
        {...rest}
      >
        <div style={{ ...numStyle, background: "transparent" }}>{oldNum ?? " "}</div>
        <div
          style={{
            ...numStyle,
            background: "transparent",
            color: kind === "add" ? s.glyphColor : "var(--text-low)",
          }}
        >
          {newNum ?? " "}
        </div>
        <div style={{ ...glyphStyle, background: "transparent", color: s.glyphColor }}>
          {s.glyph}
        </div>
        <div style={{ ...codeStyle, background: "transparent", color: s.codeColor }}>
          {code}
        </div>
      </div>
    );
  }

  const baseCell: SideCell = base ?? { kind: "context", empty: true };
  const headCell: SideCell = head ?? { kind: "context", empty: true };

  return (
    <div
      className={cn(className)}
      style={{
        display: "grid",
        gridTemplateColumns: "38px 20px 1fr 38px 20px 1fr",
        font: FONT_DIFF,
        ...style,
      }}
      {...rest}
    >
      {renderSide(baseCell, "base")}
      {renderSide(headCell, "head")}
    </div>
  );
}

export interface DiffCollapseProps extends HTMLAttributes<HTMLDivElement> {
  /** Count of hidden unchanged lines. */
  count: number;
  /** Override the label (defaults to "… N unchanged lines"). */
  label?: ReactNode;
}

/**
 * DiffCollapse — the full-width "… N unchanged lines" expander row that stands
 * in for a run of context lines in either diff variant.
 */
export function DiffCollapse({ count, label, className, style, ...rest }: DiffCollapseProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      style={{
        gridColumn: "1 / -1",
        textAlign: "center",
        font: FONT_DIFF,
        color: "var(--text-low)",
        background: "rgba(255,255,255,0.015)",
        borderTop: "1px solid var(--divider)",
        borderBottom: "1px solid var(--divider)",
        padding: "1px 6px",
        ...style,
      }}
      {...rest}
    >
      {label ?? `… ${count} unchanged lines`}
    </div>
  );
}
